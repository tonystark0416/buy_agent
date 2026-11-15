/**
 * giftCouponController.js
 * 礼品券控制器，处理与礼品券相关的请求
 */

const vipService = require('../services/platforms/vipService');
const { ok, fail } = require('../utils/response.js');

exports.giftCoupon = async (req, res, next) => {
  try {
    const { goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct } = req.query;
    if (!goodsId) {
      return fail(res, 400, 'goodsId 参数不能为空');
    }

    const results = await vipService.createGiftCoupon(goodsId, giftName, amount, totalCount, activityStartTime, activityEndTime, useTimeType, singleClaimPerLink, allSkusUnderProduct);

    // legacy: { success: true, data, count }
    ok(req, res, results, () => ({ success: true, data: results, count: results.length }));
  } catch (err) {
    next(err);
  }
};
