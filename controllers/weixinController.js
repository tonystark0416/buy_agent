const weixinService = require('../services/platforms/weixinService');
const { ok } = require('../utils/response.js');

/**
 * code 换 openid
 * v2: { code: 200, msg: 'ok', data: <微信 jscode2session 原始返回> }
 * legacy: 直接透传微信原始返回（历史小程序 app.js 依赖顶层 openid/session_key）
 */
exports.getOpenid = async (req, res, next) => {
  try {
    const { code } = req.query;
    const data = await weixinService.getOpenid(code);
    ok(req, res, data, () => data);
  } catch (error) {
    next(error);
  }
};

/**
 * code 换用户手机号
 * v2: { code: 200, msg: 'ok', data: <微信 getuserphonenumber 原始返回> }
 * legacy: 直接透传微信原始返回
 */
exports.getUserPhoneNumber = async (req, res, next) => {
  try {
    const { code } = req.query;
    const data = await weixinService.getUserPhoneNumber(code);
    ok(req, res, data, () => data);
  } catch (error) {
    next(error);
  }
}
