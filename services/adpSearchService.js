/**
 * @description 搜索服务，提供搜索相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const vipService = require('./platforms/vipService');
const pddService = require('./platforms/pddService');


/**
 * 格式化唯品会的商品数据为统一格式
 * @param {*} item 
 * @returns 
 */
function normalizeVipItem(item) {
    return {
        id: item.goodsId,
        title: item.goodsName,
        price: item.vipPrice,
        imageUrl: item.goodsMainPicture,
        commission: item.commissionRate || 0,
        platform: 'vip',
        // 其他需要的字段
    }
}

/**
 * 格式化拼多多的商品数据为统一格式
 * @param {*} item 
 * @returns 
 */
function normalizePddItem(item) {
    return {
        id: item.goods_sign,
        title: item.goods_name,
        price: item.min_group_price,
        imageUrl: item.goods_image_url,
        commission: item.promotion_rate || 0,
        platform: 'pdd',
        // 其他需要的字段
    }
}

/**
 * 多平台搜索接口，聚合结果，合并返回
 * @param {*} param0 
 * @returns 
 */
async function multipleSearchGoods({ activity_tags, keyword, page = 1, pageSize = 10, uid, pid, sources = ['vip', 'pdd'] }) {

    // 这里可以根据需要调用不同平台的搜索接口，目前示例调用了 VIP 的搜索接口
    const promises = [];
    if (sources.includes('vip')) {
        console.log({ keyword, page, pageSize, openid: uid, chanTag: pid })
        const vipResults = vipService.searchGoods({ keyword, page, pageSize, openid: uid, chanTag: pid });
        promises.push(vipResults);
    }
    if (sources.includes('pdd')) {
        const pddResults = pddService.searchGoods({ activity_tags, keyword, page, page_size: pageSize, pid });
        promises.push(pddResults);
    }
    const [vipRes, pddRes] = await Promise.all(promises); //顺序要一致

    const vipItems = vipRes.result?.goodsInfoList?.map(normalizeVipItem) || [];
    const pddItems = pddRes.goods_search_response?.goods_list?.map(normalizePddItem) || [];

    const merged = [...vipItems, ...pddItems]; //合并两个转换后的结果
    // console.log(merged)
    const total = merged.length;

    return {
        page,
        total,
        items: merged
    };
}


module.exports = {
    multipleSearchGoods,
}