import request from './request'

/**
 * 商品列表
 * @param {object} params { page, pageSize, platform, goodsName }
 */
export const getGoodsList = (params) => request.get('/goods/list', { params })

// 新增商品
export const createGoods = (data) => request.post('/goods/create', data)

// 编辑商品
export const updateGoods = (id, data) => request.put('/goods/update', { id, ...data })

// 删除商品
export const deleteGoods = (id) => request.delete('/goods/delete', { params: { id } })
