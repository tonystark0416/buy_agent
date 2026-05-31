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
    // console.log(result);
    const md5 = crypto.createHash('md5').update(result).digest('hex');
    // console.log(md5.toUpperCase());
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

    //组装post请求体
    const bizParams = {...bisData, ...sysParam, sign: sign }
    
    //第三步，发送请求
    try {
        const response = await axios.post('https://gw-api.pinduoduo.com/api/router', bizParams)
        return response.data; //返回对象
    } catch (error) {
        console.error(error)
        throw error; // 抛出错误以便调用者处理
    }
}



/**
 * 拼多多 cps搜索接口
 * @param {*} keyword 
 * @param {*} page 
 * @param {*} pageSize 
 * @param {*} openid 
 * @param {*} chanTag 
 * @returns 
 */
async function searchGoods({activity_tags,keyword, page, page_size,pid }) {
    // console.log('调用拼多多搜索接口，参数：', {activity_tags,keyword, page, page_size,pid });
    const type = 'pdd.ddk.goods.search';

    const bizParams = {
        block_cat_packages:'[1,2,3,4,5]', //屏蔽类目
        page: page,
        page_size: page_size,
        keyword: keyword,
        // custom_parameters: custom_parameters,
        pid: pid,
    }

    //活动标记，看看是否有传入
    if (activity_tags) {
        bizParams.activity_tags = activity_tags;
    }

    const response = await pddOpenApiRequest(type, bizParams);
    // console.log('拼多多服务搜索接口响应：', response);
    return response;
}




// let obj = {
//     page: 1,
//     page_size: 10,
//     keyword: '坚果',
//     pid:'44439853_316094909',
//     activity_tags: '[4]'
// }
// searchGoods(obj).then(res => {
//     const items = res?.goods_search_response?.goods_list || [];
//     console.log(items);
//     // for (const item of items) {
//     //     console.log('商品名称：', item.goods_name);
//     //     console.log('价格：', item.activity_tags);
//     // }
// }).catch(err => {
//     console.error(err);
// })






module.exports = {
    searchGoods,
    // pddAuthUid
}