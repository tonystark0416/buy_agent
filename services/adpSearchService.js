/**
 * @description 搜索服务，提供搜索相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const vipService = require('./platforms/vipService');
const pddService = require('./platforms/pddService');
const vipAdapter = require('./adapters/vipAdapter');
const pddAdapter = require('./adapters/pddAdapter');


/**
 * 多平台搜索接口，聚合结果，合并返回
 * @param {*} param0 
 * @returns 
 */
async function multipleSearchGoods({ activity_tags, keyword, page = 1, pageSize = 10, uid, pid, sources = ['vip', 'pdd'] }) {

    // 这里可以根据需要调用不同平台的搜索接口，目前示例调用了 VIP 的搜索接口
    const promises = [];
    if (sources.includes('vip')) {
        const vipResults = vipService.searchGoods({ keyword, page, pageSize, openid: uid, chanTag: pid });
        promises.push(vipResults);
    }
    if (sources.includes('pdd')) {
        const pddResults = pddService.searchGoods({ activity_tags, keyword, page, page_size: pageSize, pid });
        promises.push(pddResults);
    }
    const [vipRes, pddRes] = await Promise.all(promises); //顺序要一致

    const vipItems = vipRes.result?.goodsInfoList?.map(vipAdapter.normalizeSearchItem) || [];
    const pddItems = pddRes.goods_search_response?.goods_list?.map(pddAdapter.normalizeSearchItem) || [];

    const merged = [...vipItems, ...pddItems]; //合并两个转换后的结果
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