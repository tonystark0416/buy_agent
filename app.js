const express = require('express');
const userRoutes = require('./routes/userRoutes');
// const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// 中间件
app.use(express.json());  // 解析 JSON 请求体

// 路由
app.use('/api/users', userRoutes);  // 用户相关路由

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;

