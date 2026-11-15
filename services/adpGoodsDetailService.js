/**
 * @fileOverview adpGoodsDetailService.js
 * @description 适配器商品详情服务
 */

const vipService = require('./platforms/vipService');
const pddService = require('./platforms/pddService');
const vipAdapter = require('./adapters/vipAdapter');
const pddAdapter = require('./adapters/pddAdapter');
const config = require('../config/config.js');

//获取商品详情
async function getGoodsDetail({ platform, goodsId, uid, pid }) {

    if (!platform || !goodsId) {
        throw new Error('platform和goodsId不能为空');
    }

    switch (platform) {
        case 'vip':
            return await getVipGoodsDetail({
                goodsId,
                openid: uid,
                chanTag: pid || config.cps.vipChanTag
            });

        case 'pdd':
            return await getPddGoodsDetail({
                goodsId,
                uid,
                pid,
            });

        default:
            throw new Error(`不支持的平台: ${platform}`);

    }

}

//获取唯品会商品接口返回的数据
async function getVipGoodsDetail({ goodsId, openid, chanTag }) {
    const response = await vipService.getGoodsMarketPrice({
        goodsId,
        openid,
        chanTag,
    });

    if (!response) {
        throw new Error('唯品会商品不存在或接口返回失败');
    }

    return vipAdapter.normalizeGoodsDetail(response, goodsId);
}


// 请求拼多多接口
async function getPddGoodsDetail({ goodsId, uid, pid }) {
    const response = await pddService.getGoodsDetail({
        goods_sign: goodsId,
        uid,
        pid,
    });

    const detail = response?.goods_detail_response?.goods_details?.[0];

    if (!detail) {
        throw new Error('拼多多商品不存在或接口返回失败');
    }

    return pddAdapter.normalizeGoodsDetail(detail, goodsId);
}

module.exports = {getGoodsDetail}
