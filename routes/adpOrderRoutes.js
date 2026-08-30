/**
 * 广告订单路由管理
 * 
 */

const express = require('express');
const router = express.Router();
const adpOrderController = require('../controllers/adpOrderController')

router.get('/getList', adpOrderController.getOrderListByUid);

module.exports = router;