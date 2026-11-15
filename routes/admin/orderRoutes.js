/**
 * 后台订单路由（鉴权在 routes/admin/index.js 统一处理）
 */
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');

router.get('/list', orderController.getOrderList);
router.get('/detail', orderController.getOrderDetail);
// 手动同步订单（唯品会/美团，最长 30 天区间，异步任务+进度轮询）
router.post('/sync', orderController.startOrderSync);
router.get('/sync/status', orderController.getSyncStatus);

module.exports = router;
