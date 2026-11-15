/**
 * @description banner服务，提供banner相关的功能接口
 */

const bannerModel = require('../models/adpBannerModel');

/**
 * 按类型查询 banner 列表
 * @param {number} type 1=首页「最优惠活动」坑位，2=吃喝玩乐页 banner
 */
const findBannerByType = async (type) => {
    const banner = await bannerModel.findBanner(type);
    return banner;
};

module.exports = {
    findBannerByType
};
