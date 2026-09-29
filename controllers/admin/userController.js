/**
 * 后台用户查询控制器
 */
const adminUserService = require('../../services/admin/adminUserService');

// GET /api/admin/user/list
async function getUserList(req, res) {
  try {
    const data = await adminUserService.getUserList(req.query);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

// GET /api/admin/user/detail?id=
async function getUserDetail(req, res) {
  try {
    const data = await adminUserService.getUserDetail(req.query.id);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
  }
}

module.exports = { getUserList, getUserDetail };
