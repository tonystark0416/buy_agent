/**
 *  @description banner服务，提供banner相关的功能接口
 *  
 * 
 */

const bannerService = require('../services/adpBannerService');

exports.getBanner = async (req, res) => {
    try {
        const banner = await bannerService.findBanner();
        res.json(banner);
    } catch (error) {
        console.error('Error in getBanner:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};  