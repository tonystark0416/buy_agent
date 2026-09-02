


/**
 * 定时任务：每小时整点拉取唯品会订单
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cron = require('node-cron');
const { orderList } = require('../services/platforms/vipService');
const { createAdpOrder, findOrder, updateOrder } = require('../models/adpOrder');
const { formatBeijing } = require('../utils/timeUtils');


/**
 * 按日期范围按小时循环拉取订单
 * 例如：2026-08-20 ~ 2026-08-25，会自动拆成每小时一个区间
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} endDate   - 结束日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>}
 */
async function fetchOrdersByDateRange(startDate, endDate) {
    const start = new Date(`${startDate} 00:00:00`);
    const end = new Date(`${endDate} 23:59:59.999`);

    const allOrders = [];
    let cursor = new Date(start);

    while (cursor <= end) {
        const startTs = cursor.getTime();
        const endTs = Math.min(startTs + 60 * 60 * 1000, end.getTime());

        console.log(`[按日期范围] 拉取 ${new Date(startTs).toLocaleString()} ~ ${new Date(endTs).toLocaleString()}`);

        const orders = await fetchOrdersByTimeRange(startTs, endTs);
        allOrders.push(...orders);

        cursor = new Date(startTs + 60 * 60 * 1000);
    }

    // 去重：防止订单在边界时间重复
    const uniqueMap = new Map();
    for (const order of allOrders) {
        const key = order.orderSn || order.orderId || order.id;
        if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, order);
        }
    }

    return [...uniqueMap.values()];
}







/**
 * 拉取指定时间范围内的订单（自动处理分页） 最大查询时间区间默认不超过1小时
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
        console.log(`[正在请求] 第 ${page} 页`);

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
        const goods_id = order.detailList[0].goodsId
        const goods_name = order.detailList[0].goodsName
        const goods_img_url = order.detailList[0].goodsThumb

        //重新根据数据映射订单数据库字段
        const orderData = {
            order_sn: orderSn,
            status: newStatus,                      // 新状态
            platform: 'vip',                     // 平台固定
            order_amount: order.totalCost,
            commission: order.commission,
            create_time: order.orderTime,
            uid: order.openId,
            goods_id :goods_id,
            goods_name,
            goods_img_url,
            update_time:order.lastUpdateTime
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
 * 执行任务，先拉订单，然后入库
 * 永远拉取当前整点到下一个整点之间的订单，比如当前是2026-08-23 20:00:41，则拉取2026-08-23 20:00:00 ~ 2026-08-23 21:00:00之间的订单
 */
async function pullTask(currentTs) {

    try {
        const currentTime = new Date(currentTs);
        currentTime.setMinutes(0, 0, 0);
        const startTs = currentTime.getTime();
        // console.log(startTs)
        const endTs = startTs + 60 * 60 * 1000;
        // console.log(endTs)
        console.log(`[定时任务] 开始拉取订单，时间区间：${formatBeijing(new Date(startTs))} ~ ${formatBeijing(new Date(endTs))}`);

        const orders = await fetchOrdersByTimeRange(startTs, endTs);

        if (orders.length === 0) {
            console.log('[定时任务] 该时间段无订单');
            return;
        }
        console.log(JSON.stringify(orders));

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



/**
 * 按日期范围拉取订单，并写入数据库
 * @param {string} startDate
 * @param {string} endDate
 */
async function pullOrdersByDateRange(startDate, endDate) {
    try {
        const orders = await fetchOrdersByDateRange(startDate, endDate);

        if (!orders.length) {
            console.log(`[日期范围] ${startDate} ~ ${endDate} 没有订单`);
            return [];
        }

        const stats = await saveOrdersToDatabase(orders);
        console.log('[日期范围] 入库统计:', stats);

        return orders;
    } catch (error) {
        console.error('[日期范围] 拉取失败:', error);
        throw error;
    }
}



// ================= 启动定时任务 =================
// cron 表达式: 秒 分 时 日 月 星期
// 每10秒时整点执行一次
// cron.schedule('*/10 * * * * *', () => {
//     // pullTask(Date.now()); //执行任务
//     pullTask(1787489741000); //执行任务

// }, {
//     timezone: "Asia/Shanghai"   // 确保使用北京时间
// });

// console.log('定时任务已启动，每小时整点拉取唯品会订单...');


(async () => {
    const orders = await pullOrdersByDateRange('2026-08-28', '2026-09-02');
    console.log('总订单数:', orders.length);
})();
