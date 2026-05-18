/**
 * @author: liuweizhao
 * @date: 2025-12-23 15:12:00   
 */

const mysql = require('mysql2/promise');
// require('dotenv').config();

const pool = mysql.createPool({
  host:'42.194.245.3',
  port:3306,
  user: 'mike',
  password: 'mike@0416',
  database: 'mike',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// async function findByPhone(id) {
//   const [rows] = await pool.execute('SELECT * FROM adp_user WHERE id = ?', [id]);
//   console.log(rows)
//   return rows[0] || null;
// }

// findByPhone(64).catch  (err=>  console.error(err));
module.exports = pool;