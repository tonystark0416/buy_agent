/**
 * searchController.js
 * 搜索控制器，处理与搜索相关的请求
 */
const multipleSearchGoods = require('../services/adpSearchService').multipleSearchGoods;
const { ok, fail } = require('../utils/response.js');

exports.search = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return fail(res, 400, 'keyword 参数不能为空');
    }

    const results = await multipleSearchGoods(req.query);

    // legacy: { success: true, data, count }
    ok(req, res, results, () => ({ success: true, data: results, count: results.items.length }));
  } catch (err) {
    next(err);
  }
};
