/**
 * 后台订单查询控制器
 */
const adminOrderService = require('../../services/admin/adminOrderService');

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

module.exports = { getOrderList, getOrderDetail };
