



const express = require('express');
const router = express.Router();
const thirdAuthController = require('../controllers/adpThirdAuthController');

router.get('/genAuthUrl', thirdAuthController.genAuthUrl); //生成授权链接
router.get('/checkAuth', thirdAuthController.checkAuth); //检查授权状态
module.exports = router;