/**
 * 后台商品管理控制器
 */
const adminGoodsService = require('../../services/admin/adminGoodsService');

function fail(res, err) {
  res.status(err.status || 500).json({ code: err.status || 500, msg: err.message || '服务器错误', data: null });
}

// GET /api/admin/goods/list
async function getGoodsList(req, res) {
  try {
    const data = await adminGoodsService.getGoodsList(req.query);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    fail(res, err);
  }
}

// POST /api/admin/goods/create
async function createGoods(req, res) {
  try {
    const data = await adminGoodsService.createGoods(req.body);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    fail(res, err);
  }
}

// PUT /api/admin/goods/update
async function updateGoods(req, res) {
  try {
    const data = await adminGoodsService.updateGoods(req.query.id || req.body.id, req.body);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    fail(res, err);
  }
}

// DELETE /api/admin/goods/delete?id=
async function deleteGoods(req, res) {
  try {
    const data = await adminGoodsService.deleteGoods(req.query.id);
    res.json({ code: 0, msg: 'ok', data });
  } catch (err) {
    fail(res, err);
  }
}

module.exports = { getGoodsList, createGoods, updateGoods, deleteGoods };
