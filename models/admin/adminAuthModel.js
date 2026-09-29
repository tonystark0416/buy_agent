/**
 * 后台管理员表数据访问（adp_admin_user）
 */
const pool = require('../../utils/database.js');

async function findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, nickname, role, status FROM adp_admin_user WHERE username = ?',
    [username]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, nickname, role, status, last_login_at, create_time FROM adp_admin_user WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function updateLastLogin(id) {
  await pool.execute('UPDATE adp_admin_user SET last_login_at = NOW() WHERE id = ?', [id]);
}

module.exports = { findByUsername, findById, updateLastLogin };
