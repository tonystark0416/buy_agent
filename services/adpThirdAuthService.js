/**
 * 管理第三方平台授权服务
 * 包括生成授权链接和检查授权状态
 * 
*/

//引入service
const pdd = require('./platforms/pddService.js');
const vip = require('./platforms/vipService.js');


/**
 * 生成第三方平台授权链接
 * @param {*} uid 
 * @param {*} pid 
 * @param {*} platform 
 * @returns 
 */
async function genAuthUrl({ uid, pid, platform }) {

  //定义返回格式
  let resultUrl = {
    h5_url: '',
    weapp_url: '',
    deeplink_url: ''
  }

  //拼多多
  if (platform === 'pdd') {
    const result = await pdd.genAuthUrl({ uid: uid, pid: pid });

    if (result.rp_promotion_url_generate_response) {
      // return result.rp_promotion_url_generate_response;
      resultUrl.h5_url = result.rp_promotion_url_generate_response.url_list[0].short_url;
      resultUrl.weapp_url = result.rp_promotion_url_generate_response.url_list[0].we_app_info.page_path;
      // resultUrl.weapp_url = result.rp_promotion_url_generate_response.url_list[0].we_app_info;
      return resultUrl
    }
    if (result.error_response) {
      throw new Error(result.error_response.error_msg);
    }

  }

  //唯品会
  if (platform === 'vip') {
    const result = await vip.getAuthUrl({ uid: uid });
    resultUrl.h5_url = result.shortUrl
    resultUrl.weapp_url = result.vipWxUrl;
    resultUrl.deeplink_url = result.deeplinkUrl;
    // console.log('唯品会授权链接：', result);
    return resultUrl
  } else {
    throw new Error('不支持的平台');
  }


}


/**
 * 检查第三方平台授权状态
 * @param {*} param
 * @returns 
 */
async function checkAuth({ uid, pid, platform }) {

  //定义返回格式
  let resultCheck = {
    isAuth: ''
  }

  //拼多多
  if (platform === 'pdd') {
    const result = await pdd.checkAuth({ uid: uid, pid: pid });
    if (result.authority_query_response.bind) {
      resultCheck.isAuth = true;
    } else {
      resultCheck.isAuth = false;
    }
    return resultCheck;
  }


  //唯品会
  if (platform === 'vip') {
    const result = await vip.checkUser({ uid: uid });
    if (result.result.result === 1) {
      resultCheck.isAuth = true;
    } else {
      resultCheck.isAuth = false;
    }
    return resultCheck;
  }
}

module.exports = {
  genAuthUrl,
  checkAuth
}