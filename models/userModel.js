/**
 * @author: liuweizhao
 * @date: 2025-12-10 15:12:00
 * @last author: liuweizhao
 * @last date: 2025-12-10 15:12:00 
 */

// models/User.js

const pool = require('../config/database.js');

async function findByPhone([phone]) {
    const [rows] = await pool.execute('SELECT * FROM adp_user WHERE phone = ?', [phone]);
    return rows[0] || null;
}

async function createUser({ phone, password =null}) {
    const [result] = await pool.execute('INSERT INTO adp_user (phone, password) VALUES (?, ?)', [phone, password]);
    return { id: result.insertId, phone};
}

async function updatePassword(phone, password) {
  await pool.execute('UPDATE adp_user SET password = ? WHERE phone = ?', [password, phone]);
}

module.exports = {
    findByPhone,
    createUser,
    updatePassword
};