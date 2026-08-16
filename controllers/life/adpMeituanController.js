/**
 * 美团CPS接口服务 https://media.meituan.com/pc/index.html#/materials/api
 * @author liuweizhao
 * @date 2024-06-01 
 */

const meituanService = require('../../services/platforms/meituanService');

exports.getWaimaiGoods = async (req, res, next) => {
    const  {text} = req.query;
    try {
        const result = await meituanService.getGoodsInfo(text);
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}

exports.getReferralLink = async (req, res, next) => {
    const  {actId} = req.query;
    try {
        const result = await meituanService.getReferralLink(actId);
        res.json({ success: true, data: result }); //返回数据给前端
    } catch (error) {
        next(error);
    }
}