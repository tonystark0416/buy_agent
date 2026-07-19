// routes/weixinRoutes.js
const express = require('express');
const router = express.Router();
const weixinController  = require('../controllers/weixinController');

router.get('/openid', weixinController.getOpenid);
router.get('/getPhone', weixinController.getUserPhoneNumber);

module.exports = router;