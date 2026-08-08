

const thirdAuthService = require('../services/adpThirdAuthService.js');

/**
 * 生成第三方平台授权链接
 * @param {*} req
 * @param {*} res
 */
exports.genAuthUrl = async function(req, res) {
  try {
    const { uid, pid, platform } = req.query;
    const authUrl = await thirdAuthService.genAuthUrl({ uid, pid, platform });
    res.json({ result: true, authUrl });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
}

/**
 * 检查第三方平台授权状态
 * @param {*} req
 * @param {*} res
 */
exports.checkAuth = async function(req, res) {
  try {
    const { uid, pid, platform } = req.query;    
    const authStatus = await thirdAuthService.checkAuth({ uid, pid, platform });
    res.json({ result: true, authStatus });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }     
}

