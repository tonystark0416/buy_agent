/**
 * 后台商品管理数据访问（adp_goods）
 */
const pool = require('../../utils/database.js');

// 允许写入的字段白名单（id/create_time/update_time 由数据库维护）
const WRITABLE_FIELDS = ['goods_name', 'goods_image_url', 'market_price', 'sale_price', 'platform', 'goods_platform_id'];

async function findGoodsForAdmin(params) {
  const where = ['1=1'];
  const values = [];
  if (params.platform) { where.push('platform = ?'); values.push(params.platform); }
  if (params.goodsName) { where.push('goods_name LIKE ?'); values.push(`%${params.goodsName}%`); }
  const whereSql = where.join(' AND ');

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM adp_goods WHERE ${whereSql}`, values
  );
  const total = countRows[0] ? countRows[0].total : 0;
  const offset = (params.page - 1) * params.pageSize;
  const [rows] = await pool.execute(
    `SELECT * FROM adp_goods WHERE ${whereSql} ORDER BY id DESC LIMIT ?, ?`,
    [...values, offset, params.pageSize]
  );
  return { list: rows, total };
}

async function findGoodsById(id) {
  const [rows] = await pool.execute('SELECT * FROM adp_goods WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createGoods(data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO adp_goods (${fields.join(', ')}) VALUES (${placeholders})`,
    fields.map((f) => data[f])
  );
  return { id: result.insertId };
}

async function updateGoods(id, data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  if (!fields.length) return false;
  const setSql = fields.map((f) => `${f} = ?`).join(', ');
  const [result] = await pool.execute(
    `UPDATE adp_goods SET ${setSql} WHERE id = ?`,
    [...fields.map((f) => data[f]), id]
  );
  return result.affectedRows > 0;
}

async function deleteGoods(id) {
  const [result] = await pool.execute('DELETE FROM adp_goods WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findGoodsForAdmin, findGoodsById, createGoods, updateGoods, deleteGoods };
