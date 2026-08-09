
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
exports.tranUrl = async function(req, res) {
  try {
    const { uid, pid, source_url } = req.query;
    const resultUrl = await adpTranUrlService.tranUrl({ uid, pid, source_url });
    res.json({...resultUrl });
  } catch (error) {
    res.status(500).json(...resultUrl);
  }
}