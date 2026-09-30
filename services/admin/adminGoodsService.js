/**
 * 后台商品管理服务：参数校验（adp_goods）
 * 注意：该表被 C 端首页 Tab=3 直接消费（platform='pdd' 全量），增删改实时生效
 */
const adminGoodsModel = require('../../models/admin/adminGoodsModel');

const MAX_PAGE_SIZE = 100;
const PLATFORM_WHITELIST = ['pdd', 'vip', 'meituan'];

function badRequest(msg) {
  const err = new Error(msg);
  err.status = 400;
  return err;
}

/**
 * 校验单个字段，返回归一化后的值；非法时抛错
 */
function validateField(field, value, { required }) {
  switch (field) {
    case 'goods_name': {
      if (value === undefined || value === null || String(value).trim() === '') {
        if (required) throw badRequest('商品名称不能为空');
        return undefined;
      }
      const v = String(value).trim();
      if (v.length > 200) throw badRequest('商品名称不能超过 200 字');
      return v;
    }
    case 'goods_image_url': {
      if (value === undefined || value === null || String(value).trim() === '') return undefined;
      const v = String(value).trim();
      if (v.length > 200) throw badRequest('图片 URL 不能超过 200 字符');
      if (!/^https?:\/\//i.test(v)) throw badRequest('图片 URL 必须以 http(s):// 开头');
      return v;
    }
    case 'market_price':
    case 'sale_price': {
      if (value === undefined || value === null || value === '') return undefined;
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) throw badRequest('价格必须为非负数字');
      return n;
    }
    case 'platform': {
      if (value === undefined || value === null || String(value).trim() === '') {
        if (required) throw badRequest('平台不能为空');
        return undefined;
      }
      const v = String(value).trim();
      if (!PLATFORM_WHITELIST.includes(v)) {
        throw badRequest(`平台不合法，仅支持：${PLATFORM_WHITELIST.join(' / ')}`);
      }
      return v;
    }
    case 'goods_platform_id': {
      if (value === undefined || value === null || String(value).trim() === '') {
        if (required) throw badRequest('平台商品 ID 不能为空（C 端详情/转链依赖此字段）');
        return undefined;
      }
      const v = String(value).trim();
      if (v.length > 50) throw badRequest('平台商品 ID 不能超过 50 字符');
      return v;
    }
    default:
      return undefined;
  }
}

/**
 * 校验并归一化新增/编辑入参（编辑为部分更新，只校验传入的字段）
 */
function normalizePayload(body, { isCreate }) {
  const data = {};
  const fields = ['goods_name', 'goods_image_url', 'market_price', 'sale_price', 'platform', 'goods_platform_id'];
  for (const f of fields) {
    const v = validateField(f, body[f], { required: isCreate && (f === 'goods_name' || f === 'platform' || f === 'goods_platform_id') });
    if (v !== undefined) data[f] = v;
  }
  return data;
}

async function getGoodsList(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let pageSize = parseInt(query.pageSize, 10) || 20;
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const platform = query.platform && PLATFORM_WHITELIST.includes(String(query.platform)) ? String(query.platform) : null;
  const goodsName = query.goodsName ? String(query.goodsName).trim() : null;

  const { list, total } = await adminGoodsModel.findGoodsForAdmin({ page, pageSize, platform, goodsName });
  return { list, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

async function createGoods(body) {
  const data = normalizePayload(body || {}, { isCreate: true });
  return adminGoodsModel.createGoods(data);
}

async function updateGoods(id, body) {
  const goodsId = parseInt(id, 10);
  if (!goodsId) throw badRequest('id 不合法');
  const data = normalizePayload(body || {}, { isCreate: false });
  if (!Object.keys(data).length) throw badRequest('没有需要更新的字段');
  const exists = await adminGoodsModel.findGoodsById(goodsId);
  if (!exists) {
    const err = new Error('商品不存在');
    err.status = 404;
    throw err;
  }
  await adminGoodsModel.updateGoods(goodsId, data);
  return adminGoodsModel.findGoodsById(goodsId);
}

async function deleteGoods(id) {
  const goodsId = parseInt(id, 10);
  if (!goodsId) throw badRequest('id 不合法');
  const ok = await adminGoodsModel.deleteGoods(goodsId);
  if (!ok) {
    const err = new Error('商品不存在或已删除');
    err.status = 404;
    throw err;
  }
  return { id: goodsId };
}

module.exports = { getGoodsList, createGoods, updateGoods, deleteGoods };
