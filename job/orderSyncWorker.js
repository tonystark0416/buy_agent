/**
 * 订单同步常驻工作进程（PM2: cps-sync-worker）
 *
 * 职责:
 * 1. 每 SYNC_INTERVAL_MINUTES 分钟增量拉取唯品会 + 美团最近 SYNC_RECENT_HOURS 小时的订单
 *    （按更新时间维度查询：新订单与老订单状态变化都能被捕获；两平台 API 单次查询限 1 小时，自动按小时分段）
 * 2. 每天 03:00 后第一轮额外做一次「昨天 ~ 今天」全量兜底补拉（防增量窗口遗漏，如 API 延迟）
 *
 * 运行方式: PM2 常驻（autorestart: true），由 ecosystem.config.js 管理
 * 手动立即触发一轮: pm2 restart cps-sync-worker
 * 补拉历史日期: node job/vipOrderSync.js 2026-09-01 2026-09-30（CLI 不走本进程）
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const vipSync = require('./vipOrderSync');
const meituanSync = require('./meituanOrderSync');

const INTERVAL_MIN = Number(process.env.SYNC_INTERVAL_MINUTES || 5); // 同步间隔（分钟）
const RECENT_HOURS = Number(process.env.SYNC_RECENT_HOURS || 2);     // 增量回溯窗口（小时），需大于同步间隔
const CATCHUP_HOUR = 3;                                              // 每天 03:00 后做一次全量兜底
const CATCHUP_GUARD_MIN = 60;                                        // 03:00~04:00 内执行兜底

let running = false;          // 上一轮未完成时跳过本轮，防重叠
let lastCatchupDate = '';     // 兜底补拉每日只做一次

/** 本地日期 YYYY-MM-DD（不走 toISOString，避免 UTC 偏移） */
function localDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 每日全量兜底：拉取昨天 ~ 今天（按下单时间，覆盖两个平台） */
async function dailyCatchup() {
    const now = new Date();
    const end = localDate(now);
    const start = localDate(new Date(now.getTime() - 24 * 3600 * 1000));
    console.log(`[worker] ===== 每日兜底全量补拉 ${start} ~ ${end} =====`);
    await vipSync.pullOrdersByDateRange(start, end);
    await meituanSync.pullOrdersByDateRange(start, end);
    lastCatchupDate = end;
}

/** 一轮同步：vip 增量 → meituan 增量 →（到达兜底时段）每日全量 */
async function tick(trigger) {
    if (running) {
        console.log(`[worker] 上一轮尚未完成，跳过本次触发（${trigger}）`);
        return;
    }
    running = true;
    const startedAt = Date.now();
    try {
        const vip = await vipSync.syncRecent(RECENT_HOURS);
        console.log(`[worker][vip] 增量(${RECENT_HOURS}h): 拉取 ${vip.fetched} 笔, 入库 ${JSON.stringify(vip.stats)}`);

        const mt = await meituanSync.syncRecent(RECENT_HOURS);
        console.log(`[worker][meituan] 增量(${RECENT_HOURS}h): 拉取 ${mt.fetched} 笔, 入库 ${JSON.stringify(mt.stats)}`);

        // 每日兜底：03:00~04:00 时段内做一次（lastCatchupDate 防重复）
        const now = new Date();
        if (now.getHours() >= CATCHUP_HOUR
            && now.getHours() < CATCHUP_HOUR + 1
            && lastCatchupDate !== localDate(now)) {
            await dailyCatchup();
        }

        console.log(`[worker] 本轮完成，耗时 ${Date.now() - startedAt}ms`);
    } catch (err) {
        console.error('[worker] 本轮同步失败（下轮自动重试）:', err.message || err);
    } finally {
        running = false;
    }
}

// 启动即先跑一轮（pm2 restart = 立即同步一次），之后按间隔循环
console.log(`[worker] 订单同步工作进程启动: 间隔 ${INTERVAL_MIN} 分钟, 增量窗口 ${RECENT_HOURS} 小时`);
tick('进程启动').catch((e) => console.error('[worker] 启动轮异常:', e));
setInterval(() => tick('定时触发').catch((e) => console.error('[worker] 定时轮异常:', e)), INTERVAL_MIN * 60 * 1000);
