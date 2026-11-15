const adpIndexListService = require('../services/adpIndexListService');
const { ok, fail } = require('../utils/response.js');

/**
 * 首页聚合列表
 * v2:   { code: 200, msg: 'ok', data: <平台原始载荷> }
 * legacy 保持各 tab 原结构不变（tab=1 透传 vip returnCode 结构、tab=2 透传 {code:0,...}、tab=3 顶层数组）
 */
exports.getList = async (req, res) => {
  const tab = req.query.tab;
  if (!['1', '2', '3'].includes(tab)) {
    return fail(res, 400, 'Invalid tab parameter');
  }

  try {
    const result = await adpIndexListService.getAdpIndexList({ tab, ...req.query });
    // legacy: 直接透传 service 原始返回
    ok(req, res, result, () => result);
  } catch (error) {
    console.error(`Error fetching index list tab=${tab}:`, error.message);
    fail(res, 500, 'Internal Server Error');
  }
};
