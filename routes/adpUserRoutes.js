/**
 * 认证路由
 * 定义与用户认证相关的 API 路由，如登录、注册等
 * 依赖 authController 处理具体的业务逻辑
 * 通过 Express Router 定义路由，并导出供 app.js 使用
 */


const express = require('express');
const router = express.Router();
const userController = require('../controllers/adpUserController.js');

router.post('/login', userController.passwordLogin);
router.post('/register', userController.register);


module.exports = router;
