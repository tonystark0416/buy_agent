/**
 * 后台商品管理路由
 * 读接口：登录即可（adminAuth 在 routes/admin/index.js 统一处理）
 * 写接口：额外经 adminWriteAuth 拦截 readonly 角色
 */
const express = require('express');
const router = express.Router();
const goodsController = require('../../controllers/admin/goodsController');
const { adminWriteAuth } = require('../../middleware/adminAuth');

router.get('/list', goodsController.getGoodsList);
router.post('/create', adminWriteAuth, goodsController.createGoods);
router.put('/update', adminWriteAuth, goodsController.updateGoods);
router.delete('/delete', adminWriteAuth, goodsController.deleteGoods);

module.exports = router;
