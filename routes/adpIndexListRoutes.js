/**
 *  @description: 唯品会商品列表相关路由
 * 
 */


const express = require('express');
const router = express.Router();
const adpIndexListController = require('../controllers/adpIndexListController.js');

router.get('', adpIndexListController.getList); // 获取VIP商品列表
module.exports = router;
