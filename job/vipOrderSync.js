


/**
 * 定时任务：每小时整点拉取唯品会订单
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { orderList } = require('../services/platforms/vipService');
const { createAdpOrder, findOrder, updateOrder } = require('../models/adpOrderModel');
const { formatBeijing } = require('../utils/timeUtils');


/**
 * 按日期范围按小时循环拉取订单
 * 例如：2026-08-20 ~ 2026-08-25，会自动拆成每小时一个区间
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} endDate   - 结束日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>}
 */





/**
 * 拉取指定时间范围内的订单（自动处理分页） 最大查询时间区间默认不超过1小时
 * @param {number} startTimestamp - 开始时间戳（毫秒）
 * @param {number} endTimestamp   - 结束时间戳（毫秒）
 * @param {number} status         - 订单状态（可选，0-不合格，1-待定，2-已完结）
 * @returns {Promise<Array>}      - 订单列表
 */
async function fetchOrdersByTimeRange(startTimestamp, endTimestamp, { byUpdateTime = false } = {}) {

    let allOrders = []; //整体订单数组
    let page = 1;
    const pageSize = 20; // 建议调大以减少请求次数（唯品会最大一般支持100）
    let hasMore = true;

    while (hasMore) {
        const requestParams = {
            // 状态不下发（不设置 = 全部状态：0-不合格 / 1-待定 / 2-已完结 都拉）
            page,
            pageSize
        };
        // 查询维度：下单时间（全量补拉）/ 更新时间（增量同步，可捕获老订单状态变化）
        if (byUpdateTime) {
            requestParams.updateTimeStart = startTimestamp;
            requestParams.updateTimeEnd = endTimestamp;
        } else {
            requestParams.orderTimeStart = startTimestamp;
            requestParams.orderTimeEnd = endTimestamp;
        }
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
            create_time: formatBeijing(new Date(order.orderTime)),
            uid: order.openId,
            goods_id :goods_id,
            goods_name,
            goods_img_url,
            update_time:formatBeijing(new Date(order.lastUpdateTime))
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
 * 按日期范围拉取订单并写入数据库（逐小时分段拉取+逐段入库，支持进度回调）
 * 平台 API 单次查询区间不超过 1 小时，此处自动按小时拆分，天然合规
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @param {Function} [onProgress] - 进度回调 ({ done, total, totals })，每完成一个小时段触发一次
 * @returns {Promise<{fetched:number, insertCount:number, updateCount:number, errorCount:number}>}
 */
async function pullOrdersByDateRange(startDate, endDate, onProgress) {
    const start = new Date(`${startDate} 00:00:00`);
    const end = new Date(`${endDate} 23:59:59.999`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('日期格式不正确（应为 YYYY-MM-DD）');
    }
    if (start > end) {
        throw new Error('开始日期不能晚于结束日期');
    }

    const totalSegments = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000)));
    const totals = { fetched: 0, insertCount: 0, updateCount: 0, errorCount: 0 };
    let doneSegments = 0;
    let cursor = start.getTime();

    try {
        while (cursor < end.getTime()) {
            const segEnd = Math.min(cursor + 60 * 60 * 1000, end.getTime());
            const orders = await fetchOrdersByTimeRange(cursor, segEnd);

            if (orders.length) {
                const stats = await saveOrdersToDatabase(orders);
                totals.fetched += orders.length;
                totals.insertCount += stats.insertCount;
                totals.updateCount += stats.updateCount;
                totals.errorCount += stats.errorCount;
            }

            cursor = segEnd;
            doneSegments++;
            if (typeof onProgress === 'function') {
                onProgress({ done: doneSegments, total: totalSegments, totals });
            }
        }
    } catch (error) {
        console.error('[日期范围] 拉取失败:', error);
        throw error;
    }

    if (totals.fetched === 0) {
        console.log(`[日期范围] ${startDate} ~ ${endDate} 没有订单`);
    }
    console.log('[日期范围] 入库统计:', totals);
    return totals;
}


// ================= 增量同步入口（供常驻 worker 每 5 分钟调用） =================
/**
 * 拉取最近 N 小时的订单并入库（增量窗口：新订单 + 状态变化都覆盖）
 * @param {number} hoursBack - 往前回溯小时数（默认 2，需大于同步间隔才能不漏单）
 * @returns {Promise<{fetched: number, stats: Object}>}
 */
async function syncRecent(hoursBack = 2) {
    const endTs = Date.now();
    const startTs = endTs - hoursBack * 3600 * 1000;

    const allOrders = [];
    let cursor = startTs;
    while (cursor < endTs) {
        const segEnd = Math.min(cursor + 60 * 60 * 1000, endTs);
        // 按更新时间查询：新订单与老订单状态变化（待定→已完结等）都能被增量窗口捕获
        const orders = await fetchOrdersByTimeRange(cursor, segEnd, { byUpdateTime: true });
        allOrders.push(...orders);
        cursor = segEnd;
    }

    // 去重（订单可能在小时边界重复）
    const uniqueMap = new Map();
    for (const order of allOrders) {
        const key = order.orderSn || order.orderId || order.id;
        if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, order);
        }
    }
    const unique = [...uniqueMap.values()];

    const stats = unique.length
        ? await saveOrdersToDatabase(unique)
        : { insertCount: 0, updateCount: 0, errorCount: 0 };
    return { fetched: unique.length, stats };
}

module.exports = { syncRecent, pullOrdersByDateRange };

// ================= CLI 手动执行入口 =================
// 用法: node job/vipOrderSync.js [startDate] [endDate]（补拉历史，如 2026-09-26 2026-09-30）
// 定时增量同步: 由常驻进程 job/orderSyncWorker.js 调度（PM2: cps-sync-worker）
if (require.main === module) {
    const [startDate, endDate] = process.argv.slice(2);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const start = startDate || fmt(new Date(Date.now() - 24 * 3600 * 1000));
    const end = endDate || fmt(new Date());
    console.log(`[vipOrderSync] 拉取区间: ${start} ~ ${end}`);
    pullOrdersByDateRange(start, end)
        .then((totals) => {
            console.log('总订单数:', totals.fetched, '入库:', JSON.stringify(totals));
            process.exit(0);
        })
        .catch((err) => { console.error(err); process.exit(1); });
}
