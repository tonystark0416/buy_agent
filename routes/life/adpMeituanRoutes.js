
/**
 * 美团CPS接口服务 https://media.meituan.com/pc/index.html#/materials/api
 */


const express = require('express');
const router = express.Router();
const meituanController = require('../../controllers/life/adpMeituanController');

router.get('/', meituanController.getWaimaiGoods);
router.get('/referral-link', meituanController.getReferralLink);
router.get('/order-info', meituanController.getOrderInfo);

module.exports = router;