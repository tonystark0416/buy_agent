// models/VerificationCode.js
const pool = require('../config/database');

async function save(phone, code, type, expiresInMinutes = 5) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);
  await pool.execute(
    'INSERT INTO verification_codes (phone, code, type, expires_at) VALUES (?, ?, ?, ?)',
    [phone, code, type, expiresAt]
  );
}

async function verify(phone, code, type) {
  const [rows] = await pool.execute(
    `SELECT * FROM verification_codes 
     WHERE phone = ? AND code = ? AND type = ? AND used = 0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [phone, code, type]
  );
  if (rows.length === 0) return false;
  // 标记为已使用
  await pool.execute('UPDATE verification_codes SET used = 1 WHERE id = ?', [rows[0].id]);
  return true;
}

module.exports = { save, verify };