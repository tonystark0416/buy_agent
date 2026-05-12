/**
 * giftCouponRoutes.js
 * 礼品券相关路由，处理与礼品券相关的请求
 * @author liuweizhao
 * @date 2024-06-01
 */
const express = require('express');
const router = express.Router();
const gift = require('../controllers/giftCouponController');

router.get('/', gift.giftCoupon);

module.exports = router;