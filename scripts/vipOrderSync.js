/**
 * scripts/vipOrderSync.js
 *
 * daily cron job for syncing VIP order data into adp_order.
 * Supports two modes:
 *   1) --once: run once and exit
 *   2) node-cron: keep process alive and run on schedule
 *
 * If you want to use this file with PM2, start it as a single instance.
 */

const cron = require('node-cron');
const vipService = require('../services/platforms/vipService');
const { findOrder, createAdpOrder, updateOrder } = require('../models/adpOrder');

const CRON_SCHEDULE = process.env.VIP_ORDER_SYNC_CRON || '0 2 * * *';
const PAGE_SIZE = Number(process.env.VIP_ORDER_SYNC_PAGE_SIZE) || 10;
const PLATFORM_NAME = '唯品会';

let isRunning = false;

function buildSyncWindow() {
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startTime = process.env.VIP_ORDER_SYNC_FROM ? new Date(process.env.VIP_ORDER_SYNC_FROM) : defaultStart;
  const endTime = process.env.VIP_ORDER_SYNC_TO ? new Date(process.env.VIP_ORDER_SYNC_TO) : now;
  return {
    orderTimeStart: formatDateTime(startTime),
    orderTimeEnd: formatDateTime(endTime),
  };
}

function formatDateTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const pad = (value) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function mapVipStatus(status) {
  const value = Number(status);
  if ([0, 1, 2].includes(value)) return value;
  return value || 0;
}

function mapVipOrderToAdpOrder(vipOrder) {
  if (!vipOrder) return null;

  return {
    order_sn: vipOrder.orderSn || vipOrder.orderId || vipOrder.orderNo || vipOrder.order_code || '',
    status: mapVipStatus(vipOrder.status),
    platform: PLATFORM_NAME,
    order_amount: Number(vipOrder.orderAmount || vipOrder.totalAmount || vipOrder.paymentAmount || 0),
    commission: Number(vipOrder.commission || vipOrder.commissionAmount || vipOrder.settlementAmount || 0),
    create_time: vipOrder.orderTime || vipOrder.createTime || formatDateTime(new Date()),
  };
}

async function upsertOrder(vipOrder) {
  const orderData = mapVipOrderToAdpOrder(vipOrder);
  if (!orderData || !orderData.order_sn) {
    console.warn('[vipOrderSync] skip invalid VIP order', vipOrder);
    return { action: 'skip' };
  }

  const existing = await findOrder(orderData.order_sn);
  if (!existing) {
    await createAdpOrder(orderData);
    return { action: 'insert', order_sn: orderData.order_sn };
  }

  if (existing.status !== orderData.status) {
    await updateOrder(orderData.order_sn, orderData.status);
    return { action: 'update', order_sn: orderData.order_sn };
  }

  return { action: 'none', order_sn: orderData.order_sn };
}

async function syncOnce({ orderTimeStart, orderTimeEnd, pageSize = PAGE_SIZE } = {}) {
  if (isRunning) {
    console.warn('[vipOrderSync] sync already running, skip this trigger');
    return;
  }

  isRunning = true;
  const window = { orderTimeStart, orderTimeEnd };
  if (!window.orderTimeStart || !window.orderTimeEnd) {
    Object.assign(window, buildSyncWindow());
  }

  console.log('[vipOrderSync] start sync', window);

  let page = 1;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  try {
    while (true) {
      console.log(`[vipOrderSync] request page=${page} pageSize=${pageSize}`);

      const apiResult = await vipService.orderList({
        status: null,
        orderTimeStart: window.orderTimeStart,
        orderTimeEnd: window.orderTimeEnd,
        page,
        pageSize,
      });

      const orderList = apiResult?.result?.orderList || apiResult?.orderList || [];
      if (!Array.isArray(orderList) || orderList.length === 0) {
        console.log('[vipOrderSync] no orders returned, finish');
        break;
      }

      for (const vipOrder of orderList) {
        const result = await upsertOrder(vipOrder);
        if (result.action === 'insert') totalInserted += 1;
        if (result.action === 'update') totalUpdated += 1;
        if (result.action === 'skip') totalSkipped += 1;
      }

      if (orderList.length < pageSize) {
        console.log('[vipOrderSync] reached last page');
        break;
      }

      page += 1;
      await sleep(500);
    }

    console.log(`[vipOrderSync] finished, insert=${totalInserted}, update=${totalUpdated}, skip=${totalSkipped}`);
  } catch (error) {
    console.error('[vipOrderSync] sync failed', error);
    throw error;
  } finally {
    isRunning = false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (process.argv.includes('--once')) {
    await syncOnce();
    process.exit(0);
    return;
  }

  console.log('[vipOrderSync] scheduling cron', CRON_SCHEDULE);
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await syncOnce();
    } catch (err) {
      console.error('[vipOrderSync] scheduled job error', err);
    }
  }, {
    scheduled: true,
    timezone: process.env.VIP_ORDER_SYNC_TZ || 'Asia/Shanghai',
  });

  if (process.env.VIP_ORDER_SYNC_IMMEDIATE === 'true') {
    await syncOnce();
  }
}

main().catch((err) => {
  console.error('[vipOrderSync] startup error', err);
  process.exit(1);
});
