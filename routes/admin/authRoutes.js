/**
 * 后台登录路由（无需鉴权）
 */
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/authController');

router.post('/login', authController.login);

// 需要登录态
router.get('/profile', require('../../middleware/adminAuth'), authController.profile);

module.exports = router;
