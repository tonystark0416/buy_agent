/**
 *  @description banner控制器，提供banner相关的功能接口
 */

const bannerService = require('../services/adpBannerService');
const { ok } = require('../utils/response.js');

/**
 * 吃喝玩乐页 banner 列表
 * v2: { code: 200, msg: 'ok', data: [...] }；legacy: 顶层数组
 */
exports.getBanner = async (req, res) => {
  try {
    const banner = await bannerService.findBannerByType(2);
    ok(req, res, banner, () => banner);
  } catch (error) {
    console.error('Error in getBanner:', error.message);
    res.status(500).json({ code: 500, msg: 'Internal Server Error', data: null });
  }
};

/**
 * 首页「最优惠活动」坑位列表
 * v2: { code: 200, msg: 'ok', data: [...] }；legacy: 顶层数组
 */
exports.getIndexBannerList = async (req, res) => {
  try {
    const banner = await bannerService.findBannerByType(1);
    ok(req, res, banner, () => banner);
  } catch (error) {
    console.error('Error in getIndexBannerList:', error.message);
    res.status(500).json({ code: 500, msg: 'Internal Server Error', data: null });
  }
};
