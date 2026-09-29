/**
 * 后台用户路由（鉴权在 routes/admin/index.js 统一处理）
 */
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/userController');

router.get('/list', userController.getUserList);
router.get('/detail', userController.getUserDetail);

module.exports = router;
