// require('dotenv').config({
//   path: require('path').resolve(__dirname, '../../.env')
// });

/**
 * 美团联盟 - 获取推广链接接口 demo（Node.js）
 *
 * 参考文档：美团联盟 API 接入指南
 *   https://media.meituan.com/pc/index.html#/help?path=API接入指南
 *
 * 接口：获取推广链接 get_referral_link
 * 地址：https://media.meituan.com/cps_open/common/api/v1/get_referral_link
 * 方式：POST，请求体 JSON
 *
 * 公共签名请求头：
 *   S-Ca-App                分配的 AppKey
 *   S-Ca-Timestamp          当前时间戳（毫秒），有效期为 2 分钟
 *   Content-MD5             Body 的 MD5 值（Base64 编码），有请求体接口必传
 *   S-Ca-Signature-Headers  参与签名的 header 列表，英文逗号分隔
 *   S-Ca-Signature          HMAC-SHA256 签名结果的 Base64 值
 *
 * 运行: node sign-demo.js
 */



const axios = require('axios');
const SignUtil = require('../../utils/meituan-sign-util');
const config = require('../../config/config.js');


// =====================================================================
// 在这里替换成你自己的 AppKey 和 AppSecret（美团联盟开放平台申请）
// =====================================================================
SignUtil.APP_KEY = config.meituan_cps_key.appKey;
SignUtil.APP_SECRET = config.meituan_cps_key.appSecret;
// =====================================================================

//统一请求函数
async function requestMeituan(url, postData) {
    const config = { method: 'post', url, data: postData };

    // 1. 生成签名头部（S-Ca-App / S-Ca-Timestamp / Content-MD5 / S-Ca-Signature）
    const signHeaders = SignUtil.getSignHeaders(config);
    // console.log('请求地址:', url);
    // console.log('请求参数:', JSON.stringify(postData));
    // console.log('签名头部:', JSON.stringify(signHeaders, null, 2));

    // 2. 发起请求（axios 版本）
    const res = await axios({
        method: 'post',
        url,
        data: postData,
        headers: {
            ...signHeaders,
            'Content-Type': 'application/json',
        },
        validateStatus: () => true,
    });

    console.log('\nHTTP 状态码:', res.status);

    // 3. 解析响应
    let result;
    try {
        result = res.data;
        if (typeof result === 'string') {
            result = JSON.parse(result);
        }
    } catch (e) {
        result = res.data;
    }
    console.log('响应内容:', JSON.stringify(result, null, 2));

    return result;
}

//获取商品信息
async function getGoodsInfo(searchText) {
    // 获取推广链接接口地址
    const API_URL = 'https://media.meituan.com/cps_open/common/api/v1/query_coupon';

    const requestData = {
        searchText: searchText,
        longitude:113.227669*1000000,
        latitude:23.093816*1000000,
        platform:2,
        listTopiId:2
    };
    const res = await requestMeituan(API_URL, requestData);
    return res;
}


//生成推广链接
async function getReferralLink(actId) {
    // 获取推广链接接口地址
    const API_URL = 'https://media.meituan.com/cps_open/common/api/v1/get_referral_link';

    const requestData = {
        actId: actId,
        linkTypeList:[1,2,3,4,5,6],
    };
    const res = await requestMeituan(API_URL, requestData);
    return res;
}

//获取订单信息，支持单个订单，支持批量获取
async function getOrderInfo() {
    // 获取推广链接接口地址
    const API_URL = 'https://media.meituan.com/cps_open/common/api/v1/query_order';

    const requestData = {
        queryTimeType:1,
        startTime: 1786879206,
        endTime:1786969206,
    };
    const res = await requestMeituan(API_URL, requestData);
    return res;
}


module.exports = {
    getGoodsInfo,
    getReferralLink,
    getOrderInfo
};
