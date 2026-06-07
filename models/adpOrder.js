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
    const { order_sn, status, platform, order_amount, commission, create_time } = orderData
    // console.log(order_sn, status, platform, order_amount, commission, create_time);

    const [result] = await pool.execute('INSERT INTO adp_order (order_sn, status,platform,order_amount,commission,create_time) VALUES (?,?,?,?,?,?)', [order_sn, status, platform, order_amount, commission, create_time]);

    return { id: result.insertId, order_sn };
}

/**
 * 更新订单信息
 * @param {string} order_sn 
 * @param {number} status 
 * @returns 
 */
async function updateOrder(order_sn, status) {
    const [result] = await pool.execute('UPDATE adp_order SET status = ? WHERE order_sn = ?', [status, order_sn]);
    console.log(result);
    return result.affectedRows > 0 || false;
}

module.exports = { createAdpOrder, findOrder, updateOrder };

// let obj = {
//     order_sn: '1234567890',
//     status: 2,
//     platform: 'Amazon',
//     order_amount: 100.00,
//     commission: 10.00,
//     create_time: new Date()
// }

// updateOrder('1234567890', 8).then(order => {
//     console.log(order);
// }).catch(err => {
//     console.error(err);
// });

