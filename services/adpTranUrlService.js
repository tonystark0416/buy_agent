/**
 * 第三方平台链接转换服务
 * 
*/

//引入service
const pdd = require('./platforms/pddService.js');
const vip = require('./platforms/vipService.js');

async function tranUrl({ uid, pid, platform, source_url }) {

    //定义返回格式
    let resultUrl = {
        h5_url: '',
        weapp_url: '',
        deeplink_url: ''
    }

    if (platform === 'pdd') {
        const result = await pdd.urlGen({ uid: uid, pid: pid, source_url: source_url });
        if (result.goods_zs_unit_generate_response) {
            resultUrl.h5_url = result.goods_zs_unit_generate_response.short_url;
            resultUrl.weapp_url = result.goods_zs_unit_generate_response.weixin_long_link;
            return resultUrl
        }
    }
}



module.exports = {
    tranUrl
}