/**
 * API 服务层（uni-app 版，从小程序 utils/api.js 移植）
 * 仅保留 App 端需要的接口；v2 统一响应 { code: 200, msg, data }
 */
import { BASE_URL } from './config'
import { getUid } from './auth'

const PLATFORM_NAMES = { vip: '唯品会', taobao: '淘宝', jd: '京东', pdd: '拼多多', douyin: '抖音' }

// ==================== 请求基础 ====================

function parseResponseData(data) {
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch (e) { return data }
  }
  return data
}

function request(url) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      timeout: 8000,
      header: { 'X-Client-Ver': '2' },
      success: (res) => (res.statusCode === 200 ? resolve(parseResponseData(res.data)) : reject(new Error(`HTTP ${res.statusCode}`))),
      fail: (err) => reject(err),
    })
  })
}

function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'POST',
      data,
      header: { 'X-Client-Ver': '2', 'Content-Type': 'application/json' },
      timeout: 8000,
      success: (res) => (res.statusCode === 200 ? resolve(parseResponseData(res.data)) : reject(new Error(`HTTP ${res.statusCode}`))),
      fail: (err) => reject(err),
    })
  })
}

function buildQuery(params) {
  return Object.keys(params || {})
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${encodeURIComponent(params[k])}`)
    .join('&')
}

// ==================== 登录（手机号 + 验证码，App 主通道） ====================

/**
 * 发送手机验证码
 * @returns {Promise<Object>} v2: { code:200, data: { devCode } }（未接 SMS 时 devCode 供联调）
 */
export function sendVerificationCode(phone) {
  return postRequest(`${BASE_URL}/api/user/sendVerificationCode`, { phone })
}

/**
 * 手机号+验证码登录（未注册自动注册）
 * @returns {Promise<Object>} v2: { code:200, data: { user, token } }
 */
export function loginByCode({ phone, code }) {
  return postRequest(`${BASE_URL}/api/user/loginByCode`, { phone, code })
}

// ==================== 首页聚合列表 /api/indexList ====================

/**
 * 首页 - 唯品好货（tab=1），offset 分页
 * @returns {Promise<{list, hasMore, nextOffset}>}
 */
export async function fetchVipIndexGoods({ uid = getUid(), offset = 0, pageSize = 10 } = {}) {
  try {
    const result = await request(`${BASE_URL}/api/indexList?${buildQuery({ tab: 1, uid, offset, pageSize })}`)
    const d = result && result.code === 200 ? result.data : result
    const r = d && d.returnCode === '0' && d.result ? d.result : null
    if (!r || !Array.isArray(r.goodsInfoList)) return { list: [], hasMore: false, nextOffset: offset }
    return {
      list: r.goodsInfoList,
      hasMore: !r.lastPage,
      nextOffset: r.nextPageOffset != null ? r.nextPageOffset : offset + pageSize,
    }
  } catch (err) {
    console.warn('[API] fetchVipIndexGoods 失败:', err.message)
    return { list: [], hasMore: false, nextOffset: offset }
  }
}

/** 唯品会商品字段映射（与小程序 formatGoodsList 一致） */
export function formatVipList(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => {
    const price = parseFloat(item.vipPrice || item.price) || 0
    const originalPrice = parseFloat(item.marketPrice || item.originalPrice) || 0
    return {
      id: item.goodsId || item.id || '',
      type: 'vip',
      title: item.goodsName || item.title || '',
      image: item.goodsMainPicture || item.goodsThumbUrl || item.whiteImage || item.image || '',
      price,
      priceText: price > 0 ? '¥' + price.toFixed(2) : '',
      originalPrice,
      originalPriceText: originalPrice > price ? '¥' + originalPrice.toFixed(2) : '',
    }
  })
}

/**
 * 首页 - 美团热销（tab=2），按定位一次返回
 */
export async function fetchMeituanIndexGoods({ longitude = '', latitude = '' } = {}) {
  try {
    const result = await request(`${BASE_URL}/api/indexList?${buildQuery({ tab: 2, longitude, latitude })}`)
    const d = result && result.code === 200 ? result.data : result
    if (!d || d.code !== 0 || !Array.isArray(d.data)) return { list: [] }
    return { list: d.data.map(mapMeituanGoods) }
  } catch (err) {
    console.warn('[API] fetchMeituanIndexGoods 失败:', err.message)
    return { list: [] }
  }
}

/**
 * 首页 - 多多好货（tab=3），顶层数组
 */
export async function fetchPddIndexGoods() {
  try {
    const result = await request(`${BASE_URL}/api/indexList?${buildQuery({ tab: 3 })}`)
    const list = result && result.code === 200 ? result.data : result
    if (!Array.isArray(list)) return { list: [] }
    return { list }
  } catch (err) {
    console.warn('[API] fetchPddIndexGoods 失败:', err.message)
    return { list: [] }
  }
}

/** 拼多多商品字段映射（与小程序 formatPddList 一致） */
export function formatPddList(list) {
  if (!Array.isArray(list)) return []
  return list.map((item) => {
    const salePrice = parseFloat(item.sale_price) || 0
    const marketPrice = parseFloat(item.market_price) || 0
    return {
      id: item.goods_platform_id || '',
      type: 'pdd',
      title: item.goods_name || '',
      image: item.goods_image_url || '',
      price: salePrice,
      priceText: salePrice > 0 ? '¥' + salePrice.toFixed(2) : '',
      originalPrice: marketPrice,
      originalPriceText: marketPrice > salePrice ? '¥' + marketPrice.toFixed(2) : '',
    }
  })
}

// ==================== 美团商品映射 ====================

function formatMeituanDistance(dist) {
  const n = parseFloat(dist)
  if (!n || isNaN(n)) return ''
  if (n >= 1000) return `${(n / 1000).toFixed(1)}km`
  return `${Math.round(n)}m`
}

function formatMeituanValidTime(info) {
  if (!info) return ''
  const pad = (n) => (n < 10 ? '0' + n : String(n))
  const fmt = (ts) => {
    const d = new Date(ts * 1000)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  if (info.couponValidTimeType === 1) {
    const day = Number(info.couponValidDay) || 0
    return day > 0 ? `购买后${day}天内有效` : ''
  }
  if (info.couponValidSTime && info.couponValidETime) {
    return `${fmt(info.couponValidSTime)} 至 ${fmt(info.couponValidETime)} 有效`
  }
  return ''
}

/** 美团搜索/列表商品字段映射 */
export function mapMeituanGoods(item) {
  const coupon = item.couponPackDetail || {}
  const brand = item.brandInfo || {}
  const commission = item.commissionInfo || {}
  const poi = item.deliverablePoiInfo || {}

  return {
    skuViewId: coupon.skuViewId || '',
    productViewSign: coupon.productViewSign || '',
    title: coupon.name || '',
    image: coupon.headUrl || '',
    price: coupon.sellPrice || '',
    originalPrice: coupon.originalPrice || '',
    sales: coupon.saleVolume || '',
    category: coupon.categoryName || '',
    brandName: brand.brandName || '',
    brandLogo: brand.brandLogoUrl || '',
    rebate: commission.commission || '',
    rebatePercent: commission.commissionPercent || '',
    poiName: poi.poiName || '',
    distance: formatMeituanDistance(poi.deliveryDistance) || poi.deliveryDistance || '',
  }
}

// ==================== 搜索 ====================

/**
 * 搜索商品
 * 真实接口 (GET): {BASE_URL}/api/search?keyword=&uid=&pid=&page=
 * @returns {Promise<{code:0, data:{list,total,hasMore}}>}
 */
export async function searchProducts({ keyword = '', page = 1, pageSize = 20 }) {
  try {
    const query = [
      `keyword=${encodeURIComponent(keyword)}`,
      `uid=${encodeURIComponent(getUid())}`,
      `pid=mike0416`,
      `page=${page}`,
    ].join('&')
    const rawData = await request(`${BASE_URL}/api/search?${query}`)
    if (!rawData || rawData.code !== 200) return { code: -1, data: { list: [], total: 0, hasMore: false } }
    const items = (rawData.data && rawData.data.items) || []
    const list = items.map((item) => {
      const price = parseFloat(item.price) || 0
      const commission = parseFloat(item.commission) || 0
      return {
        id: item.id || '',
        title: item.title || '',
        image: item.imageUrl || '',
        price,
        originalPrice: commission > 0 ? +(price + commission).toFixed(2) : price,
        rebate: commission,
        platform: item.platform || 'vip',
        sales: item.sales || 0,
        couponAmount: item.couponAmount || 0,
      }
    })
    return { code: 0, data: { list, total: list.length, hasMore: list.length > 0 } }
  } catch (err) {
    console.warn('[API] searchProducts 失败:', err.message)
    return { code: -1, data: { list: [], total: 0, hasMore: false } }
  }
}

// ==================== 商品详情（vip） ====================

/**
 * 获取商品详情 (GET): {BASE_URL}/api/goods/getDetail?goodsId=&pid=&uid=&platform=
 * @returns {Promise<{code, data} | {code:-1, message}>}
 */
export async function getProductDetail(goodsId, platform = 'vip') {
  if (!goodsId) return { code: -1, message: '缺少 goodsId' }
  try {
    const query = [
      `goodsId=${encodeURIComponent(goodsId)}`,
      `pid=123213`,
      `uid=${encodeURIComponent(getUid())}`,
      `platform=${encodeURIComponent(platform)}`,
    ].join('&')
    const rawData = await request(`${BASE_URL}/api/goods/getDetail?${query}`)
    if (!rawData || rawData.code !== 200) return { code: -1, message: '商品详情获取失败' }
    const d = rawData.data || {}
    const prices = d.prices || {}
    const commission = d.commission || {}
    const images = Array.isArray(d.images) ? d.images.filter(Boolean) : []
    const detailImages = Array.isArray(d.detailImages) ? d.detailImages.filter(Boolean) : []
    const salePrice = parseFloat(prices.salePrice) || 0
    const marketPrice = parseFloat(prices.marketPrice) || 0
    return {
      code: 0,
      data: {
        id: d.goodsId || '',
        title: d.goodsName || '',
        images,
        detailImages,
        price: salePrice,
        originalPrice: marketPrice,
        rebate: parseFloat(commission.amount) || 0,
        rebateRate: parseFloat(commission.rate) || 0,
        tags: Array.isArray(d.tags) ? d.tags : [],
        destUrl: d.url || '',
        priceDesc: prices.priceDesc || '',
        platform: d.platform || platform,
      },
    }
  } catch (err) {
    console.warn('[API] getProductDetail 失败:', err.message)
    return { code: -1, message: err.message }
  }
}

// ==================== 转链 / 跳转 ====================

/** 唯品会商品推广位 ID */
const GOODS_GEN_URL_PID = '123213'

/**
 * 获取商品推广链接（详情页「前往购买」/ pdd 卡片）
 * GET /api/tranUrl/genUrlByGoodsId?platform=&goodsId=&uid=&pid=
 * @returns {Promise<{result:true, goodsId, urls} | null>}
 */
export async function getGoodsTranUrlByGoodsId({ goodsId, platform = 'vip', uid = getUid(), pid }) {
  if (!goodsId || !uid) return null
  if (platform === 'vip' && !pid) pid = GOODS_GEN_URL_PID
  try {
    const query = [
      `platform=${encodeURIComponent(platform)}`,
      `goodsId=${encodeURIComponent(goodsId)}`,
      `uid=${encodeURIComponent(uid)}`,
      pid ? `pid=${encodeURIComponent(pid)}` : '',
    ].filter(Boolean).join('&')
    const result = await request(`${BASE_URL}/api/tranUrl/genUrlByGoodsId?${query}`)
    if (result && result.code === 200 && result.data) return { result: true, ...result.data }
    return result || null
  } catch (err) {
    console.warn('[API] getGoodsTranUrlByGoodsId 失败:', err.message)
    return null
  }
}

/**
 * 打开外部链接：App 用系统浏览器打开；H5 当前页跳转
 */
export function openLink(url) {
  if (!url) return
  // #ifdef APP-PLUS
  plus.runtime.openURL(url)
  // #endif
  // #ifdef H5
  window.location.href = url
  // #endif
  // #ifdef MP-WEIXIN
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  // #endif
}

// ==================== 美团详情 / 转链 ====================

/**
 * 获取美团商品详情 GET /api/meituan/goodsDetail?productViewSignList=
 * @returns {Promise<Object|null>}
 */
export async function getMeituanGoodsDetail(productViewSign) {
  try {
    const result = await request(`${BASE_URL}/api/meituan/goodsDetail?productViewSignList=${encodeURIComponent(productViewSign)}`)
    if (!result || result.code !== 200 || !result.data || result.data.code !== 0) return null
    const rawList = Array.isArray(result.data.data) ? result.data.data : []
    const item = rawList[0]
    if (!item) return null

    const coupon = item.couponPackDetail || {}
    const brand = item.brandInfo || {}
    const commission = item.commissionInfo || {}
    const poi = item.deliverablePoiInfo || {}
    const availablePoi = item.availablePoiInfo || {}
    const validInfo = item.couponValidTimeInfo || {}
    const pricePowerLabel = (coupon.productLabel && coupon.productLabel.pricePowerLabel) || {}

    return {
      productViewSign: coupon.productViewSign || '',
      title: coupon.name || '',
      image: coupon.headUrl || '',
      price: coupon.sellPrice || '',
      originalPrice: coupon.originalPrice || '',
      sales: coupon.saleVolume || '',
      couponNum: coupon.couponNum || 0,
      historyPriceLabel: pricePowerLabel.historyPriceLabel || '',
      brandName: brand.brandName || '',
      rebate: commission.commission || '',
      rebatePercent: commission.commissionPercent || '',
      poiName: poi.poiName || '',
      poiLogoUrl: poi.poiLogoUrl || '',
      distance: formatMeituanDistance(poi.deliveryDistance),
      availablePoiNum: Number(availablePoi.availablePoiNum) || 0,
      validTimeText: formatMeituanValidTime(validInfo),
    }
  } catch (err) {
    console.warn('[API] getMeituanGoodsDetail 失败:', err.message)
    return null
  }
}

/**
 * 获取美团商品推广链接 GET /api/meituan/referral-link-by-goods-id?productViewSign=
 * 返回 { success, data: { referralLinkMap: { key: url } } }；key=4 为小程序路径
 * App 端取 referralLinkMap 中第一个 http(s) 链接（h5/deeplink）
 * @returns {Promise<string|null>} 可打开的链接
 */
export async function getMeituanBuyLink(productViewSign) {
  try {
    const result = await request(`${BASE_URL}/api/meituan/referral-link-by-goods-id?productViewSign=${encodeURIComponent(productViewSign)}`)
    if (!result || result.code !== 200 || !result.data) return null
    const map = result.data.referralLinkMap || {}
    // 优先 h5 链接（可被系统浏览器直接打开）
    for (const key of Object.keys(map)) {
      if (key !== '4' && /^https?:\/\//.test(String(map[key]))) return map[key]
    }
    return null
  } catch (err) {
    console.warn('[API] getMeituanBuyLink 失败:', err.message)
    return null
  }
}

// ==================== 吃喝玩乐 Banner ====================

/**
 * 获取吃喝玩乐 Banner 活动列表 GET /api/banner
 * @returns {Promise<Array>} [{ id, extra_id, title, sub_text, banner_img_url, sort }]
 */
export async function getBanners() {
  try {
    const result = await request(`${BASE_URL}/api/banner`)
    const arr = result && result.code === 200 && Array.isArray(result.data) ? result.data : []
    return arr.sort((a, b) => (b.sort || 0) - (a.sort || 0))
  } catch (err) {
    console.warn('[API] getBanners 失败:', err.message)
    return []
  }
}

// ==================== 美团吃喝玩乐搜索 ====================

/**
 * 搜索美团吃喝玩乐商品 GET /api/meituan/goods?searchText=&pageSize=&pageNo=&searchId=&sortField=
 * @returns {Promise<{list, hasNext, searchId}>}
 */
export async function searchMeituanGoods({ searchText = '', pageNo = 1, pageSize = 20, searchId = '', sortField = 1 } = {}) {
  try {
    const query = [
      `searchText=${encodeURIComponent(searchText)}`,
      `pageSize=${pageSize}`,
      `pageNo=${pageNo}`,
      `searchId=${encodeURIComponent(searchId)}`,
      `sortField=${sortField}`,
    ].join('&')
    const result = await request(`${BASE_URL}/api/meituan/goods?${query}`)
    if (!result || result.code !== 200 || !result.data || result.data.code !== 0) {
      return { list: [], hasNext: false, searchId: '' }
    }
    const d = result.data
    const rawList = Array.isArray(d.data) ? d.data : []
    return { list: rawList.map(mapMeituanGoods), hasNext: !!d.hasNext, searchId: d.searchId || '' }
  } catch (err) {
    console.warn('[API] searchMeituanGoods 失败:', err.message)
    return { list: [], hasNext: false, searchId: '' }
  }
}

// ==================== 订单列表 ====================

/** 订单状态文案 */
export const ORDER_STATUS_TEXT = { 0: '不合格', 1: '待定', 2: '已结算' }

/**
 * 我的订单列表 GET /api/order/getList?uid=&page=&platform=
 * @returns {Promise<{list, page, total, totalPages}>}
 */
export async function getOrderList(uid, page = 1, platform = 'vip') {
  if (!uid) return { list: [], page: 1, total: 0, totalPages: 0 }
  try {
    const query = [
      `uid=${encodeURIComponent(uid)}`,
      `page=${page}`,
      `platform=${platform}`,
    ].join('&')
    const result = await request(`${BASE_URL}/api/order/getList?${query}`)
    const d = result && result.code === 200 ? result.data : result
    if (!d || !Array.isArray(d.list)) return { list: [], page: 1, total: 0, totalPages: 0 }
    return {
      list: d.list.map((item) => ({
        id: item.id || '',
        orderSn: item.order_sn || '',
        status: item.status,
        platform: item.platform || '',
        orderAmount: item.order_amount || '0',
        commission: item.commission || '0',
        goodsName: item.goods_name || '',
        goodsImgUrl: item.goods_img_url || '',
        createTime: item.create_time || '',
      })),
      page: parseInt(d.page, 10) || page,
      total: parseInt(d.total, 10) || 0,
      totalPages: parseInt(d.totalPages, 10) || 0,
    }
  } catch (err) {
    console.warn('[API] getOrderList 失败:', err.message)
    return { list: [], page: 1, total: 0, totalPages: 0 }
  }
}

export { PLATFORM_NAMES }
