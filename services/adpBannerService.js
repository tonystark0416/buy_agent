/**
 * @description banner服务，提供banner相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const bannerModel = require('../models/adpBannerModel');
// const vipService = require('./platforms/vipService.js');
// const meituanService = require('./platforms/meituanService.js');
// const tranUrlService = require('./adpTranUrlService.js');

const findBanner = async () => {
    try {
        const banner = await bannerModel.findBanner(2);
        return banner;
    } catch (error) {
        console.error('Error in findBanner:', error);
        throw error;
    }
};


const indexBannerList = async () => {
    try {
        const banner = await bannerModel.findBanner(1);
        return banner;
    } catch (error) {
        console.error('Error in indexBannerList:', error);
        throw error;
    }

}



module.exports = {
    findBanner,
    indexBannerList
};

