/**
 * 后台订单路由（鉴权在 routes/admin/index.js 统一处理）
 */
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');

router.get('/list', orderController.getOrderList);
router.get('/detail', orderController.getOrderDetail);

module.exports = router;
