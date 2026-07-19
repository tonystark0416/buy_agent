/**
 *  @description: 唯品会商品列表相关路由
 * 
 */


const express = require('express');
const router = express.Router();
const adpVipGoodsListController = require('../controllers/adpVipGoodsListController.js');

router.get('/goodsList', adpVipGoodsListController.getVipGoodsList); // 获取VIP商品列表
module.exports = router;
