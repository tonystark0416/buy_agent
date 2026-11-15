const thirdAuthService = require('../services/adpThirdAuthService.js');
const { ok, fail } = require('../utils/response.js');

/**
 * 生成第三方平台授权链接
 * v2: { code: 200, msg: 'ok', data: { h5_url, weapp_url, deeplink_url } }
 * legacy: { result: true, authUrl }
 */
exports.genAuthUrl = async function(req, res) {
  try {
    const { uid, pid, platform } = req.query;
    const authUrl = await thirdAuthService.genAuthUrl({ uid, pid, platform });
    ok(req, res, authUrl, () => ({ result: true, authUrl }));
  } catch (error) {
    fail(res, 500, error.message);
  }
}

/**
 * 检查第三方平台授权状态
 * v2: { code: 200, msg: 'ok', data: { isAuth: true|false } }
 * legacy: { result: true, authStatus }
 */
exports.checkAuth = async function(req, res) {
  try {
    const { uid, pid, platform } = req.query;
    const authStatus = await thirdAuthService.checkAuth({ uid, pid, platform });
    ok(req, res, authStatus, () => ({ result: true, authStatus }));
  } catch (error) {
    fail(res, 500, error.message);
  }
}

/**
 * 解绑第三方平台授权
 * v2: { code: 200, msg: 'ok', data: unbindResult }
 * legacy: { result: true, unbindResult }
 */
exports.unbindThirdAuth = async function(req, res) {
  try {
    const { uid, platform } = req.query;
    const unbindResult = await thirdAuthService.unbindThirdAuth({ uid, platform });
    ok(req, res, unbindResult, () => ({ result: true, unbindResult }));
  } catch (error) {
    fail(res, 500, error.message);
  }
}
