/**
 *  第三方平台链接转换路由
 * 
 */


const express = require('express');
const router = express.Router();
const adpTranUrlController = require('../controllers/adpTranUrlController.js');

router.get('', adpTranUrlController.tranUrl); //转换第三方平台链接
router.get('/genUrlByGoodsId', adpTranUrlController.tranUrlByGoodsId); //根据商品id转换第三方平台链接
module.exports = router;
