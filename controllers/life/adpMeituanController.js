/**
 * 美团CPS接口服务 https://media.meituan.com/pc/index.html#/materials/api
 * @author liuweizhao
 * @date 2024-06-01 
 */

const meituanService = require('../../services/platforms/meituanService');

//获取美团外卖商品信息接口
exports.getWaimaiGoods = async (req, res, next) => {
    const  {searchText, longitude,latitude,pageSize,pageNo,searchId,sortField} = req.query;
    try {
        const result = await meituanService.getGoodsInfo({searchText, longitude,latitude,pageSize,pageNo,searchId,sortField});
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}

//通过商品id获取链接接口
exports.getReferralLinkByGoodsId = async (req, res, next) => {
    const  {productViewSign} = req.query;
    console.log( {productViewSign});
    try {
        const result = await meituanService.getReferralLink({productViewSign});
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}

//通过活动id获取链接接口
exports.getReferralLinkByActId = async (req, res, next) => {
    const  {actId} = req.query;
    try {
        const result = await meituanService.getReferralLink({actId});
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}

exports.getOrderInfo = async (req, res, next) => {
    // const  {actId} = req.query;
    try {
        const result = await meituanService.getOrderInfo();
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}