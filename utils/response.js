/**
 * 统一响应封装（C 端接口）
 *
 * v2 标准格式（2026-11-15 起）：
 *   成功： { code: 200, msg: 'ok',   data: ... }
 *   失败： HTTP 4xx/5xx + { code: <http状态码>, msg: '...', data: null }
 *   业务码：HTTP 200 + { code: -1/-2, msg: '...', data: ... }（-1=平台未授权，-2=不支持的平台）
 *
 * 版本兼容约定：
 *   请求头携带 `X-Client-Ver: 2` 的新客户端（小程序 utils/api.js）返回 v2 标准格式；
 *   未携带该头的旧客户端（已发布的历史版本小程序）返回 legacy 旧结构，保证线上不受影响。
 *   旧版本小程序全部淘汰后可移除各 controller 中的 legacyFn 分支。
 */

const V2_HEADER = 'x-client-ver';

/**
 * 判断请求是否来自 v2 客户端
 */
function isV2(req) {
  return !!(req && typeof req.get === 'function' && req.get(V2_HEADER) === '2');
}

/**
 * 成功响应
 * @param {*} req  express req（用于判断客户端版本）
 * @param {*} res  express res
 * @param {*} data v2 格式下放入 data 的载荷
 * @param {Function} [legacyFn] 旧客户端的响应结构工厂函数，返回旧格式对象
 */
function ok(req, res, data, legacyFn) {
  if (!isV2(req) && typeof legacyFn === 'function') {
    return res.json(legacyFn());
  }
  return res.json({ code: 200, msg: 'ok', data });
}

/**
 * 业务失败响应（HTTP 200，靠 code 区分业务状态）
 * @param {number} code 业务码（-1 未授权 / -2 不支持的平台等）
 * @param {string} msg  业务说明
 * @param {*} [data]    附加数据（如 { needAuthPlatform }）
 */
function biz(req, res, code, msg, data, legacyFn) {
  if (!isV2(req) && typeof legacyFn === 'function') {
    return res.json(legacyFn());
  }
  return res.json({ code, msg, data: data === undefined ? null : data });
}

/**
 * HTTP 错误响应（4xx/5xx）
 */
function fail(res, statusCode, msg) {
  return res
    .status(statusCode)
    .json({ code: statusCode, msg: msg || '请求失败', data: null });
}

module.exports = { isV2, ok, biz, fail, V2_HEADER };
