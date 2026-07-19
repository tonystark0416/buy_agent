
const vipService = require('../services/platforms/vipService');

exports.getVipGoodsList = async (req, res) => {
  try {
    const vipGoodsList = await vipService.goodsListV2(req.query); // 调用服务层方法获取VIP商品列表
    res.status(200).json(vipGoodsList);
  } catch (error) {
    console.error('Error fetching VIP goods list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};