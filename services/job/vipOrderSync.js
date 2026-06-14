/**
 * 定时任务：每小时整点拉取唯品会订单
 */

const cron = require('node-cron');

const { orderList } = require('../platforms/vipService');
const { createAdpOrder, findOrder, updateOrder } = require('../../models/adpOrder');
const { formatBeijing } = require('../../utils/timeUtils');



/**
 * 拉取指定时间范围内的订单（自动处理分页）
 * @param {number} startTimestamp - 开始时间戳（毫秒）
 * @param {number} endTimestamp   - 结束时间戳（毫秒）
 * @param {number} status         - 订单状态（可选，0-不合格，1-待定，2-已完结）
 * @returns {Promise<Array>}      - 订单列表
 */
async function fetchOrdersByTimeRange(startTimestamp, endTimestamp) {

    let allOrders = []; //整体订单数组
    let page = 1;
    const pageSize = 20; // 建议调大以减少请求次数（唯品会最大一般支持100）
    let hasMore = true;

    while (hasMore) {
        const requestParams = {
            status: 0,
            orderTimeStart: startTimestamp,
            orderTimeEnd: endTimestamp,
            page,
            pageSize
        };
        console.log(`[正在请求] 第 ${page} 页，时间区间 ${startTimestamp} ~ ${endTimestamp}`);

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
 * 保存或更新订单到数据库
 * - 若订单存在，则更新状态
 * - 若不存在，则插入新订单
 * @param {Array} orders - 唯品会订单原始数据
 */
async function saveOrdersToDatabase(orders) {
    let insertCount = 0, updateCount = 0, errorCount = 0; //统计数据

    for (const order of orders) {
        const orderSn = order.orderSn;          
        const newStatus = order.status;

        const orderData = {
            order_sn: orderSn,
            status: newStatus,                      // 新状态
            platform: 'vip',                     // 平台固定
            order_amount: order.totalCost,
            commission: order.commission,
            create_time: order.orderTime
        };

        try {
            const existing = await findOrder(orderSn);
            if (existing) {
                await updateOrder(orderData);
                updateCount++;
            } else {
                await createAdpOrder(orderData);
                insertCount++;
            }
        } catch (error) {
            console.error(`[错误] 处理订单 ${orderSn} 时出错:`, error);
            errorCount++;
        }
    }
    return { insertCount, updateCount, errorCount };
}

/**
 * 每小时整点执行的任务
 * 拉取上一个整点到当前整点之间的订单
 */
async function minutelyPullTask(startTs, endTs) {

    try {
        const orders = await fetchOrdersByTimeRange(startTs, endTs);

        if (orders.length === 0) {
            console.log('[定时任务] 该时间段无订单');
            return;
        }
        console.log(orders);

        // ========= 这里添加你的后续处理逻辑 =========
        // 例如：存入数据库、更新缓存、发送通知等
        const stats = await saveOrdersToDatabase(orders);
        console.log('入库统计:', stats);
        console.log(`[成功] 共处理 ${orders.length} 笔订单`);
        console.log('================= 本次拉取任务已结束 =================');
    } catch (error) {
        console.error('[错误] 拉取订单失败:', error);
        // 可选：发送告警邮件或钉钉通知
    }
}



// ================= 启动定时任务 =================
// cron 表达式: 秒 分 时 日 月 星期
// 每小时整点（例如 10:00:00）执行一次
cron.schedule('0 * * * * *', () => {
    const now = new Date();
    // 当前分钟的起始（毫秒，精确到秒的0秒）
    const currentMinuteStart = new Date(now);
    currentMinuteStart.setSeconds(0, 0);
    // 上一分钟的起始
    const lastMinuteStart = new Date(currentMinuteStart.getTime() - 60 * 1000);

    const startTs = lastMinuteStart.getTime();
    const endTs = currentMinuteStart.getTime();
    // const startTs = 1781441439000
    // const endTs = 1781442439000
    console.log(`[定时任务] 开始拉取订单，时间区间：${formatBeijing(lastMinuteStart)} ~ ${formatBeijing(currentMinuteStart)}`);

    minutelyPullTask(startTs, endTs); //执行任务

}, {
    timezone: "Asia/Shanghai"   // 确保使用北京时间
});

console.log('定时任务已启动，每小时整点拉取唯品会订单...');


// fetchOrdersByTimeRange(1780851600000, 1780855200000).then(orders => {
//     console.log(orders);
// }).catch(err => {
//     console.error(err);
// });

// minutelyPullTask(); // 立即执行一次（测试用）