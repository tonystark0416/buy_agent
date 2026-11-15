/**
 * @file adpTranUrlController.js
 * @description 转换第三方平台链接控制器
 *
 * 响应约定（业务码 HTTP 200 下发，靠 code 区分）：
 *   成功       v2: { code: 200, msg: 'ok', data: { urls } }
 *              legacy: { code: 200, urls }
 *   平台未授权  v2: { code: -1, msg: '用户未授权', data: { needAuthPlatform } }
 *              legacy: { code: -1, needAuthPlatform, message }
 *   不支持平台  v2: { code: -2, msg: '不支持的平台' }
 *              legacy: { code: -2, message }
 */

const adpTranUrlService = require('../services/adpTranUrlService.js');
const { ok, biz, fail } = require('../utils/response.js');


/**
 * 转换第三方平台链接
 */
exports.tranUrl = async function (req, res) {
  try {
    const { uid, pid, source_url, targetType, targetValueList } = req.query;
    const resultUrl = await adpTranUrlService.tranUrl({ uid, pid, source_url, targetType, targetValueList });

    if (resultUrl.needAuthPlatform) {
      const platform = resultUrl.needAuthPlatform;
      // legacy: { code: -1, needAuthPlatform, message }
      biz(req, res, -1, '用户未授权', { needAuthPlatform: platform }, () => ({ code: -1, needAuthPlatform: platform, message: '用户未授权' }));
    } else if (resultUrl.message === 'noSuportPlatform') {
      // legacy: { code: -2, message }
      biz(req, res, -2, '不支持的平台', null, () => ({ code: -2, message: '不支持的平台' }));
    } else {
      // legacy: { code: 200, urls }
      ok(req, res, { urls: resultUrl.urls }, () => ({ code: 200, urls: resultUrl.urls }));
    }
  } catch (error) {
    fail(res, 500, error.message);
  }
}

/**
 * 按商品 ID 获取推广链接
 * 成功 v2: { code: 200, msg: 'ok', data: { goodsId, urls } }；legacy: { result: true, goodsId, urls }
 */
exports.tranUrlByGoodsId = async function (req, res) {
  try {
    const { platform, goodsId, uid, pid } = req.query;
    const resultData = await adpTranUrlService.tranUrlByGoodsId({ platform, goodsId, uid, pid });
    ok(req, res, resultData, () => ({ result: true, ...resultData }));
  } catch (error) {
    fail(res, 500, error.message);
  }
}
