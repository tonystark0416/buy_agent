// app.js
const express = require('express');
const userRoutes = require('./routes/adpUserRoutes.js');
const aiRoutes = require('./routes/agnetRoutes');
const searchRoutes = require('./routes/searchRoutes');
const goodsDetailRoutes = require('./routes/goodsDetailRoutes');
const giftCouponRoutes = require('./routes/giftCouponRoutes');
const weixinRoutes = require('./routes/weixinRoutes');
const vipGoodsListRoutes = require('./routes/adpVipGoodsListRoutes.js');

const app = express();

app.use(express.json());  // 解析 JSON 请求体

// 路由
app.use('/api/user', userRoutes);  // 用户相关路由
app.use('/chat', aiRoutes);  // AI 聊天相关路由
app.use('/api/search', searchRoutes);  // 搜索相关路由
app.use('/api/goods', goodsDetailRoutes);  // 商品详情相关路由
app.use('/api/giftCoupons', giftCouponRoutes);  // 礼品券相关路由
app.use('/api/weixin', weixinRoutes);  // 微信相关路由
app.use('/api/vip', vipGoodsListRoutes);  // VIP商品列表相关路由

app.get('/', (req, res) => {
    console.log('log here')
    res.send('Hello, World!');
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;

