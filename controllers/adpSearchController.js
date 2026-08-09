/**
 * searchController.js
 * 搜索控制器，处理与搜索相关的请求
 * @author liuweizhao
 * @date 2024-06-01 
 */
const multipleSearchGoods = require('../services/adpSearchService').multipleSearchGoods;

exports.search = async (req, res, next) => {
  try {
    const { keyword, page, uid, pid } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: 'keyword 参数不能为空' });
    }

    const results = await multipleSearchGoods(req.query);

    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    next(err);
  }
};