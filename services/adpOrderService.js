/**
 * @description 搜索服务，提供搜索相关的功能接口
 * @author liuweizhao
 * @date 2024-06-01 
 */

const orderModel = require('../models/adpOrder')


async function getOrderListByUid(params) {
    const result = await orderModel.getOrderListByUid(params)
    return result
}








module.exports = {getOrderListByUid}