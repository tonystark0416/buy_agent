/**
 * searchController.js
 * 搜索控制器，处理与搜索相关的请求
 * @author liuweizhao
 * @date 2024-06-01 
 */
const vipService = require('../services/platforms/vipService');

exports.search = async (req, res, next) => {
  try {
    const { keyword, page, pageSize, openid, chanTag } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: 'keyword 参数不能为空' });
    }

    const results = await vipService.searchGoods({keyword, page, pageSize, openid, chanTag});

    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    next(err);
  }
};