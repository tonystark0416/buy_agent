/**
 * 后台订单查询数据访问（adp_order）
 * 动态条件 + 参数化查询，字段名白名单由 service 层保证
 */
const pool = require('../../utils/database.js');

/**
 * 构造动态 WHERE 条件（值全部走占位符）
 * @param {Object} p 已校验的查询参数
 */
function buildWhere(p) {
  const where = ['1=1'];
  const values = [];
  if (p.orderSn) { where.push('order_sn = ?'); values.push(p.orderSn); }
  if (p.platforms && p.platforms.length) {
    where.push(`platform IN (${p.platforms.map(() => '?').join(',')})`);
    values.push(...p.platforms);
  }
  if (p.status !== undefined && p.status !== null && p.status !== '') {
    where.push('status = ?'); values.push(p.status);
  }
  if (p.uid) { where.push('uid = ?'); values.push(p.uid); }
  if (p.goodsName) { where.push('goods_name LIKE ?'); values.push(`%${p.goodsName}%`); }
  if (p.startTime) { where.push('create_time >= ?'); values.push(p.startTime); }
  if (p.endTime) { where.push('create_time < ?'); values.push(p.endTime); }
  return { whereSql: where.join(' AND '), values };
}

// 排序白名单
const SORT_COLUMNS = { create_time: 'create_time', update_time: 'update_time', commission: 'commission', order_amount: 'order_amount' };
const SORT_ORDERS = { asc: 'ASC', desc: 'DESC' };

async function findOrdersForAdmin(params) {
  const { whereSql, values } = buildWhere(params);
  const sortCol = SORT_COLUMNS[params.sortField] || 'create_time';
  const sortOrder = SORT_ORDERS[params.sortOrder] || 'DESC';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM adp_order WHERE ${whereSql}`, values
  );
  const total = countRows[0] ? countRows[0].total : 0;
  const offset = (params.page - 1) * params.pageSize;
  const [rows] = await pool.execute(
    `SELECT order_sn, uid, goods_id, goods_name, goods_img_url, status, platform,
            order_amount, commission, create_time, update_time
     FROM adp_order WHERE ${whereSql}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT ?, ?`,
    [...values, offset, params.pageSize]
  );
  return { list: rows, total };
}

async function findByOrderSn(orderSn) {
  const [rows] = await pool.execute(
    `SELECT order_sn, uid, goods_id, goods_name, goods_img_url, status, platform,
            order_amount, commission, create_time, update_time
     FROM adp_order WHERE order_sn = ?`,
    [orderSn]
  );
  return rows[0] || null;
}

module.exports = { findOrdersForAdmin, findByOrderSn };
