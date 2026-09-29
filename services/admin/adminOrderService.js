/**
 * 后台订单查询服务：参数校验/归一化 + 出参格式化
 */
const adminOrderModel = require('../../models/admin/adminOrderModel');
const adminUserModel = require('../../models/admin/adminUserModel');

const MAX_PAGE_SIZE = 100;

/**
 * 校验并归一化订单列表查询参数
 */
function normalizeListParams(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let pageSize = parseInt(query.pageSize, 10) || 20;
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  // platform 支持单个或逗号分隔多个：vip,pdd,meituan
  let platforms = [];
  if (query.platform) {
    platforms = String(query.platform).split(',').map((s) => s.trim()).filter(Boolean);
  }

  // 时间区间：endTime 为开区间（不含当天结束时的场景由前端传次日 00:00 处理）
  const params = {
    page,
    pageSize,
    platforms,
    orderSn: query.orderSn ? String(query.orderSn).trim() : null,
    status: query.status !== undefined && query.status !== '' ? String(query.status) : null,
    uid: query.uid ? parseInt(query.uid, 10) || null : null,
    goodsName: query.goodsName ? String(query.goodsName).trim() : null,
    startTime: query.startTime ? String(query.startTime) : null,
    endTime: query.endTime ? String(query.endTime) : null,
    sortField: query.sortField ? String(query.sortField) : 'create_time',
    sortOrder: query.sortOrder ? String(query.sortOrder).toLowerCase() : 'desc'
  };
  return params;
}

async function getOrderList(query) {
  const params = normalizeListParams(query);
  const { list, total } = await adminOrderModel.findOrdersForAdmin(params);
  return {
    list,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize)
  };
}

/**
 * 订单详情（附带关联用户信息）
 */
async function getOrderDetail(orderSn) {
  if (!orderSn) {
    const err = new Error('orderSn 不能为空');
    err.status = 400;
    throw err;
  }
  const order = await adminOrderModel.findByOrderSn(String(orderSn).trim());
  if (!order) {
    const err = new Error('订单不存在');
    err.status = 404;
    throw err;
  }
  let user = null;
  if (order.uid) {
    user = await adminUserModel.findUserById(order.uid);
  }
  return { order, user };
}

module.exports = { getOrderList, getOrderDetail };
