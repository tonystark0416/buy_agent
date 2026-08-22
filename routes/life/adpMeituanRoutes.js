
/**
 * 美团CPS接口服务 https://media.meituan.com/pc/index.html#/materials/api
 */


const express = require('express');
const router = express.Router();
const meituanController = require('../../controllers/life/adpMeituanController');

router.get('/goods', meituanController.getWaimaiGoods);
router.get('/referral-link-by-goods-id', meituanController.getReferralLinkByGoodsId);
router.get('/referral-link-by-act-id', meituanController.getReferralLinkByActId);
router.get('/order-info', meituanController.getOrderInfo);

module.exports = router;