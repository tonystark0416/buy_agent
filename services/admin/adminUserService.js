/**
 * 后台用户查询服务
 */
const adminUserModel = require('../../models/admin/adminUserModel');

const MAX_PAGE_SIZE = 100;

async function getUserList(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let pageSize = parseInt(query.pageSize, 10) || 20;
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const params = {
    page,
    pageSize,
    id: query.id ? parseInt(query.id, 10) || null : null,
    phone: query.phone ? String(query.phone).trim() : null,
    openid: query.openid ? String(query.openid).trim() : null
  };
  const { list, total } = await adminUserModel.findUsersForAdmin(params);
  return {
    list,
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.ceil(total / params.pageSize)
  };
}

/**
 * 用户详情：基本信息 + 按平台订单汇总（不含密码）
 */
async function getUserDetail(id) {
  if (!id) {
    const err = new Error('id 不能为空');
    err.status = 400;
    throw err;
  }
  const userId = parseInt(id, 10);
  if (!userId) {
    const err = new Error('id 不合法');
    err.status = 400;
    throw err;
  }
  const user = await adminUserModel.findUserById(userId);
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }
  const statsByPlatform = await adminUserModel.userOrderStats(userId);
  const summary = statsByPlatform.reduce(
    (acc, item) => ({
      orderCount: acc.orderCount + Number(item.order_count),
      totalAmount: Number(acc.totalAmount) + Number(item.total_amount),
      totalCommission: Number(acc.totalCommission) + Number(item.total_commission)
    }),
    { orderCount: 0, totalAmount: 0, totalCommission: 0 }
  );
  return { user, statsByPlatform, summary };
}

module.exports = { getUserList, getUserDetail };
