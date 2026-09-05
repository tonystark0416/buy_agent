/**
 * @fileOverview adpGoodsDetailService.js
 * @description 适配器商品详情服务
 * @author liuweizhao
 * @version 1.0.0
 * @date 2024-06-20
 */


const vipService = require('../services/platforms/vipService');
const pddService = require('../services/platforms/pddService');

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
                chanTag: pid || 'default_chanTag'
            });

        case 'pdd':
            return getPddGoodsDetail({
                goods_sign: goodsId,
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

    return normalizeVipGoodsDetail(response, goodsId);
}


//根据实际接口响应格式化唯品会字段,与前端约定的返回结果
function normalizeVipGoodsDetail(item, goodsId) {
    return {
        platform: 'vip',
        goodsId: item.goodsId || goodsId,
        url:item.destUrlPc,
        goodsName: item.goodsName || '',
        images: item.goodsCarouselPictures || [],
        detailImages: item.goodsDetailPictures || [],
        prices: {
            marketPrice: toNumber(item.goodsPromotionInfo.marketPrice),
            salePrice: toNumber(item.goodsPromotionInfo.salePrice),
            priceDesc:item.goodsPromotionInfo.salePriceDetail || '', //价格详情
            // couponPrice: toNumber(item.couponPrice),
        },
        commission: {
            rate: toNumber(item.commissionRate),
            amount: toNumber(item.commission),
        },
        tags: item.tagNames || [],
        brandName: item.brandName || '',
    };
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

    return normalizePddGoodsDetail(detail, goodsId);
}

//格式化拼多多接口返回的字段
function normalizePddGoodsDetail(item, goodsId) {
  return {
    platform: 'pdd',
    goodsId: item.goods_sign || goodsId,
    goodsName: item.goods_name || '',
    images: item.goods_gallery_urls || [],
    prices: {
      marketPrice: toNumber(item.min_normal_price),
      salePrice: toNumber(item.min_group_price),
      couponPrice: toNumber(item.min_group_price_after_coupon),
    },
    commission: {
      rate: toNumber(item.promotion_rate),
      amount: toNumber(item.promotion_amount),
    },
    tags: item.goods_labels || [],
    description: item.goods_desc || '',
    promotionUrl: item.goods_zs_unit_generate_url || null,
  };
}

//统一价格数字转换
function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}






module.exports = {getGoodsDetail}