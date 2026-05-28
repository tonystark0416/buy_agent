/* 
请求 多多联盟 接口获取数据
包括商品、订单、获取链接等接口
*/

const crypto = require('crypto');
const axios = require('axios');


/* 
系统级参数，所有接口共享，一样的
appkey,多多联盟应用key
appSecret，多多联盟应用密钥
*/
const sysConfig = {
    client_id: 'b1409cfff76d49e0823c68b59fb64367',
    appSecret: 'f0f18444e059e84c7fad35ee85fcb4fd9f76fabe',
}

// const sysParam = {
//     type: 'pdd.ddk.goods.search',
//     client_id: sysConfig.client_id,
//     // timestamp: Date.parse(new Date()) / 1000
//     data_type: "JSON",
//     timestamp: 1779987135
// }

// const bisParam = {
//     "activity_tags": "[4,7]",
// }


/**
 * 签名函数
 * @param {*} sysParam 
 * @param {*} bisParam 
 * @returns 
 */
function getSign(sysParam, bisParam) {
    const params = {
        ...sysParam,
        ...bisParam
    }
    const sortedKeys = Object.keys(params).sort();
    let result = '';
    for (const key of sortedKeys) {
        let value = params[key];
        result += key + value;
    }
    result = sysConfig.appSecret + result + sysConfig.appSecret;
    console.log(result);
    const md5 = crypto.createHash('md5').update(result).digest('hex');
    console.log(md5.toUpperCase());
    return md5.toUpperCase();

}







/**
 * 封装一个通用的请求函数，接受接口名称、业务参数等，构建系统参数、计算签名、发送请求并返回结果
 * @param {String} type - 接口名称，如 'pdd.ddk.goods.search'
 * @param {Object} bisData - 业务参数对象，将被 JSON.stringify 后作为请求体
 * @returns {Object} 接口响应结果对象   
 */
async function pddOpenApiRequest(type, bisData) {

    //第一步，构建系统参数
    const sysParam = {
        type: type,
        client_id: sysConfig.client_id,
        timestamp: Date.parse(new Date()) / 1000,
        data_type: "JSON",
        // timestamp: 1779991567
    }

    //第二步，计算签名
    const sign = getSign(sysParam, bisData);

    const bizParams = {
        ...bisData,
        ...sysParam,
        sign: sign
    }

    //第三步，发送请求
    try {
        const response = await axios.post('https://gw-api.pinduoduo.com/api/router', bizParams)
        console.log(response.data);
        const result = response.data;
        return result; //返回对象
    } catch (error) {
        console.error(error)
        throw error; // 抛出错误以便调用者处理
    }
}



/**
 * vip cps搜索接口
 * @param {*} keyword 
 * @param {*} page 
 * @param {*} pageSize 
 * @param {*} openid 
 * @param {*} chanTag 
 * @returns 
 */
async function searchGoods(activity_tags,page,page_size) {

    const type = 'pdd.ddk.goods.search';
    const bizParams = {
        activity_tags: activity_tags,
        page: page,
        page_size: page_size
    }
    const response = await pddOpenApiRequest(type, bizParams);
    // console.log(response);
    return response;

}

// searchGoods('[4]', 1, 10).then(res => {
//     console.log(res.goods_search_response);
// }).catch(err => {
//     console.error(err);
// })

module.exports = {
    searchGoods
}