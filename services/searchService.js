/**
 * @description 搜索服务，提供搜索相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const vipService = require('../services/platforms/vipService');
const pddService = require('../services/platforms/pddService');

/**
 * 搜索接口，聚合各平台的搜索结果
 * @param {*} keyword 
 * @param {*} page 
 * @param {*} pageSize 
 * @param {*} uid 
 * @param {*} pid 
 * @returns 
 */
async function searchGoods({platform, keyword, page, pageSize, uid, pid}) {

    // 这里可以根据需要调用不同平台的搜索接口，目前示例调用了 VIP 的搜索接口
    if (platform === 'vip') {
        const vipResults = await vipService.searchGoods({keyword, page, pageSize, openid: uid, chanTag: pid});
        return vipResults;
    } else if (platform === 'pdd') {
        const pddResults = await pddService.searchGoods({activity_tags: '[4]', page, page_size: pageSize});
        return pddResults;
    }

    // 这里可以对结果进行合并、排序等处理，目前示例直接返回 VIP 的结果
}

const req = {
    platform: 'vip',
    keyword: '手机',
    page: 1,
    pageSize: 10,
    uid: 'user123',
    pid: 'pid123'
}
searchGoods(req).then(res => {
    console.log('搜索结果：', res);
}).catch(err => {
    console.error('搜索错误：', err);
})