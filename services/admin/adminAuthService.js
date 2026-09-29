/**
 * 后台登录服务
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminAuthModel = require('../../models/admin/adminAuthModel');
const { ADMIN_JWT_SECRET } = require('../../middleware/adminAuth');

const TOKEN_EXPIRES_IN = '8h';

/**
 * 后台登录
 * @returns {{ token, admin: { id, username, nickname, role } }}
 */
async function login(username, password) {
  if (!username || !password) {
    const err = new Error('用户名和密码不能为空');
    err.status = 400;
    throw err;
  }
  const admin = await adminAuthModel.findByUsername(String(username).trim());
  if (!admin) {
    const err = new Error('用户名或密码错误');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(String(password), admin.password_hash);
  if (!ok) {
    const err = new Error('用户名或密码错误');
    err.status = 401;
    throw err;
  }
  if (admin.status !== 1) {
    const err = new Error('账号已被禁用');
    err.status = 403;
    throw err;
  }
  const token = jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role, type: 'admin' },
    ADMIN_JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
  // 更新最后登录时间（不阻塞登录结果）
  adminAuthModel.updateLastLogin(admin.id).catch((e) => console.error('[adminAuth] 更新登录时间失败:', e.message));
  return {
    token,
    admin: { id: admin.id, username: admin.username, nickname: admin.nickname, role: admin.role }
  };
}

/**
 * 获取当前管理员信息
 */
async function getProfile(adminId) {
  const admin = await adminAuthModel.findById(adminId);
  if (!admin) {
    const err = new Error('账号不存在');
    err.status = 401;
    throw err;
  }
  return admin;
}

module.exports = { login, getProfile };
