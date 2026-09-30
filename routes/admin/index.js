/**
 * 后台路由汇总：统一挂载 /api/admin 前缀
 * 鉴权策略：/auth 登录开放，其余全部经过 adminAuth 中间件
 */
const express = require('express');
const router = express.Router();

const adminAuth = require('../../middleware/adminAuth');
const authRoutes = require('./authRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const goodsRoutes = require('./goodsRoutes');

router.use('/auth', authRoutes);
router.use('/order', adminAuth, orderRoutes);
router.use('/user', adminAuth, userRoutes);
router.use('/goods', adminAuth, goodsRoutes);

module.exports = router;
