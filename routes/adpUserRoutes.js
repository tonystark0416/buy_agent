/**
 * 认证路由
 * 定义与用户认证相关的 API 路由，如登录、注册等
 * 依赖 authController 处理具体的业务逻辑
 * 通过 Express Router 定义路由，并导出供 app.js 使用
 */


const express = require('express');
const router = express.Router();
const userController = require('../controllers/adpUserController.js');

router.post('/login', userController.passwordLogin); //登陆
router.post('/register', userController.register); //注册
router.post('/loginByOpenid', userController.loginByOpenid); //openid登录
// 手机号+验证码登录通道（预留：iOS / Android App 端使用）
router.post('/sendVerificationCode', userController.sendVerificationCode); //发送验证码
router.post('/loginByCode', userController.loginByCode); //验证码登录（未注册自动注册）
module.exports = router;
