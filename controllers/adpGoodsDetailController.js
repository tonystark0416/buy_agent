/**
 * goodsDetailController.js
 * 商品详情控制器，处理与商品详情相关的请求
 * @author liuweizhao
 * @date 2024-06-01
 */
const vipService = require('../services/platforms/vipService');

exports.getGoodsMarketPrice = async (req, res, next) => {

  try {
    const { goodsId, openid, chanTag } = req.query;
    if (!goodsId || !openid || !chanTag) {
      return res.status(400).json({ error: '所有参数都不能为空' });
    }

    const results = await vipService.getGoodsMarketPrice(req.query); //调用服务获取数据

    res.json({ success: true, data: results, count: results.length }); //返回数据给前端
  } catch (err) {
    next(err);
  }
};