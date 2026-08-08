

const adpTranUrlService = require('../services/adpTranUrlService.js');

/**
 * 转换第三方平台链接
 * @param {*} req
 * @param {*} res
 */
exports.tranUrl = async function(req, res) {
  try {
    const { uid, pid, platform, source_url } = req.query;
    const resultUrl = await adpTranUrlService.tranUrl({ uid, pid, platform, source_url });
    res.json({ result: true, ...resultUrl });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
}