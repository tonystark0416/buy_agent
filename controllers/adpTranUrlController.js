
/**
 * @file adpTranUrlController.js
 * @description 转换第三方平台链接控制器
 * @author 
 * @date 2024-06-10
 */


const adpTranUrlService = require('../services/adpTranUrlService.js');


/**
 * 转换第三方平台链接
 * @param {*} req
 * @param {*} res
 */
exports.tranUrl = async function (req, res) {
  try {
    const { uid, pid, source_url, targetType, targetValueList } = req.query;
    const resultUrl = await adpTranUrlService.tranUrl({ uid, pid, source_url, targetType, targetValueList });
    if (resultUrl.needAuthPlatform) {
      res.json({ code: -1, ...resultUrl });
    } else if (resultUrl.message === 'noSuportPlatform') {
      res.json({ code: -2, message: '不支持的平台' });
    } else {
      res.json({ code: 200, ...resultUrl });
    }

  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
}

exports.tranUrlByGoodsId = async function (req, res) {
  try {
    const { platform, goodsId, uid, pid } = req.query;
    const resultData = await adpTranUrlService.tranUrlByGoodsId({ platform, goodsId, uid, pid });
    res.json({ result: true, ...resultData });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
}