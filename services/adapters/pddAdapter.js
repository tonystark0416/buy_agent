/**
 * 拼多多（pdd）平台数据适配层
 * 集中收敛 pdd 平台各接口响应的字段映射，供 search / goodsDetail / tranUrl 等服务复用
 */

const vipAdapter = require('./vipAdapter');
const toNumber = vipAdapter.toNumber;

/**
 * 搜索结果项 → 统一商品结构（/api/search 用）
 */
function normalizeSearchItem(item) {
    return {
        id: item.goods_sign,
        title: item.goods_name,
        price: item.min_group_price,
        imageUrl: item.goods_image_url,
        commission: item.promotion_rate || 0,
        platform: 'pdd',
    };
}

/**
 * 商品详情接口响应 → 前端约定结构（/api/goods/getDetail 用）
 */
function normalizeGoodsDetail(item, goodsId) {
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

/**
 * 按商品 ID 生成推广链接的响应 → 前端约定结构（/api/tranUrl/genUrlByGoodsId 用）
 */
function normalizeGenUrl(item, goodsId) {
    const urlInfo = item.goods_promotion_url_generate_response.goods_promotion_url_list[0];
    return {
        goodsId,
        urls: {
            h5_url: urlInfo.short_url,                       // h5链接
            weapp_url: urlInfo.we_app_info.page_path,        // 小程序链接路径
            weapp_source_id: urlInfo.we_app_info.user_name,  // 小程序 source_id
            weapp_app_id: urlInfo.we_app_info.app_id,        // 小程序 appId
            deeplink_url: urlInfo.schema_url,                // app唤起链接
            command: '',                                     // pdd 无口令，字段与 vip 对齐
        },
    };
}

module.exports = {
    normalizeSearchItem,
    normalizeGoodsDetail,
    normalizeGenUrl,
};
