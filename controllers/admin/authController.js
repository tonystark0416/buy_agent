/**
 * 后台登录控制器
 */
const adminAuthService = require('../../services/admin/adminAuthService');

// POST /api/admin/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    const data = await adminAuthService.login(username, password);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    // 原有全局错误处理只返回 500 文本，后台模块自行返回结构化错误
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

// GET /api/admin/auth/profile
async function profile(req, res) {
  try {
    const data = await adminAuthService.getProfile(req.admin.adminId);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

module.exports = { login, profile };
