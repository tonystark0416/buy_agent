import request from './request'

/**
 * 用户列表
 * @param {object} params { page, pageSize, id, phone, openid }
 */
export const getUserList = (params) => request.get('/user/list', { params })

// 用户详情（基本信息 + 各平台订单汇总）
export const getUserDetail = (id) => request.get('/user/detail', { params: { id } })
