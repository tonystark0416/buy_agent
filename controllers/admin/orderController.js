/**
 * 后台订单查询控制器
 */
const adminOrderService = require('../../services/admin/adminOrderService');
const orderSyncTaskService = require('../../services/admin/orderSyncTaskService');

// GET /api/admin/order/list
async function getOrderList(req, res) {
  try {
    const data = await adminOrderService.getOrderList(req.query);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

// GET /api/admin/order/detail?orderSn=
async function getOrderDetail(req, res) {
  try {
    const data = await adminOrderService.getOrderDetail(req.query.orderSn);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

// POST /api/admin/order/sync  { platform: 'vip'|'meituan', startDate, endDate }
async function startOrderSync(req, res) {
  try {
    const { platform, startDate, endDate } = req.body || {};
    const task = orderSyncTaskService.startSync({ platform, startDate, endDate });
    res.json({ code: 0, msg: 'ok', data: task });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

// GET /api/admin/order/sync/status?taskId=xxx（不传 taskId 则返回最近任务列表）
async function getSyncStatus(req, res) {
  try {
    const { taskId } = req.query;
    if (taskId) {
      res.json({ code: 0, msg: 'ok', data: orderSyncTaskService.getTask(taskId) });
    } else {
      res.json({ code: 0, msg: 'ok', data: { tasks: orderSyncTaskService.listTasks(), maxRangeDays: orderSyncTaskService.MAX_RANGE_DAYS } });
    }
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

module.exports = { getOrderList, getOrderDetail, startOrderSync, getSyncStatus };
