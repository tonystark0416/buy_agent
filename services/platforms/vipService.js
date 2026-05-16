/* 
请求唯品会联盟接口获取数据
包括商品、订单、获取链接等接口
*/

const crypto = require('crypto');
const axios = require('axios');


/* 
系统级参数，所有接口共享，一样的
appkey,唯品会联盟应用key
appSecret，唯品会联盟应用密钥
*/
const sysConfig = {
    appKey: 'e469a836',
    appSecret: 'ED75FDEC715DB364966E8BF085731917',
}

/**
 * 签名工具（HMAC-MD5，符合 VOP 官方规范）
 * @param {Object} systemParams - 系统级参数（除 sign 外）
 * @param {String} bizParamsJson - 应用级参数的 JSON 字符串
 * @param {String} secret - AppSecret
 * @returns {String} 大写的 HMAC-MD5 签名
 */
function getSign(appKey, format, method, service, timestamp, version, bisData, appSecret) {
    sign = '';
    sign += 'appKey' + appKey + 'format' + format + 'method' + method + 'service' + service + 'timestamp' + timestamp + 'version' + version + bisData;
    const hmac = crypto.createHmac('md5', appSecret);
    hmac.update(sign);
    const digest = hmac.digest('hex').toUpperCase();
    //console.log(digest);
    return digest
}

/**
 * 构建URL查询参数
 * @param {*} request 
 * @returns 
 */
function getQueryString(request) {
    params = '';
    params += 'appKey=' + request.appKey + '&format=' + request.format + '&sign=' + request.sign + '&method=' + request.method + '&service=' + request.service + '&timestamp=' + request.timestamp + '&version=' + request.version
    return params;
}


/**
 * 封装一个通用的请求函数，接受接口名称、业务参数等，构建系统参数、计算签名、发送请求并返回结果
 * @param {String} service - 接口名称，如 'com.vip.adp.api.open.service.UnionGoodsV2Service'
 * @param {String} method - 接口方法，如 'query'
 * @param {Object} bisData - 业务参数对象，将被 JSON.stringify 后作为请求体
 * @returns {Object} 接口响应结果对象
 */
async function vipOpenApiRequest(service, method, bisData) {

    //第一步，构建系统参数
    const sysData = {
        service: service,
        format: 'JSON',
        method: method,
        appKey: sysConfig.appKey,       // 这里直接使用全局配置的 appKey
        appSecret: sysConfig.appSecret,     // 这里直接使用全局配置的 appSecret
        version: '2.0.0',
        timestamp: Date.parse(new Date()) / 1000
    }

    //第二步，计算签名
    sysData.sign = getSign(sysData.appKey, sysData.format, sysData.method, sysData.service, sysData.timestamp, sysData.version, JSON.stringify(bisData), sysData.appSecret);

    //第三步，发送请求
    try {
        const response = await axios.post('https://vop.vipapis.com/?' + getQueryString(sysData), bisData)
        // console.log(response.data);
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
async function searchGoods({keyword, page, pageSize, openid, chanTag}) {
    const service = 'com.vip.adp.api.open.service.UnionGoodsV2Service';
    const method = 'query';
    const bisData = {
        request: {
            keyword: keyword,
            requestId: "mike" + Date.parse(new Date()),
            page: page,
            pageSize: pageSize,
            chanTag: chanTag,
            openId: openid,
            realCall: true
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    // console.log(response);
    return response;

}

/**
 * vip cps商品营销信息接口，获取商品的市场价、佣金等信息
 * @param {*} goodsId 
 * @param {*} openid 
 * @param {*} chanTag 
 * @returns 
 */
async function getGoodsMarketPrice(goodsId, openid, chanTag) {
    const service = 'com.vip.adp.api.open.service.UnionGoodsV2Service';
    const method = 'getGoodsDetailMarketing';
    const bisData = {
        request: {
            goodsId: goodsId,
            requestId: "mike" + Date.parse(new Date()),
            chanTag: chanTag,
            openId: openid,
            realCall: true
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response;
}


async function createGiftCoupon(goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct) {
    const service = 'com.vip.adp.api.open.service.UnionGiftCouponService';
    const method = 'createGiftCoupon';
        const bisData = {
        request: {
            goodsId: goodsId,
            giftName: giftName,
            amount:amount,
            totalCount: totalCount,
            activityStartTime: activityStartTime,
            activityEndTime: activityEndTime,
            useTimeType: useTimeType,
            singleClaimPerLink:singleClaimPerLink, //每个礼金推广链接是否限制仅可领取1张礼金：0不限，1限制
            allSkusUnderProduct: allSkusUnderProduct, //是否绑定同spu商品(1-是; 0-否)，扩展到这款商品的全部颜色，如，口红的全部色号、衣服的全部颜色。
            requestId: "mike" + Date.parse(new Date()),
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response;
}



module.exports = {
    // getGoodsList,
    createGiftCoupon,
    getGoodsMarketPrice,
    searchGoods
}