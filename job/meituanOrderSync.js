

/**
 * 定时任务:拉取美团订单
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getOrderInfo, } = require('../services/platforms/meituanService');
const { createAdpOrder, findOrder, updateOrder } = require('../models/adpOrder');
const { formatBeijing } = require('../utils/timeUtils');

/**
 * 保存或更新订单到数据库
 * - 若订单存在，则更新状态
 * - 若不存在，则插入新订单
 * @param {Array} orders - 唯品会订单原始数据
 */
async function saveOrdersToDatabase(orders) {
    let insertCount = 0, updateCount = 0, errorCount = 0; //统计数据

    for (const order of orders) {
        const orderSn = order.orderId;
        const newStatus = order.status;
        const goods_id = order.productViewSign.split(',')[0].trim();
        const goods_name = order.productName.split(',')[0].trim();
        const goods_img_url = null
        //重新根据数据映射订单数据库字段
        const orderData = {
            order_sn: orderSn,
            status: newStatus,                      // 新状态
            platform: 'meituan',                     // 平台固定
            order_amount: order.payPrice,
            commission: order.profit,
            create_time: formatBeijing(new Date(order.payTime*1000)),
            uid: order.sid,
            goods_id: goods_id,
            goods_name,
            goods_img_url,
            update_time: formatBeijing(new Date(order.updateTime*1000))
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
        const startTs = Math.floor(cursor.getTime() / 1000);
        const endTs = Math.min(startTs + 60 * 60, Math.floor(end.getTime() / 1000));

        console.log(`[按日期范围] 拉取 ${new Date(startTs * 1000).toLocaleString()} ~ ${new Date(endTs * 1000).toLocaleString()}`);

        const orders = await fetchOrdersByTimeRange(startTs, endTs);
        allOrders.push(...orders);

        cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
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
            queryTimeType: 1,
            startTime: startTimestamp,
            endTime: endTimestamp,
            page: page,
            platform:1
        };
        console.log(`[正在请求] 第 ${page} 页`);

        const response = await getOrderInfo(requestParams);
        const orders = response?.data?.dataList || [];
        allOrders = allOrders.concat(orders);

        // 判断是否还有下一页
        const totalCount = response?.data?.skuCount || 0;
        hasMore = allOrders.length < totalCount;
        page++;

        // 防止死循环（最多拉取100页）
        if (page > 100) break;
    }

    console.log(`[完成] 共拉取 ${allOrders.length} 笔订单`);
    return allOrders;
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


(async () => {
    const orders = await pullOrdersByDateRange('2026-08-01', '2026-08-20');
    console.log('总订单数:', orders.length);
})();