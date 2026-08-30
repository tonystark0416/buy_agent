/**
 * 订单接口控制器
 * 
 */

const adpOrderService = require('../services/adpOrderService')

exports.getOrderListByUid = async (req,res) =>{
    const { uid, page } = req.query;
    try {
        const result = await adpOrderService.getOrderListByUid( { uid, page })
        res.json(result)
    } catch (error) {
        res.status(500).json({ result: false, message: error.message });
    }
}