import request from './request'

/**
 * 订单列表
 * @param {object} params { page, pageSize, platform, status, orderSn, goodsName, uid, startTime, endTime }
 */
export const getOrderList = (params) => request.get('/order/list', { params })

// 订单详情（含关联用户）
export const getOrderDetail = (orderSn) => request.get('/order/detail', { params: { orderSn } })
