

/**
 *  首页列表获取信息
 * 
 */

const vipService = require('./platforms/vipService');
const meituanService = require('./platforms/meituanService');

async function getAdpIndexList({ tab, offset, pageSize, uid, pid, longitude, latitude }) {
    // const {tab} = params;
    switch (tab) {
        case '1':
            console.log({ tab, offset, pageSize, uid, pid, longitude, latitude })
            const jxCode = 'dz5d5n7i';
            const resultVip = await vipService.goodsListV2({ jxCode, offset, pageSize, openid:uid, chanTag:pid });
            return resultVip;

        case '2':
            console.log({ tab, offset, pageSize, uid, pid, longitude, latitude })
            const platform = 2; // 商品所属业务一级分类类型：1 到家及其他业务类型，2 到店业务类型（包含到店美食、休闲生活、酒店、门票、度假）；不填则默认1
            const listTopiId = 2; // 到店业务类型支持查询：2 今日必推，3 同城热销（全部商品），5 实时热销
            const resultMeituan = await meituanService.getGoodsInfo({ longitude, latitude, platform, listTopiId });
            return resultMeituan;
        default:
            break;
    }
}



module.exports = {
    getAdpIndexList
}