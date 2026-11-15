/**
 * User Controller
 * 负责处理用户相关的 HTTP 请求，调用 AuthService 进行业务逻辑处理
 */

const userService = require('../services/adpUserService.js');
const { ok, fail } = require('../utils/response.js');


// 密码登录
exports.passwordLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return fail(res, 400, '手机号和密码不能为空');
    }
    const data = await userService.loginByPassword(phone, password);
    // legacy: { success: true, data }
    ok(req, res, data, () => ({ success: true, data }));
  } catch (err) {
    // 业务错误（手机号未注册/密码错误等）→ 400，legacy 保留旧结构
    if (req.get('x-client-ver') === '2') {
      return fail(res, 400, err.message);
    }
    return res.status(200).json({ success: false, error: err.message });
  }
};


// 用户注册（手机号 + 密码）
exports.register = async (req, res, next) => {
  try {
    const { phone, openid } = req.body;
    if (!phone || !openid) {
      return fail(res, 400, '手机号和openid不能为空');
    }

    // 手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return fail(res, 400, '手机号格式不正确');
    }

    const data = await userService.register( { phone, openid } );
    // legacy: { success: true, data }
    ok(req, res, data, () => ({ success: true, data }));
  } catch (err) {
    // 注册失败（手机号已绑定其他账号等业务错误）→ 400，legacy 保留旧结构
    if (req.get('x-client-ver') === '2') {
      return fail(res, 400, err.message);
    }
    return res.status(200).json({ code: 201, error: err.message });
  }
};


//openid登录
exports.loginByOpenid = async (req, res, next) => {
  try {
    const { openid } = req.body;
    if (!openid) {
      return fail(res, 400, 'openid不能为空');
    }
    const data = await userService.loginByOpenid(openid);
    // legacy: { result: true, data }
    ok(req, res, data, () => ({ result: true, data }));
  } catch (err) {
    // legacy: { result: false, error }；不再额外 next(err)（避免响应已发送后二次触发错误中间件）
    if (req.get('x-client-ver') === '2') {
      return fail(res, 400, err.message);
    }
    return res.json({ result: false, error: err.message });
  }
};

// 发送手机验证码（预留：iOS / Android App 手机号+验证码登录）
exports.sendVerificationCode = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const data = await userService.sendVerificationCode(phone);
    // legacy: { success: true, data }（devCode 仅在未接 SMS 服务商时存在，供联调）
    ok(req, res, data, () => ({ success: true, data }));
  } catch (err) {
    if (req.get('x-client-ver') === '2') {
      return fail(res, 400, err.message);
    }
    return res.status(200).json({ success: false, error: err.message });
  }
};

// 手机号+验证码登录（未注册自动注册；携带 openid 时绑定）（预留：iOS / Android App）
exports.loginByCode = async (req, res, next) => {
  try {
    const { phone, code, openid } = req.body;
    const data = await userService.loginByCode({ phone, code, openid });
    // legacy: { success: true, data }
    ok(req, res, data, () => ({ success: true, data }));
  } catch (err) {
    if (req.get('x-client-ver') === '2') {
      return fail(res, 400, err.message);
    }
    return res.status(200).json({ success: false, error: err.message });
  }
};
