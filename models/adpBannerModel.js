

/**
 * 
 * @description banner服务，提供banner相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const pool = require('../utils/database.js');

async function findBanner(type) {
    // console.log(phone);
    const [rows] = await pool.execute('SELECT * FROM adp_banner where type =? order by sort desc', [type]);
    return rows || null;
}




module.exports = {
  findBanner
};