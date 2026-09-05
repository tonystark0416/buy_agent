// app.js
const express = require('express');
const userRoutes = require('./routes/adpUserRoutes.js');
const thirdAuthRoutes = require('./routes/adpThirdAuthRoutes.js');
const aiRoutes = require('./routes/agentRoutes');
const searchRoutes = require('./routes/adpSearchRoutes');
const adpGoodsDetailRoutes = require('./routes/adpGoodsDetailRoutes');
const giftCouponRoutes = require('./routes/adpGiftCouponRoutes.js');
const weixinRoutes = require('./routes/weixinRoutes');
const vipGoodsListRoutes = require('./routes/adpVipGoodsListRoutes.js');
const adpTranUrlRoutes = require('./routes/adpTranUrlRoutes.js');
const meituanRoutes = require('./routes/life/adpMeituanRoutes.js');
const adpBannerRoutes = require('./routes/adpBannerRoutes.js');
const adpOrderRoutes = require('./routes/adpOrderRoutes.js')
const app = express();

app.use(express.json());  // 解析 JSON 请求体

// 路由
app.use('/api/meituan', meituanRoutes);  // 美团相关路由
app.use('/api/user', userRoutes);  // 用户相关路由
app.use('/api/thirdAuth', thirdAuthRoutes);  // 第三方授权相关路由
app.use('/chat', aiRoutes);  // AI 聊天相关路由
app.use('/api/search', searchRoutes);  // 搜索相关路由
app.use('/api/goods', adpGoodsDetailRoutes);  // 商品详情相关路由
app.use('/api/giftCoupons', giftCouponRoutes);  // 礼品券相关路由
app.use('/api/weixin', weixinRoutes);  // 微信相关路由
app.use('/api/vip', vipGoodsListRoutes);  // VIP商品列表相关路由
app.use('/api/tranUrl', adpTranUrlRoutes);  // 第三方平台链接转换相关路由
app.use('/api/banner', adpBannerRoutes);  // banner相关路由
app.use('/api/order',adpOrderRoutes)

app.get('/', (req, res) => {
    console.log('log here')
    res.send('Hello, World!');
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;

