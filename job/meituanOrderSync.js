

/**
 * 定时任务:拉取美团订单
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getOrderInfo, } = require('../services/platforms/meituanService');
const { createAdpOrder, findOrder, updateOrder } = require('../models/adpOrderModel');
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
    let cursorMs = start.getTime();

    try {
        while (cursorMs < end.getTime()) {
            const segEndMs = Math.min(cursorMs + 60 * 60 * 1000, end.getTime());
            // 美团接口时间戳为秒
            const orders = await fetchOrdersByTimeRange(Math.floor(cursorMs / 1000), Math.floor(segEndMs / 1000));

            if (orders.length) {
                const stats = await saveOrdersToDatabase(orders);
                totals.fetched += orders.length;
                totals.insertCount += stats.insertCount;
                totals.updateCount += stats.updateCount;
                totals.errorCount += stats.errorCount;
            }

            cursorMs = segEndMs;
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
            // 查询维度：1=下单时间（全量补拉）/ 2=更新时间（增量同步，可捕获老订单状态变化）
            queryTimeType: byUpdateTime ? 2 : 1,
            startTime: startTimestamp,
            endTime: endTimestamp,
            page: page,
            platform:2
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


// ================= 增量同步入口（供常驻 worker 每 5 分钟调用） =================
/**
 * 拉取最近 N 小时的订单并入库（增量窗口，按更新时间查询：新订单 + 状态变化都覆盖）
 * @param {number} hoursBack - 往前回溯小时数（默认 2，需大于同步间隔才能不漏单）
 * @returns {Promise<{fetched: number, stats: Object}>}
 */
async function syncRecent(hoursBack = 2) {
    const endTsMs = Date.now();
    const startTsMs = endTsMs - hoursBack * 3600 * 1000;

    const allOrders = [];
    let cursor = startTsMs;
    while (cursor < endTsMs) {
        const segEnd = Math.min(cursor + 3600 * 1000, endTsMs);
        // 美团接口时间戳为秒，且单次查询区间不超过 1 小时
        const orders = await fetchOrdersByTimeRange(Math.floor(cursor / 1000), Math.floor(segEnd / 1000), { byUpdateTime: true });
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
// 用法: node job/meituanOrderSync.js [startDate] [endDate]（补拉历史，如 2026-09-01 2026-09-12）
// 定时增量同步: 由常驻进程 job/orderSyncWorker.js 调度（PM2: buy-agent-sync-worker）
if (require.main === module) {
    const [startDate, endDate] = process.argv.slice(2);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const start = startDate || fmt(new Date(Date.now() - 24 * 3600 * 1000));
    const end = endDate || fmt(new Date());
    console.log(`[meituanOrderSync] 拉取区间: ${start} ~ ${end}`);
    pullOrdersByDateRange(start, end)
        .then((totals) => {
            console.log('总订单数:', totals.fetched, '入库:', JSON.stringify(totals));
            process.exit(0);
        })
        .catch((err) => { console.error(err); process.exit(1); });
}