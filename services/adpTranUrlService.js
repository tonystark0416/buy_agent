/**
 * 第三方平台链接转换服务
 *
*/

//引入service
const pddService = require('./platforms/pddService.js');
const vipService = require('./platforms/vipService.js');
const adpThirdAuthService = require('./adpThirdAuthService.js');
const config = require('../config/config.js');
const vipAdapter = require('./adapters/vipAdapter.js');
const pddAdapter = require('./adapters/pddAdapter.js');


//综合转链服务，入参用户id、推广位id，原始url，获取转换后的链接
async function tranUrl({ uid, pid, source_url, targetType, targetValueList }) {
    //判断参数，全部必传
    if (!uid || !source_url) {
        throw new Error('uid、source_url不能为空');
    }

    //定义返回格式
    let resultData = {
        urls: {
            h5_url: '', //H5链接
            weapp_url: '', //小程序链接
            weapp_short_link: '', //小程序短链
            deeplink_url: '' //app唤起
        }
    }

    //拼多多链接转换（pid 走 config 统一下发，不再散落硬编码）
    async function pddTranUrl({ uid, pid, source_url }) {

        const result = await pddService.urlGen({ uid, pid: pid || config.cps.pddPid, source_url });

        if (result.error_response) {    //判断错误
            return result;
        }

        if (result.goods_zs_unit_generate_response) {
            resultData.urls.h5_url = result.goods_zs_unit_generate_response.short_url;
            resultData.urls.weapp_url = result.goods_zs_unit_generate_response.weixin_long_link;
            return resultData
        }
    }


    //唯品会链接转换,返回的urlInfoList是个数组，里面有多个url对象，取第一个即可
    async function vipTranUrl({ uid, pid, source_url, targetType, targetValueList }) {
        const result = await vipService.genByVIPUrl({
            urlList: [source_url],
            openId: uid,
            chanTag: pid || config.cps.vipChanTag,
            statParam: 'defaultStatParam',
            targetType: targetType,
            targetValueList: targetValueList
        })

        if (result.returnCode === '0' && result?.result?.urlInfoList?.length > 0) {
            resultData.code = 200;
            resultData.urls.h5_url = result?.result?.urlInfoList[0].url
            resultData.urls.weapp_url = result?.result?.urlInfoList[0].vipWxUrl
            resultData.urls.deeplink_url = result?.result?.urlInfoList[0].deeplinkUrl
            return resultData
        } else {
            resultData.code = -1;
            return resultData
        }
    }


    //判断平台,分别调用各自的转链
    if (source_url.toLowerCase().includes('pinduoduo')) {
        const isAuth = await adpThirdAuthService.checkAuth({ uid, pid, platform: 'pdd' })
        if (isAuth.isAuth === false) {
            return { needAuthPlatform: 'pdd', message: '用户未授权' }
        }
        return await pddTranUrl({ uid, pid, source_url })
    }

    if (source_url.toLowerCase().includes('vip.com')) {
        const isAuth = await adpThirdAuthService.checkAuth({ uid, pid, platform: 'vip' })
        if (isAuth.isAuth === false) {
            return { needAuthPlatform: 'vip', message: '用户未授权' }
        }
        return await vipTranUrl({ uid, pid, source_url, targetType, targetValueList })
    }

    //上述都不命中
    return { message: 'noSuportPlatform' };

}


//===================================通过商品id获取推广链===========================================
/**
 * param {Object} param0
 * @param {string} param0.platform 平台名称
 * @param {string} param0.goodsId 商品id
 * @param {string} param0.uid 用户id
 * @param {string} param0.pid 推广位id
 *
 * @returns {Object} 返回格式
 */
async function tranUrlByGoodsId({ platform, goodsId, uid, pid }) {

    //参数判断
    if (!platform || !goodsId || !uid) {
        throw new Error('platform和goodsId不能为空');
    }


    switch (platform) {
        case 'vip':
            const urlVipResult = await vipService.genByGoodsId({ goodsId, openId: uid, chanTag: pid || config.cps.vipChanTag });
            return vipAdapter.normalizeGenUrl(urlVipResult, goodsId);

        case 'pdd':
            const urlPddResult = await pddService.getPddGenUrlByGoods({ goodsId, uid, pid: config.cps.pddPid });
            return pddAdapter.normalizeGenUrl(urlPddResult, goodsId);
        default:
            throw new Error(`不支持的平台: ${platform}`);
    }

}

module.exports = {
    tranUrl, tranUrlByGoodsId
}
