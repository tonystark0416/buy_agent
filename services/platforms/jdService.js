

/*
对接京东联盟接口
接口调用教程：https://union.jd.com/searchResultDetail?articleId=108188
京东接口限制：https://union.jd.com/searchResultDetail?articleId=166831，暂时不够体量不能对接

目前只封装：转链接接口
*/


const crypto = require('crypto');
const axios = require('axios');
const config = require('../../config/config.js');

//获取符合京东要求的时间戳
function formatJdTimestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 京东联盟签名算法：MD5(appSecret + key1 + value1 + key2 + value2 + ... + appSecret)
 * 其中所有请求参数都按 key 升序排列，sign 不参与计算
 */
function getJdSign(params, appSecret) {
    const sortedKeys = Object.keys(params)
        .filter((key) => key !== 'sign')
        .sort();

    let raw = '';
    for (const key of sortedKeys) {
        raw += `${key}${params[key]}`;
    }

    return crypto
        .createHash('md5')
        .update(`${appSecret}${raw}${appSecret}`)
        .digest('hex')
        .toUpperCase();
}

function buildJdRequestUrl(params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    }
    return `https://api.jd.com/routerjson?${searchParams.toString()}`;
}

/**
 * 通用京东联盟接口请求
 *   method: 京东接口名称
 *   bizParams: 业务参数对象，必须最终转换成 360buy_param_json 字符串
 */
async function jdOpenApiRequest(method, bizParams = {}, options = {}) {
    const {
        appKey = config.jd_cps_key.appKey,
        appSecret = config.jd_cps_key.appSecret,
        accessToken,
    } = options;

    const normalizedBizParams = {};
    for (const [key, value] of Object.entries(bizParams)) {
        normalizedBizParams[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    const requestParams = {
        app_key: appKey,
        method,
        timestamp: formatJdTimestamp(),
        format: 'json',
        v: '1.0',
        sign_method: 'md5',
        ...normalizedBizParams,
    };
    // console.log('requestParams:', requestParams);

    if (accessToken) {
        requestParams.access_token = accessToken;
    }

    requestParams.sign = getJdSign(requestParams, appSecret);

    const url = buildJdRequestUrl(requestParams);
    const response = await axios.get(url, { timeout: 20000 });
    return response.data;
}






/**
 * 京东联盟转链接接口
 * 接口：jd.union.open.promotion.bysubunionid.get
 * 适合：商品/活动/店铺转链
 * 业务参数必须是 360buy_param_json 字符串，而不能直接传对象
 */
async function genUrl({ materialId, sceneId = 1 } = {}) {
    const bizParams = {
        "360buy_param_json": JSON.stringify({
            promotionCodeReq: {
                sceneId,
                materialId,
                weChatType:1,
                chainType:3
            },
        }),
    };

    return jdOpenApiRequest('jd.union.open.promotion.bysubunionid.get', bizParams);
}




module.exports = {
    genUrl,
};