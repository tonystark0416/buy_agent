/**
 * @description banner服务，提供banner相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const bannerModel = require('../models/adpBannerModel');

const findBanner = async () => {
    try {
        const banner = await bannerModel.findBanner();
        return banner;
    } catch (error) {
        console.error('Error in findBanner:', error);
        throw error;
    }
};

module.exports = {
    findBanner,
};