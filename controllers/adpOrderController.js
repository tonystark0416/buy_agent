/**
 * 订单接口控制器
 */

const adpOrderService = require('../services/adpOrderService')
const { ok } = require('../utils/response.js')

/**
 * 用户订单列表
 * v2: { code: 200, msg: 'ok', data: { list, page, pageSize, total, totalPages } }
 * legacy: 服务原始结构顶层数据
 */
exports.getOrderListByUid = async (req,res) => {
    const { uid, platform, page } = req.query;
    try {
        const result = await adpOrderService.getOrderListByUid( { uid, platform, page })
        ok(req, res, result, () => result)
    } catch (error) {
        res.status(500).json({ code: 500, msg: error.message, data: null });
    }
}
