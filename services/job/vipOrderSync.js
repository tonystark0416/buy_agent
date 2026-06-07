

const cron = require('node-cron');
// 假设你的 vipOpenApiRequest 和 orderList 已实现并导出
const { orderList } = require('../platforms/vipService'); // 根据实际路径修改

/**
 * 拉取指定时间范围内的订单（自动处理分页）
 * @param {number} startTimestamp - 开始时间戳（毫秒）
 * @param {number} endTimestamp   - 结束时间戳（毫秒）
 * @param {number} status         - 订单状态（可选，0-不合格，1-待定，2-已完结）
 * @returns {Promise<Array>}      - 订单列表
 */
async function fetchOrdersByTimeRange(startTimestamp, endTimestamp, status = undefined) {
    let allOrders = [];
    let page = 1;
    const pageSize = 20; // 建议调大以减少请求次数（唯品会最大一般支持100）
    let hasMore = true;

    while (hasMore) {
        const requestParams = {
            status,
            orderTimeStart: startTimestamp,
            orderTimeEnd: endTimestamp,
            page,
            pageSize
        };
        console.log(`[请求] 第 ${page} 页，时间区间 ${startTimestamp} ~ ${endTimestamp}`);

        const response = await orderList(requestParams);
        const orders = response?.orderInfoList || [];
        allOrders = allOrders.concat(orders);

        // 判断是否还有下一页
        const totalCount = response?.total || 0;
        hasMore = allOrders.length < totalCount;
        page++;
        // 防止死循环（最多拉取100页）
        if (page > 100) break;
    }

    console.log(`[完成] 共拉取 ${allOrders.length} 笔订单`);
    return allOrders;
}

/**
 * 每小时整点执行的任务
 * 拉取上一个整点到当前整点之间的订单
 */
async function hourlyPullTask() {
    const now = new Date();
    // 当前整点时间（毫秒），例如 2026-06-08 10:00:00.000
    const endTime = new Date(now);
    endTime.setMinutes(0, 0, 0);
    // 上一个整点时间（毫秒），例如 2026-06-08 09:00:00.000
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

    const startTs = startTime.getTime();
    console.log(startTs)
    const endTs = endTime.getTime();
    console.log(endTs)

    console.log(`[定时任务] 开始拉取订单，时间区间：${startTime.toISOString()} ~ ${endTime.toISOString()}`);

    try {
        // 拉取所有状态订单（status 不传则默认全部）
        const orders = await fetchOrdersByTimeRange(startTs, endTs);

        // ========= 这里添加你的后续处理逻辑 =========
        // 例如：存入数据库、更新缓存、发送通知等
        // await saveOrdersToDB(orders);
        console.log(`[成功] 共处理 ${orders.length} 笔订单`);
    } catch (error) {
        console.error('[错误] 拉取订单失败:', error);
        // 可选：发送告警邮件或钉钉通知
    }
}

// ================= 启动定时任务 =================
// cron 表达式: 秒 分 时 日 月 星期
// 每小时整点（例如 10:00:00）执行一次
cron.schedule('0 0 * * * *', () => {
    hourlyPullTask();
}, {
    timezone: "Asia/Shanghai"   // 确保使用北京时间
});

console.log('定时任务已启动，每小时整点拉取唯品会订单...');