/**
 * goodsDetailController.js
 * 商品详情控制器，处理与商品详情相关的请求
 * @author liuweizhao
 * @date 2024-06-01
 */
// const vipService = require('../services/platforms/vipService');
const goodsDetailService = require('../services/adpGoodsDetailService');

exports.getGoodsDetail = async (req, res, next) => {

  try {
    const { platform, goodsId, uid,pid, chanTag } = req.query;

    if (!platform || !goodsId) {
      return res.status(400).json({result:false,message: 'platform和goodsId不能为空'});
    }
    
    const data = await goodsDetailService.getGoodsDetail({ platform, goodsId, uid, pid, chanTag });
    res.json({result:true,data});

  } catch (err) {
    next(err);
  }
};