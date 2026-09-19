
/**
 * 商品模型
 * 
 * @param {string} name 商品名称
 * @param {string} code 商品编码
 * @param {string} unit 商品单位
 * @param {number} price 商品价格
 * @param {number} stock 商品库存
 * @param {number} minStock 商品最小库存
 * @param {number} maxStock 商品最大库存
 * @param {number} minPrice 商品最小价格
 * @param {number} maxPrice 商品最大价格
 * @param {number} minSale 商品最小销售量
 * @param {number} maxSale 商品最大销售量
 * @param {number} minSalePrice 商品最小销售价格
 * @param {number} maxSalePrice 商品最大销售价格
 * @param {number} minSaleRate 商品最小销售率
 * @param {number} maxSaleRate 商品最大销售率
 * @param {number} minSaleMoney 商品最小销售金额
 * @param {number} maxSaleMoney 商品最大销售金额
 *
 */
// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../utils/database.js');


async function selectGoodsList() {
    // console.log(phone);
    const [rows] = await pool.execute('SELECT * FROM adp_goods where platform = "pdd" ');
    return rows || null;
}

// selectGoodsList().then(res => {
//     console.log(res)
// })  

module.exports = { selectGoodsList };