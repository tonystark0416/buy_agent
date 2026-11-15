/**
 * 美团CPS接口服务 https://media.meituan.com/pc/index.html#/materials/api
 */

const meituanService = require('../../services/platforms/meituanService');
const { ok } = require('../../utils/response.js');

/**
 * v2: { code: 200, msg: 'ok', data: <meituanService 原始载荷> }
 * legacy: { success: true, data }
 */
//获取美团商品列表接口
exports.getWaimaiGoodsList = async (req, res, next) => {
    const {searchText, longitude,latitude,pageSize,pageNo,searchId,sortField,productViewSignList, listTopiId, platform, vpSkuViewIds} = req.query;
    try {
        const result = await meituanService.getGoodsInfo({searchText, longitude,latitude,pageSize,pageNo,searchId,sortField,productViewSignList, listTopiId, platform, vpSkuViewIds});
        ok(req, res, result, () => ({ success: true, data: result }));
    } catch (error) {
        next(error);
    }
}

//获取美团单个商品信息接口
exports.getWaimaiGoodsDetail = async (req, res, next) => {
    const  {productViewSignList} = req.query;
    try {
        const result = await meituanService.getGoodsInfo({productViewSignList});
        ok(req, res, result, () => ({ success: true, data: result }));
    } catch (error) {
        next(error);
    }
}


//通过商品id获取链接接口
exports.getReferralLinkByGoodsId = async (req, res, next) => {
    const  {productViewSign} = req.query;
    try {
        const result = await meituanService.getReferralLink({productViewSign});
        ok(req, res, result, () => ({ success: true, data: result }));
    } catch (error) {
        next(error);
    }
}

//通过活动id获取链接接口
exports.getReferralLinkByActId = async (req, res, next) => {
    const  {actId,uid} = req.query;
    const sid = uid;
    try {
        const result = await meituanService.getReferralLink({actId,sid});
        ok(req, res, result, () => ({ success: true, data: result }));
    } catch (error) {
        next(error);
    }
}


//获取订单信息
exports.getOrderInfo = async (req, res, next) => {
    try {
        const result = await meituanService.getOrderInfo();
        ok(req, res, result, () => ({ success: true, data: result }));
    } catch (error) {
        next(error);
    }
}
