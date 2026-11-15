/**
 * 唯品会（vip）平台数据适配层
 * 集中收敛 vip 平台各接口响应的字段映射，供 search / goodsDetail / tranUrl 等服务复用
 */

const config = require('../../config/config.js');

/**
 * 搜索结果项 → 统一商品结构（/api/search 用）
 */
function normalizeSearchItem(item) {
    return {
        id: item.goodsId,
        title: item.goodsName,
        price: item.vipPrice,
        imageUrl: item.goodsMainPicture,
        commission: item.commissionRate || 0,
        platform: 'vip',
    };
}

/**
 * 商品详情接口响应 → 前端约定结构（/api/goods/getDetail 用）
 */
function normalizeGoodsDetail(item, goodsId) {
    return {
        platform: 'vip',
        goodsId: item.goodsId || goodsId,
        url: item.destUrlPc,
        goodsName: item.goodsName || '',
        images: item.goodsCarouselPictures || [],
        detailImages: item.goodsDetailPictures || [],
        prices: {
            marketPrice: toNumber(item.goodsPromotionInfo.marketPrice),
            salePrice: toNumber(item.goodsPromotionInfo.salePrice),
            priceDesc: item.goodsPromotionInfo.salePriceDetail || '', // 价格详情
        },
        commission: {
            rate: toNumber(item.commissionRate),
            amount: toNumber(item.commission),
        },
        tags: item.tagNames || [],
        brandName: item.brandName || '',
    };
}

/**
 * 按商品 ID 生成推广链接的响应 → 前端约定结构（/api/tranUrl/genUrlByGoodsId 用）
 */
function normalizeGenUrl(item, goodsId) {
    return {
        goodsId,
        urls: {
            h5_url: item.url || '',                    // h5链接
            weapp_url: item.vipWxUrl || '',            // 小程序链接路径
            weapp_source_id: config.cps.vipMiniSourceId,
            weapp_app_id: config.cps.vipMiniAppId,
            deeplink_url: item.deeplinkUrl || '',      // app唤起链接
            command: item.onlyCommand || '',           // 唯品会专属口令
        },
    };
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

module.exports = {
    normalizeSearchItem,
    normalizeGoodsDetail,
    normalizeGenUrl,
    toNumber,
};
