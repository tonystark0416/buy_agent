/**
 * @author: liuweizhao
 * @date: 2025-12-10 15:12:00
 * @last author: liuweizhao
 * @last date: 2025-12-10 15:12:00 
 */

// models/User.js

const pool = require('../utils/database.js');

async function findByPhone(phone) {
    // console.log(phone);
    const [rows] = await pool.execute('SELECT * FROM adp_user WHERE phone = ?', [phone]);
    return rows[0] || null;
}

async function findByOpenid(openid) {
    // console.log(openid);
    const [rows] = await pool.execute('SELECT * FROM adp_user WHERE openid = ?', [openid]);
    return rows[0] || null;
}

async function createUser(phone, password =null, openid = null) {
    console.log(phone, password, openid);
    const [result] = await pool.execute('INSERT INTO adp_user (phone, password, openid) VALUES (?, ?, ?)', [phone, password, openid]);
    return { id: result.insertId, phone};
}



module.exports = {
    findByPhone,
    createUser,
    findByOpenid
};