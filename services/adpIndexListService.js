

/**
 *  首页列表获取信息
 * 
 */

const vipService = require('./platforms/vipService');
const meituanService = require('./platforms/meituanService');

async function getAdpIndexList({tab, jxCode, offset, pageSize, openid, chanTag,longitude, latitude, platform,listTopiId }) {
    // const {tab} = params;
    switch (tab) {
        case '1':
            const resultVip = await vipService.goodsListV2({ jxCode, offset, pageSize, openid, chanTag });
            return resultVip;
  
        case '2':
            const resultMeituan = await meituanService.getGoodsInfo({longitude, latitude, platform,listTopiId});
            return resultMeituan;
        default:
            break;
    }
}



module.exports = {
    getAdpIndexList
}