/**
 * User Controller
 * 负责处理用户相关的 HTTP 请求，调用 AuthService 进行业务逻辑处理
 * 包括用户注册、登录等功能
 * 依赖 AuthService 进行认证相关的业务逻辑处理
 */

const userService = require('../services/adpUserService.js');



// 密码登录
exports.passwordLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码不能为空' });
    }
    const data = await userService.loginByPassword(phone, password);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 用户注册（手机号 + 密码）
exports.register = async (req, res, next) => {
  try {
    const { phone, openid } = req.body;
    if (!phone || !openid) {
      return res.status(400).json({ error: '手机号和openid不能为空' });
    }

    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }

    const data = await userService.register(phone, null,openid);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(200).json({ code:201,error: err.message });
  }
};


//openid登录
exports.loginByOpenid = async (req, res, next) => {
  try {
    const { openid } = req.body;
    if (!openid) {
      return res.status(400).json({ error: 'openid不能为空' });
    }
    const data = await userService.loginByOpenid(openid);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};