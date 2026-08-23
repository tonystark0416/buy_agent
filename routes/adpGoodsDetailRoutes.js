/**
 * goodsDetailRoutes.js
 * 商品详情相关路由，处理与商品详情相关的请求
 * @author liuweizhao
 * @date 2024-06-01
 */
const express = require('express');
const router = express.Router();
const goods = require('../controllers/adpGoodsDetailController');

router.get('/', goods.getGoodsMarketPrice);

module.exports = router;