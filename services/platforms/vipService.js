/* 
请求唯品会联盟接口获取数据
包括商品、订单、获取链接等接口
*/

const crypto = require('crypto');
const axios = require('axios');
const config = require('../../config/config.js');


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
        appKey: config.vip_cps_key.appKey,       // 这里直接使用全局配置的 appKey
        appSecret: config.vip_cps_key.appSecret,     // 这里直接使用全局配置的 appSecret
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


// ================= 各种API的实现对接=================


/**
 * 检查用户是否绑定了唯品会联盟账号
 * @param {String} openId - 用户的唯一标识
 * @returns {number} 是否已授权唯品会，0-未授权，1-已授权
 */
async function checkUser({ uid }) {
    const service = 'com.vip.adp.api.open.service.UnionUserV2Service';
    const method = 'checkUser';
    const bisData = {
        request: {
            openId: uid,
            requestId: "mike" + Date.parse(new Date()),
            scene: 2
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response
}


/**
 * 解绑授权账号
 * @param {String} openId - 用户的唯一标识
 * @returns {object} 解绑结果 -1,没找到openid，1，解绑成功 / openId授权关系重复解绑
 */
async function unbindOpenId(openId) {
    const service = 'com.vip.adp.api.open.service.UnionUserV2Service';
    const method = 'unbindOpenId';
    const bisData = {
        request: {
            openId: openId,
            requestId: "mike" + Date.parse(new Date()),
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response?.result
}




/**
 * 获取授权链接
 * @param {String} openId - 用户的唯一标识
 * @returns {object} 授权链接URL,包含各种链接格式的url
 */
async function getAuthUrl({ uid }) {
    const service = 'com.vip.adp.api.open.service.UnionUrlV2Service';
    const method = 'getChannelUrlByType';
    const bisData = {
        request: {
            type: "BIND_FILING_LINK",
            chanTag: "default_pid",
            requestId: "mike" + Date.parse(new Date()),
            compressShortUrl: true,
            openId: uid,
            realCall: true
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response?.result?.data || null;
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
async function searchGoods({ keyword, page, pageSize, openid, chanTag }) {
    // console.log('调用 VIP 搜索接口，参数：', {keyword, page, pageSize, openid, chanTag});
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
    return response;

}


/**
 * 通过组货码批量拉取商品信息接口，支持批量拉取商品的市场价、商品详情、佣金等信息
 * @param {string} jxCode , 唯品会联盟组货码，必传
 * @param {number} offset 查询偏移(必传字段)，查询第一页传0，后续查询传上一页返回的nextPageOffset字段
 * @param {number} pageSize 每页条数(必传字段)，每页条数建议20，最大支持100
 * @param {string} openid 
 * @param {string} chanTag 
 * @return {object} 商品信息列表，lastPage会标识是否最后一页，nextPageOffset会提供下一页查询的offset值
 */
async function goodsListV2({ jxCode, offset, pageSize, openid, chanTag }) {
    const service = 'com.vip.adp.api.open.service.UnionGoodsV2Service';
    const method = 'goodsListV2';
    const bisData = {
        request: {
            jxCode: jxCode,
            sourceType: 1,
            requestId: "mike" + Date.parse(new Date()),
            chanTag: chanTag || 'defaultChanTag',
            openId: openid || 'defaultOpenId',
            realCall: true,
            pageSize: pageSize || 20,
            offset: offset,
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response;
}



/**
 * vip cps商品营销信息接口，获取商品的市场价、商品详情、佣金等信息,https://vop.vip.com/home#/api/method/detail/com.vip.adp.api.open.service.UnionGoodsV2Service-2.0.0/getGoodsDetailMarketing
 * @param {*} goodsId 
 * @param {*} openid 
 * @param {*} chanTag 
 * @returns  
 */
async function getGoodsMarketPrice({ goodsId, openid, chanTag }) {
    const service = 'com.vip.adp.api.open.service.UnionGoodsV2Service';
    const method = 'getGoodsDetailMarketing';
    const bisData = {
        request: {
            queryDetail: true,
            goodsId: goodsId,
            requestId: "mike" + Date.parse(new Date()),
            chanTag: chanTag || 'defaultChanTag',
            openId: openid || 'defaultOpenId',
            realCall: true
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);

    if (response.returnCode === '0') {
        return response.result;
    }else{
        return false
    }

}



/**
 * 唯品会CPS链接解析接口
 * @param {*} content 检查的链接 支持输入多个链接 多个链接的情况下中间用空格隔开(长度不超过10000)
 * @returns 
 */
async function vipLinkCheck(content) {
    const service = 'com.vip.adp.api.open.service.UnionUrlV2Service';
    const method = 'vipLinkCheck';
    const bisData = {
        vipLinkCheckReq: {
            source: 'mike',
            content: content,
            requestId: "mike" + Date.parse(new Date()),
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response;
}





/**
* vip cps 生成推广链接接口，根据【商品ID】生成推广链接  
* @param {*} goodsId 
* @param {*} openid 
* @param {*} chanTag 
* @returns 返回连接数组
 */
async function genByGoodsId({ goodsId, openId, chanTag, statParam, genAuthorityUrl = false, giftCode }) {
    console.log('调用 VIP 生成推广链接接口，参数：', { goodsId, openId, chanTag, statParam, genAuthorityUrl, giftCode });
    const service = 'com.vip.adp.api.open.service.UnionUrlV2Service';
    const method = 'genByGoodsId';
    const bisData = {
        requestId: "mike" + Date.parse(new Date()),
        goodsIdList: [goodsId],
        chanTag: chanTag || 'defaultChanTag',            //推广位pid
        statParam: statParam || "defaultStat",          //自定义统计参数，选填
        genShortUrl: true,                              //是否生成短链接，默认为true
        urlGenByGoodsIdRequest: {
            openId: openId || 'defaultOpenId',          //用户唯一标识,接口必传
            realCall: true,
            genAuthorityUrl: genAuthorityUrl,          //是否生成授权链接，默认为false
            adCode: "unionapi",
            giftCode: giftCode || '',           //礼金码，选填，genByGoodsId接口支持传入礼金码参数，如果传入了礼金码参数，
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response?.result?.urlInfoList[0] || null;    
}



/**
* vip cps 生成推广链接接口，根据【唯品会连接】生成推广链接  
* @param {*} urlList 
* @param {*} openid 
* @param {*} chanTag 
* @returns 返回连接数组
*/
async function genByVIPUrl({ urlList, openId, chanTag, statParam, genAuthorityUrl = false, giftCode }) {
    const service = 'com.vip.adp.api.open.service.UnionUrlV2Service';
    const method = 'genByVIPUrl';
    const bisData = {
        requestId: "mike" + Date.parse(new Date()),
        urlList: [urlList],
        chanTag: chanTag || 'defaultChanTag',            //推广位pid
        statParam: statParam || "defaultStat",          //自定义统计参数，选填                               
        urlGenRequest: {
            openId: openId || 'defaultOpenId',    //用户唯一标识,接口必传
            genShortUrl: true,                   //是否生成短链接，默认为true
            realCall: true,
            genAuthorityUrl: genAuthorityUrl,          //是否生成授权链接，默认为false
            adCode: "unionapi",
            giftCode: giftCode || '',         //礼金码，选填，genByGoodsId接口支持传入礼金码参数，如果传入了礼金码参数，
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response
}



/**
 * 唯品会礼金功能
 * @param {*} goodsId 
 * @param {*} giftName 
 * @param {*} amount 
 * @param {*} totalCount 
 * @param {*} activityStartTime 
 * @param {*} activityEndTime 
 * @param {*} useTimeType 
 * @param {*} singleClaimPerLink 
 * @param {*} allSkusUnderProduct 
 * @returns 
 */
async function createGiftCoupon(goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct) {
    const service = 'com.vip.adp.api.open.service.UnionGiftCouponService';
    const method = 'createGiftCoupon';
    const bisData = {
        request: {
            goodsId: goodsId,
            giftName: giftName,
            amount: amount,
            totalCount: totalCount,
            activityStartTime: activityStartTime,       //2026-06-03 00:00:00
            activityEndTime: activityEndTime,
            useTimeType: useTimeType,
            singleClaimPerLink: singleClaimPerLink,     //每个礼金推广链接是否限制仅可领取1张礼金：0不限，1限制
            allSkusUnderProduct: allSkusUnderProduct,   //是否绑定同spu商品(1-是; 0-否)
            requestId: "mike" + Date.parse(new Date()),
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    return response;
}




/**
 * 订单接口，获取CPS推广订单
 * @param {*} orderTimeStart  2026-05-03 11:00:00
 * @param {*} orderTimeEnd  2026-05-03 12:00:00
 * @returns 返回订单列表数组
 * 订单接口的调用频率限制：每个应用每分钟调用不超过10次，每次调用返回的数据量不超过100条。
 */
async function orderList({ status, page, pageSize, orderTimeStart, orderTimeEnd }) {
    // console.log('调用 VIP 订单接口，参数：', { status, page, pageSize, orderTimeStart, orderTimeEnd });
    const service = 'com.vip.adp.api.open.service.UnionOrderV2Service';
    const method = 'orderList';
    const bisData = {
        queryModel: {
            status: status || null,  //订单状态:0-不合格，1-待定，2-已完结，该参数不设置默认代表全部状态
            orderTimeStart: Date.parse(new Date(orderTimeStart)),
            orderTimeEnd: Date.parse(new Date(orderTimeEnd)),
            page: page,
            pageSize: pageSize,
            requestId: "mike" + Date.parse(new Date()),
        }
    }
    const response = await vipOpenApiRequest(service, method, bisData);
    // console.log('订单接口响应：', response);
    return response?.result;
}





module.exports = {
    getGoodsMarketPrice,
    searchGoods,
    goodsListV2,
    genByVIPUrl,
    genByGoodsId,
    createGiftCoupon,
    orderList,
    checkUser,
    getAuthUrl,
    unbindOpenId,
    vipLinkCheck
}

