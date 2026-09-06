/**
 * @author: liuweizhao
 * @date: 2025-12-10 15:12:00
 * @last author: liuweizhao
 * @last date: 2025-12-10 15:12:00 
 */

// models/adpOrder.js
const pool = require('../utils/database.js');

/**
 * 查询订单号
 * @param {string} order_sn 
 * @returns 
 */
async function findOrder(order_sn) {
    // console.log(order_sn);
    const [rows] = await pool.execute('SELECT * FROM adp_order WHERE order_sn = ?', [order_sn]);
    return rows[0] || null;
}

/**
 * 创建订单
 * @param {Object} orderData 
 * @returns   
 */
async function createAdpOrder(orderData) {
    const { order_sn, uid, goods_id, goods_name,goods_img_url,status, platform, order_amount, commission, create_time, update_time } = orderData
    console.log(orderData);

    const [result] = await pool.execute('INSERT INTO adp_order (order_sn, uid,goods_id,goods_name,goods_img_url,status,platform,order_amount,commission,create_time,update_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [order_sn, uid, goods_id,goods_name,goods_img_url, status, platform, order_amount, commission, create_time, update_time]);

    return { id: result.insertId, order_sn };
}

/**
 * 更新订单信息
 * @param {Object} orderData
 * @returns 
 */
async function updateOrder(orderData) {
    const { order_sn, status, uid, goods_id, goods_name,goods_img_url,platform, order_amount, commission, create_time, update_time } = orderData
    const [result] = await pool.execute('UPDATE adp_order SET status = ? ,uid=?,goods_id=? ,goods_name=?,goods_img_url=?,platform=?,order_amount=?,commission=?,update_time=?,create_time=? WHERE order_sn = ?', [status, uid, goods_id, goods_name,goods_img_url,platform,order_amount,commission,update_time,create_time ,order_sn]);
    // console.log(result);
    return result.affectedRows > 0 || false;
}

/**
 * 根据用户信息获取订单列表
 * 
 */
async function getOrderListByUid(params) {
    const { uid, page,platform } = params
    const sqlCount = 'SELECT count(*) as total FROM adp_order where uid =? AND platform =? '
    const sqlList = 'SELECT * FROM adp_order where uid =? AND platform =? ORDER BY create_time DESC limit ?,? '
    const pageSize = 10
    const pageNo = (page - 1) * pageSize;
    

    const [countRows] = await pool.execute(sqlCount, [uid,platform]); //统计总数
    console.log(countRows)
    const [rows] = await pool.execute(sqlList, [uid, platform, pageNo, pageSize]); //分页查询

    const total = countRows[0]?.total || 0
    const totalPages = Math.ceil(total / pageSize);

    return {
        list: rows,
        page,
        pageSize,
        total,
        totalPages
    };
}






module.exports = { createAdpOrder, findOrder, updateOrder, getOrderListByUid };

