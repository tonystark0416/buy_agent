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
 *   ⚠ 若 API 目前已由宝塔面板的 PM2 管理，请勿双开——要么只启动两个同步任务
 *     （pm2 start ecosystem.config.js --only buy-agent-vip-sync 后再启动 meituan-sync），
 *     要么停掉宝塔那个后统一切到本文件管理（推荐，配置进 git 可复现）。
 * - buy-agent-vip-sync / buy-agent-meituan-sync: 订单同步为「一次性任务」进程——
 *   启动 → 拉取昨天~今天订单入库 → 显式 process.exit 退出 → 由 PM2 cron_restart 到点再拉起。
 *   cron_schedule 每天两次（唯品会 02:00/14:00、美团 02:30/14:30，Asia/Shanghai），
 *   拉两次是因为 CPS 订单状态（已付款→已结算/失效）会变化，覆盖早晚会各一次。
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
      name: 'buy-agent-vip-sync',
      script: 'job/vipOrderSync.js',
      cwd: __dirname,
      autorestart: false,               // 一次性任务：跑完即退，到点由 cron 再拉起
      cron_restart: '0 2,14 * * *',     // 每天 02:00 / 14:00
      cron_timezone: 'Asia/Shanghai',
      env: { NODE_ENV: 'production' },
      out_file: 'logs/pm2/vip-sync-out.log',
      error_file: 'logs/pm2/vip-sync-error.log',
      time: true,
    },
    {
      name: 'buy-agent-meituan-sync',
      script: 'job/meituanOrderSync.js',
      cwd: __dirname,
      autorestart: false,
      cron_restart: '30 2,14 * * *',    // 每天 02:30 / 14:30（与唯品会错开）
      cron_timezone: 'Asia/Shanghai',
      env: { NODE_ENV: 'production' },
      out_file: 'logs/pm2/meituan-sync-out.log',
      error_file: 'logs/pm2/meituan-sync-error.log',
      time: true,
    },
  ],
};
