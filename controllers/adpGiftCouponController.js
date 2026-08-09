
/**
 * giftCouponController.js
 * 礼品券控制器，处理与礼品券相关的请求
 * @author liuweizhao
 * @date 2024-06-01 
 */

const vipService = require('../services/platforms/vipService');

exports.giftCoupon = async (req, res, next) => {
  try {
    const { goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct } = req.query;
    if (!goodsId) {
      return res.status(400).json({ error: 'goodsId 参数不能为空' });
    }

    const results = await vipService.createGiftCoupon(goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct); //调用服务获取数据

    res.json({ success: true, data: results,count: results.length }); //返回数据给前端
  } catch (err) {
    next(err);
  }
};