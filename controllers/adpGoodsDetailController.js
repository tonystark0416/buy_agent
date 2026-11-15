/**
 * goodsDetailController.js
 * 商品详情控制器，处理与商品详情相关的请求
 */
const goodsDetailService = require('../services/adpGoodsDetailService');
const { ok, fail } = require('../utils/response.js');

exports.getGoodsDetail = async (req, res, next) => {
  try {
    const { platform, goodsId, uid, pid, chanTag } = req.query;

    if (!platform || !goodsId) {
      return fail(res, 400, 'platform和goodsId不能为空');
    }

    const data = await goodsDetailService.getGoodsDetail({ platform, goodsId, uid, pid, chanTag });
    // legacy: { result: true, data }
    ok(req, res, data, () => ({ result: true, data }));
  } catch (err) {
    next(err);
  }
};
