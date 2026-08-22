/**
 * @description banner服务，提供banner相关的功能接口路由
 */

const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/adpBannerController');

router.get('/', bannerController.getBanner);

module.exports = router;