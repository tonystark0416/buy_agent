/**
 * 第三方平台链接转换服务
 * 
*/

//引入service
const pddService = require('./platforms/pddService.js');
const vipService = require('./platforms/vipService.js');


//综合转链服务，入参用户id、推广位id，原始url，获取转换后的链接
async function tranUrl({ uid, pid, source_url, targetType, targetValueList }) {
    console.log('调用转链服务，参数：', { uid, pid, source_url, targetType, targetValueList });
    //判断参数，全部必传
    if (!uid || !pid) {
        throw new Error('uid、pid不能为空');
    }

    //定义返回格式
    let resultData = {
        code: '',
        urls: {
            h5_url: '', //H5链接
            weapp_url: '', //小程序链接
            weapp_short_link: '', //小程序短链
            deeplink_url: '' //app唤起
        }
    }

    //拼多多链接转换
    // async function pddTranUrl({ uid: uid, pid: pid, source_url: source_url }) {
    //     console.log(123)
    //     const result = await pdd.urlGen({ uid: uid, pid: pid, source_url: source_url });
    //     if (result.goods_zs_unit_generate_response) {
    //         resultData.code = 200;
    //         resultData.urls.h5_url = result.goods_zs_unit_generate_response.short_url;
    //         resultData.urls.weapp_url = result.goods_zs_unit_generate_response.weixin_long_link;
    //         return resultData
    //     }
    // }


    //唯品会链接转换,返回的urlInfoList是个数组，里面有多个url对象，取第一个即可
    async function vipTranUrl({ uid, pid, source_url, targetType, targetValueList }) {
        const result = await vipService.genByVIPUrl({
            urlList: [source_url],
            openId: uid,
            chanTag: pid,
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
        return await pddTranUrl({ uid: uid, pid: pid, source_url: source_url })
    }

    if (source_url.toLowerCase().includes('vip.com')) {
        return await vipTranUrl({ uid, pid, source_url, targetType, targetValueList })
    }
    return { code: -2, message: '不支持的第三方平台链接' };

}


//===================================通过商品id获取推广链接===========================================
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

    //格式化唯品会数据
    function normalizeVipGenUrlByGoods(item, goodsId) {
        return {
            goodsId: goodsId,
            urls: {
                h5_url: item.url || '', //h5链接
                weapp_url: item.vipWxUrl || '', //小程序链接路径
                weapp_source_id:'gh_8ed2afad9972',
                weapp_app_id:'wxe9714e742209d35f',
                deeplink_url: item.deeplinkUrl || '', //app唤起链接
                command: item.onlyCommand || '' //唯品会专属口令
            }
        }
    }


    //格式化拼多多数据
    function normalizePddGenUrlByGoods(item, goodsId) {
        return {
            goodsId: goodsId,
            urls: {
                h5_url: item.goods_promotion_url_generate_response.goods_promotion_url_list[0].short_url, //h5链接
                weapp_url: item.goods_promotion_url_generate_response.goods_promotion_url_list[0].we_app_info.page_path, //小程序链接路径
                weapp_source_id: item.goods_promotion_url_generate_response.goods_promotion_url_list[0].we_app_info.user_name, //小程序source_id
                weapp_app_id: item.goods_promotion_url_generate_response.goods_promotion_url_list[0].we_app_info.app_id, //小程序source_id
                deeplink_url: item.goods_promotion_url_generate_response.goods_promotion_url_list[0].schema_url, //app唤起链接
                command: item.onlyCommand || '' //唯品会专属口令
            }
        }
    }


    //参数判断
    if (!platform || !goodsId || !uid ) {
        throw new Error('platform和goodsId不能为空');
    }


    switch (platform) {
        case 'vip':
            const urlVipResult = await vipService.genByGoodsId({ goodsId, openId: uid, chanTag: pid || 'default_chanTag' });
            return normalizeVipGenUrlByGoods(urlVipResult, goodsId);

        case 'pdd':
            const urlPddResult = await pddService.getPddGenUrlByGoods({ goodsId, uid, pid: '43384525_317172887' }); //写死pid
            return normalizePddGenUrlByGoods(urlPddResult, goodsId);
        default:
            throw new Error(`不支持的平台: ${platform}`);
    }

}







module.exports = {
    tranUrl, tranUrlByGoodsId
}