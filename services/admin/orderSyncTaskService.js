/**
 * 后台手动同步订单 - 任务管理器（内存态）
 *
 * 设计:
 * - 每个同步任务一个 taskId，状态 running/success/failed，前端轮询 /sync/status 获取进度
 * - 进度由 job 脚本逐小时分段回调上报（拉一段入一段库），长任务（如 30 天≈720 个小时段）
 *   前端可实时看到百分比
 * - 同一平台同时只允许一个任务（防重复拉取/接口限流），不同平台可并行
 * - 任务结果按 order_sn upsert 入库，重复拉取幂等
 * - 内存态：进程重启任务丢失（重启中断的长任务重新发起即可，幂等无害）；仅保留最近 50 条记录
 *
 * 注: 任务跑在 API 进程内（后台手动触发），与常驻 worker（buy-agent-sync-worker，5 分钟增量）
 *     互不干扰——两者都是按 order_sn upsert，并发写安全
 */

const crypto = require('crypto');
const vipSync = require('../../job/vipOrderSync');
const meituanSync = require('../../job/meituanOrderSync');

const SYNC_JOBS = {
  vip: { fn: vipSync.pullOrdersByDateRange, label: '唯品会' },
  meituan: { fn: meituanSync.pullOrdersByDateRange, label: '美团' },
};

const MAX_RANGE_DAYS = 30;   // 单次同步最大时间区间
const MAX_TASK_RECORDS = 50; // 内存保留最近任务数

/** taskId -> task */
const tasks = new Map();
/** platform -> taskId（运行中互斥） */
const runningByPlatform = new Map();

class BizError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function assertDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) {
    throw new BizError('日期格式不正确，应为 YYYY-MM-DD');
  }
  const d = new Date(`${s} 00:00:00`);
  if (isNaN(d.getTime())) throw new BizError('日期无效');
  return d;
}

/** 对外视图（隐藏内部字段） */
function toView(task) {
  return {
    id: task.id,
    platform: task.platform,
    platformLabel: task.platformLabel,
    startDate: task.startDate,
    endDate: task.endDate,
    status: task.status,
    progress: task.progress,
    result: task.result,
    error: task.error,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
    durationMs: task.finishedAt ? task.finishedAt - task.startedAt : null,
  };
}

function startSync({ platform, startDate, endDate }) {
  const job = SYNC_JOBS[platform];
  if (!job) {
    throw new BizError(`不支持的平台: ${platform}（可选: vip / meituan）`);
  }

  const start = assertDate(startDate);
  const end = assertDate(endDate);
  if (start > end) {
    throw new BizError('开始日期不能晚于结束日期');
  }
  const today = new Date(); today.setHours(23, 59, 59, 999);
  if (end > today) {
    throw new BizError('结束日期不能晚于今天');
  }
  const rangeDays = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new BizError(`时间区间最长 ${MAX_RANGE_DAYS} 天（当前 ${rangeDays} 天）`);
  }

  if (runningByPlatform.has(platform)) {
    const runningTask = tasks.get(runningByPlatform.get(platform));
    throw new BizError(`${job.label}已有同步任务在进行中（${runningTask ? runningTask.startDate + ' ~ ' + runningTask.endDate : ''}），请等待完成后再发起`);
  }

  const task = {
    id: crypto.randomUUID(),
    platform,
    platformLabel: job.label,
    startDate,
    endDate,
    status: 'running',
    progress: { done: 0, total: rangeDays * 24 },
    result: null,
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
  tasks.set(task.id, task);
  runningByPlatform.set(platform, task.id);

  // 后台执行，不阻塞响应；进度通过 task 对象透出
  (async () => {
    try {
      const totals = await job.fn(startDate, endDate, (p) => {
        task.progress = { done: p.done, total: p.total };
        task.result = p.totals; // 实时透出入库统计
      });
      task.status = 'success';
      task.result = totals;
    } catch (err) {
      console.error(`[orderSyncTask] ${platform} 同步失败:`, err.message || err);
      task.status = 'failed';
      task.error = err.message || '同步失败';
    } finally {
      task.finishedAt = Date.now();
      runningByPlatform.delete(platform);
    }
  })();

  return toView(task);
}

function getTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) throw new BizError('任务不存在或已被清理', 404);
  return toView(task);
}

/** 最近任务列表（用于页面刷新后恢复运行中任务的展示） */
function listTasks(limit = 20) {
  return [...tasks.values()]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit)
    .map(toView);
}

module.exports = { startSync, getTask, listTasks, MAX_RANGE_DAYS };
