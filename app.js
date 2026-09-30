// app.js
const express = require('express');
const path = require('path');
const userRoutes = require('./routes/adpUserRoutes.js');
const thirdAuthRoutes = require('./routes/adpThirdAuthRoutes.js');
const aiRoutes = require('./routes/agentRoutes');
const searchRoutes = require('./routes/adpSearchRoutes');
const adpGoodsDetailRoutes = require('./routes/adpGoodsDetailRoutes');
const giftCouponRoutes = require('./routes/adpGiftCouponRoutes.js');
const weixinRoutes = require('./routes/weixinRoutes');
const adpIndexListRoutes = require('./routes/adpIndexListRoutes.js');
const adpTranUrlRoutes = require('./routes/adpTranUrlRoutes.js');
const meituanRoutes = require('./routes/life/adpMeituanRoutes.js');
const adpBannerRoutes = require('./routes/adpBannerRoutes.js');
const adpOrderRoutes = require('./routes/adpOrderRoutes.js')
const adminRoutes = require('./routes/admin/index.js');  // 后台管理路由
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
app.use('/api/indexList', adpIndexListRoutes);  // 首页列表相关路由
app.use('/api/tranUrl', adpTranUrlRoutes);  // 第三方平台链接转换相关路由
app.use('/api/banner', adpBannerRoutes);  // banner相关路由
app.use('/api/order',adpOrderRoutes)
app.use('/api/admin', adminRoutes);  // 后台管理（订单/用户查询）

app.get('/', (req, res) => {
    console.log('log here')
    res.send('Hello, World!');
})

// ===== 后台管理前端静态托管（部署在 /admin 路径）=====
// 静态文件来自 admin-web 构建产物（本地 npm run build 后上传至服务器该目录）
const adminDist = path.join(__dirname, 'admin-web', 'dist');
app.use('/admin', express.static(adminDist));
// SPA 路由回退：刷新 /admin/order 等路径时不返回 404，而是返回 index.html 由前端路由接管
app.get(/^\/admin(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;

