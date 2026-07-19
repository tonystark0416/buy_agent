/**
 * Weixin Service
 * @description: 微信相关服务，如获取access_token等 
 */

const axios = require('axios');
const config = require('../../config/config');

let cachedAccessToken = null;
let accessTokenExpireAt = 0;

/**
 * 获取微信token
 * @returns 
 */
async function getAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpireAt) {
    return cachedAccessToken;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.appSecret}`;
  const { data } = await axios.get(url);

  if (data.errcode) {
    throw new Error(`Wechat access token error: ${data.errmsg}`);
  }

  cachedAccessToken = data.access_token;
  accessTokenExpireAt = Date.now() + (data.expires_in - 120) * 1000;
  return cachedAccessToken;
}

/**
 * 获取openid 
 * @param {*} code 
 * @returns 
 */
async function getOpenid(code) {
  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`;
  const { data } = await axios.get(url);
  return data;
}


/**
 * 获取手机号明文
 * @param {} code 
 * @returns 
 */
async function getUserPhoneNumber(code) {
  const accessToken = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
  const { data } = await axios.post(url, { code });
  console.log('getUserPhoneNumber data:', data);
  return data;
}

module.exports = {
  getAccessToken,
  getUserPhoneNumber,
  getOpenid
};