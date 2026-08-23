/* 
*  请求 多多联盟 接口获取数据，包括商品、订单、获取链接等接口
*/

const crypto = require('crypto');
const axios = require('axios');
const config = require('../../config/config.js');

/**
 * 签名函数  https://open.pinduoduo.com/application/document/browse?idStr=8EC06C399636041E
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
    result = config.pdd_cps_key.appSecret + result + config.pdd_cps_key.appSecret;
    const md5 = crypto.createHash('md5').update(result).digest('hex');
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
        client_id: config.pdd_cps_key.client_id,
        timestamp: Date.parse(new Date()) / 1000,
        data_type: "JSON",
        // timestamp: 1779991567
    }

    //第二步，计算签名
    const sign = getSign(sysParam, bisData);

    //组装post请求体
    const bizParams = { ...bisData, ...sysParam, sign: sign }

    //第三步，发送请求
    try {
        const response = await axios.post('https://gw-api.pinduoduo.com/api/router', bizParams)
        return response.data; //返回对象
    } catch (error) {
        console.error(error)
        throw error; // 抛出错误以便调用者处理
    }
}

// ================= 各种API的实现对接=================




/**
 * 拼多多 cps搜索接口
 * @param {*} keyword 
 * @param {*} page 
 * @param {*} pageSize 
 * @param {*} openid 
 * @param {*} chanTag 
 * @returns 
 */
async function searchGoods({ activity_tags, keyword, page, page_size, pid }) {
    // console.log('调用拼多多搜索接口，参数：', {activity_tags,keyword, page, page_size,pid });
    const type = 'pdd.ddk.goods.search';

    const bizParams = {
        block_cat_packages: '[1,2,3,4,5]', //屏蔽类目
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
    return response;
}

/**
 * 拼多多生成授权链接接口，授权备案流程 https://jinbao.pinduoduo.com/qa-system?questionId=204
 * @param {*} uid 用户id
 * @param {*} pid 拼多多推广位id，pid
 * @returns
 */
async function genAuthUrl({ uid, pid }) {
    if (!uid || !pid) { throw new Error('uid和pid不能为空');}
    const type = 'pdd.ddk.rp.prom.url.generate';
    const bizParams = {
        channel_type: 10, //10-生成绑定备案链接
        custom_parameters: `{"uid":"${uid}"}`,
        generate_short_url: true,
        generate_we_app: true,
        p_id_list: `['${pid}']`,
    }
    const response = await pddOpenApiRequest(type, bizParams);
    return response;
}




/**
 * 拼多多查询授权接口
 * @param {*} uid 用户id
 * @param {*} pid 拼多多推广位id，pid
 * @returns bind:1-已绑定；0-未绑定
 */
async function checkAuth({ uid, pid }) {
    const type = 'pdd.ddk.member.authority.query';
    const bizParams = {
        custom_parameters: `{"uid":"${uid}"}`,
        pid: `${pid}`,
    }
    const response = await pddOpenApiRequest(type, bizParams);
    return response;
}


/**
 * 拼多多转链接接口 pdd.ddk.goods.zs.unit.url.gen ，本接口用于将其他推广者的单品推广链接直接转换为自己的，如果您的推广场景为采集群，可直接使用此接口
 * @parm {String} uid 用户id
 * @parm {String} pid 拼多多推广位id，pid
 * @parm {String} source_url 原始链接
 * @returns
 */
async function urlGen({ uid, pid, source_url }) {

    const type = 'pdd.ddk.goods.zs.unit.url.gen';
    const bizParams = {
        custom_parameters: `{"uid":"${uid}"}`,
        pid: `${pid}`,
        source_url:source_url,
        generate_short_link: true,
        generate_we_app_long_link: true
    }
    const response = await pddOpenApiRequest(type, bizParams);
    return response;
}




module.exports = {
    searchGoods,
    genAuthUrl,
    checkAuth,
    urlGen
}