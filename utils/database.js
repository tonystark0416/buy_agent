/**
 * @author: liuweizhao
 * @date: 2025-12-23 15:12:00   
 */

const mysql = require('mysql2/promise');
const config = require('../config/config.js');
// console.log('数据库配置:', config.db);

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});


module.exports = pool;