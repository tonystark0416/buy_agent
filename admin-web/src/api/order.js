import request from './request'

/**
 * 订单列表
 * @param {object} params { page, pageSize, platform, status, orderSn, goodsName, uid, startTime, endTime }
 */
export const getOrderList = (params) => request.get('/order/list', { params })

// 手动同步订单（platform: 'vip'|'meituan'，startDate/endDate: YYYY-MM-DD，最长 30 天）
// 返回任务对象，前端轮询 getSyncStatus(taskId) 获取进度
export const startOrderSync = (data) => request.post('/order/sync', data)

// 同步任务状态：传 taskId 查单个任务进度；不传返回最近任务列表 + maxRangeDays
export const getSyncStatus = (taskId) => request.get('/order/sync/status', { params: taskId ? { taskId } : {} })

// 订单详情（含关联用户）
export const getOrderDetail = (orderSn) => request.get('/order/detail', { params: { orderSn } })
