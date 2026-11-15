/**
 * PM2 配置文件（ecosystem）— buy_agent
 *
 * 常用命令（服务器项目根目录执行）:
 *   pm2 start ecosystem.config.js                                  # 启动全部（API + 两个同步任务）
 *   pm2 start ecosystem.config.js --only buy-agent-vip-sync        # 只启动某个（api / vip-sync / meituan-sync）
 *   pm2 restart buy-agent-vip-sync                                 # 手动立即触发一次同步
 *   pm2 logs buy-agent-vip-sync                                    # 查看日志（--lines 200 看更多）
 *   pm2 list / pm2 delete buy-agent-vip-sync
 *
 * 进程说明:
 * - buy-agent-api: API 常驻服务（3000 端口）。
 *   ⚠ 若 API 目前已由宝塔面板的 PM2 管理，请勿双开——要么用 --only 只启动 sync-worker，
 *     要么停掉宝塔那个后统一切到本文件管理（推荐，配置进 git 可复现）。
 * - cps-sync-worker: 订单同步常驻工作进程（唯品会 + 美团合一）——
 *   每 5 分钟增量拉取最近 2 小时订单（按更新时间维度，新单与状态变化都覆盖；
 *   两平台 API 单次查询限 1 小时，自动按小时分段），每天 03:00 后全量兜底补拉一次昨天~今天。
 *   间隔/窗口可用环境变量 SYNC_INTERVAL_MINUTES / SYNC_RECENT_HOURS 调整。
 *   手动立即触发一轮: pm2 restart cps-sync-worker
 *   补拉历史日期仍用 CLI: node job/vipOrderSync.js 2026-09-26 2026-09-30
 *
 * 日志: logs/pm2/*.log（time: true 每行带时间戳；logs/ 已在 .gitignore）
 */
module.exports = {
  apps: [
    {
      name: 'buy-agent-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
      out_file: 'logs/pm2/api-out.log',
      error_file: 'logs/pm2/api-error.log',
      time: true,
    },
    {
      name: 'cps-sync-worker',
      script: 'job/orderSyncWorker.js',
      cwd: __dirname,
      autorestart: true,                 // 常驻进程，崩溃自动拉起
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        SYNC_INTERVAL_MINUTES: '5',      // 同步间隔（分钟）
        SYNC_RECENT_HOURS: '2',          // 增量回溯窗口（小时）
      },
      out_file: 'logs/pm2/sync-worker-out.log',
      error_file: 'logs/pm2/sync-worker-error.log',
      time: true,
    },
  ],
};
