/**
 * 后台用户查询数据访问（adp_user）
 * 注意：出于安全考虑，任何查询均不返回 password 字段
 */
const pool = require('../../utils/database.js');

const USER_COLUMNS = 'id, phone, openid';

async function findUsersForAdmin(params) {
  const where = ['1=1'];
  const values = [];
  if (params.id) { where.push('id = ?'); values.push(params.id); }
  if (params.phone) { where.push('phone LIKE ?'); values.push(`%${params.phone}%`); }
  if (params.openid) { where.push('openid = ?'); values.push(params.openid); }
  const whereSql = where.join(' AND ');

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM adp_user WHERE ${whereSql}`, values
  );
  const total = countRows[0] ? countRows[0].total : 0;
  const offset = (params.page - 1) * params.pageSize;
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS} FROM adp_user WHERE ${whereSql} ORDER BY id DESC LIMIT ?, ?`,
    [...values, offset, params.pageSize]
  );
  return { list: rows, total };
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${USER_COLUMNS} FROM adp_user WHERE id = ?`, [id]
  );
  return rows[0] || null;
}

/**
 * 用户订单汇总（按平台分组）
 */
async function userOrderStats(uid) {
  const [rows] = await pool.execute(
    `SELECT platform,
            COUNT(*) AS order_count,
            COALESCE(SUM(order_amount), 0) AS total_amount,
            COALESCE(SUM(commission), 0) AS total_commission
     FROM adp_order WHERE uid = ? GROUP BY platform`,
    [uid]
  );
  return rows;
}

module.exports = { findUsersForAdmin, findUserById, userOrderStats };
