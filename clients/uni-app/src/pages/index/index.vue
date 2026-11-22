<template>
  <view class="page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar" @tap="goSearch">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <text class="search-placeholder">搜索全网好物</text>
      </view>
    </view>

    <!-- 粘贴购物链接 -->
    <view class="link-section">
      <view class="link-input-wrap">
        <textarea
          class="link-textarea"
          placeholder="支持粘贴唯品会/拼多多 商品链接查找优惠"
          :maxlength="-1"
          v-model="linkInput"
        />
        <view class="link-paste-btn" @tap="onPasteLink">粘贴</view>
      </view>
      <view class="link-find-btn" :class="{ 'btn-disabled': linkConverting }" @tap="onFindCoupon">
        {{ linkConverting ? '正在转换...' : '查找专属优惠' }}
      </view>
    </view>

    <!-- 链接转换结果卡片 -->
    <view class="link-result-card" v-if="showLinkResult && linkResult">
      <view class="result-header">
        <text class="result-label-title">转换结果</text>
        <view class="result-close" @tap="clearLinkResult">✕</view>
      </view>
      <view class="result-body">
        <view class="result-section">
          <text class="result-label">原始链接</text>
          <text class="result-url-text">{{ linkResult.originalUrl }}</text>
        </view>
        <view class="result-divider" v-if="linkResult.h5_url"></view>
        <view class="result-section" v-if="linkResult.h5_url">
          <text class="result-label">H5 推广链接</text>
          <text class="result-url-text result-url-highlight">{{ linkResult.h5_url }}</text>
        </view>
      </view>
      <view class="result-btn-primary" @tap="onBuyConverted" v-if="linkResult.h5_url">前往购买</view>
      <view class="result-btn-secondary" @tap="onCopyConverted">一键复制推广链接</view>
    </view>

    <!-- 今日最优惠活动（不足两条整区隐藏） -->
    <view class="activity-section" v-if="activityBanners.length >= 2">
      <view class="activity-grid">
        <view
          class="activity-card"
          v-for="item in activityBanners"
          :key="item.id"
          @tap="onActivityTap(item)"
        >
          <view class="activity-image">
            <image v-if="item.image" class="activity-image-img" :src="item.image" mode="aspectFit" />
            <view v-else class="activity-image-placeholder"><text>商品图占位</text></view>
          </view>
          <view class="activity-head-text">
            <text class="activity-title">{{ item.title }}</text>
            <text class="activity-subtitle">{{ item.subtitle }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 精选商品：三 tab -->
    <view class="goods-section">
      <view class="goods-tabs">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="goods-tab"
          :class="{ 'goods-tab-active': activeTab === t.key }"
          @tap="switchTab(t.key)"
        >{{ t.label }}</view>
      </view>

      <!-- 唯品好货 -->
      <template v-if="activeTab === 'vip'">
        <view class="goods-status" v-if="vipLoading && vipList.length === 0"><text>正在加载商品...</text></view>
        <view class="goods-status" v-else-if="vipList.length === 0"><text>暂无商品数据</text></view>
        <view class="waterfall-grid" v-else>
          <view v-for="item in vipList" :key="item.id" class="goods-card" @tap="goGoods(item)">
            <image class="goods-image" :src="item.image" mode="widthFix" lazy-load />
            <view class="goods-info">
              <text class="goods-title">{{ item.title }}</text>
              <view class="goods-price-row">
                <text class="goods-price-flag">券后</text>
                <text class="goods-price">{{ item.priceText }}</text>
                <text class="goods-original-price" v-if="item.originalPriceText">{{ item.originalPriceText }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="goods-loading" v-if="vipLoading && vipList.length > 0"><text>加载中...</text></view>
        <view class="goods-end" v-if="!vipHasMore && vipList.length > 0"><text>— 已经到底了 —</text></view>
      </template>

      <!-- 美团热销 -->
      <template v-if="activeTab === 'meituan'">
        <view class="goods-status" v-if="mtLoading && mtList.length === 0"><text>正在加载附近热销...</text></view>
        <view class="goods-status" v-else-if="mtLoaded && mtList.length === 0"><text>附近暂无热销好券，去吃喝玩乐看看吧</text></view>
        <view class="waterfall-grid" v-else>
          <view v-for="item in mtList" :key="item.skuViewId || item.productViewSign" class="goods-card" @tap="goMeituanGoods(item)">
            <image class="goods-image" :src="item.image" mode="widthFix" lazy-load />
            <view class="goods-info">
              <text class="goods-title">{{ item.title }}</text>
              <text class="goods-subtitle" v-if="item.subtitle">{{ item.subtitle }}</text>
              <view class="goods-price-row">
                <text class="goods-price-flag">券后</text>
                <text class="goods-price">{{ item.priceText }}</text>
                <text class="goods-original-price" v-if="item.originalPriceText">{{ item.originalPriceText }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="goods-loading" v-if="mtLoading && mtList.length > 0"><text>加载中...</text></view>
        <view class="goods-end" v-if="mtLoaded && mtList.length > 0"><text>— 已为你推荐附近热销 —</text></view>
      </template>

      <!-- 多多好货 -->
      <template v-if="activeTab === 'pdd'">
        <view class="goods-status" v-if="pddLoading && pddList.length === 0"><text>正在加载商品...</text></view>
        <view class="goods-status" v-else-if="pddList.length === 0"><text>暂无商品数据</text></view>
        <view class="waterfall-grid" v-else>
          <view v-for="item in pddList" :key="item.id" class="goods-card" @tap="buyPdd(item)">
            <image class="goods-image" :src="item.image" mode="widthFix" lazy-load />
            <view class="goods-info">
              <text class="goods-title">{{ item.title }}</text>
              <view class="goods-price-row">
                <text class="goods-price-flag">券后</text>
                <text class="goods-price">{{ item.priceText }}</text>
                <text class="goods-original-price" v-if="item.originalPriceText">{{ item.originalPriceText }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="goods-loading" v-if="pddLoading && pddList.length > 0"><text>加载中...</text></view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import {
  fetchVipIndexGoods, fetchMeituanIndexGoods, fetchPddIndexGoods,
  formatVipList, formatPddList,
  getIndexActivityBanners, convertLink,
  getGoodsTranUrlByGoodsId, getMeituanBuyLink, openLink,
} from '@/utils/api'
import { ensureLogin, getUid } from '@/utils/auth'

const tabs = [
  { key: 'vip', label: '唯品好货' },
  { key: 'meituan', label: '美团热销' },
  { key: 'pdd', label: '多多好货' },
]
const activeTab = ref('vip')

// 搜索
function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

// ==================== 粘贴链接转链 ====================
const linkInput = ref('')
const linkConverting = ref(false)
const showLinkResult = ref(false)
const linkResult = ref(null)

function onPasteLink() {
  uni.getClipboardData({
    success: (res) => {
      if (res.data) linkInput.value = res.data
      uni.showToast({ title: '已粘贴', icon: 'none' })
    },
  })
}

async function onFindCoupon() {
  if (!ensureLogin()) return
  if (!linkInput.value.trim()) {
    uni.showToast({ title: '请先粘贴购物链接', icon: 'none' })
    return
  }
  linkConverting.value = true
  showLinkResult.value = false
  linkResult.value = null
  try {
    const res = await convertLink(linkInput.value, getUid())
    if (res && res.needAuthPlatform) {
      linkConverting.value = false
      // App 端暂无小程序授权流程：提示去对应平台处理
      uni.showToast({ title: '需要先在对应平台完成授权', icon: 'none', duration: 2500 })
      return
    }
    if (!res || res.code !== 0) {
      uni.showToast({ title: (res && res.message) || '链接转换失败，请检查链接是否有效', icon: 'none', duration: 2000 })
      linkConverting.value = false
      return
    }
    const d = res.data
    linkResult.value = {
      originalUrl: d.originalUrl || linkInput.value.trim(),
      platform: d.platform || '',
      h5_url: d.h5_url || '',
    }
    showLinkResult.value = true
  } finally {
    linkConverting.value = false
  }
}

function clearLinkResult() {
  showLinkResult.value = false
  linkResult.value = null
}

function onBuyConverted() {
  if (linkResult.value && linkResult.value.h5_url) openLink(linkResult.value.h5_url)
}

function onCopyConverted() {
  if (!linkResult.value || !linkResult.value.h5_url) {
    uni.showToast({ title: '暂无链接可复制', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: linkResult.value.h5_url,
    success: () => uni.showToast({ title: '已复制', icon: 'none' }),
  })
}

// ==================== 今日最优惠活动 ====================
const activityBanners = ref([])

async function loadActivities() {
  activityBanners.value = await getIndexActivityBanners()
}

async function onActivityTap(item) {
  if (item.extraId) {
    // 美团坑位：转链后打开
    if (!ensureLogin()) return
    uni.showLoading({ title: '加载中...', mask: true })
    const url = await getMeituanBuyLink(item.extraId)
    uni.hideLoading()
    if (url) openLink(url)
    else uni.showToast({ title: '活动链接获取失败', icon: 'none' })
  } else if (item.extraUrl) {
    // 唯品会坑位（App 端无小程序授权流程，直接打开活动链接）
    openLink(item.extraUrl)
  } else {
    uni.showToast({ title: '该活动暂不支持跳转', icon: 'none' })
  }
}

// ==================== 三个平台商品列表 ====================
const vipList = ref([])
const vipOffset = ref(0)
const vipHasMore = ref(false)
const vipLoading = ref(false)

const mtList = ref([])
const mtLoading = ref(false)
const mtLoaded = ref(false)

const pddList = ref([])
const pddLoading = ref(false)

async function loadVip(reset = false) {
  if (vipLoading.value) return
  vipLoading.value = true
  const res = await fetchVipIndexGoods({ offset: reset ? 0 : vipOffset.value, pageSize: 10 })
  const list = formatVipList(res.list)
  vipList.value = reset ? list : [...vipList.value, ...list]
  vipOffset.value = res.nextOffset
  vipHasMore.value = res.hasMore && list.length > 0
  vipLoading.value = false
}

async function loadMeituan() {
  if (mtLoading.value) return
  mtLoading.value = true
  const res = await fetchMeituanIndexGoods({})
  mtList.value = res.list
  mtLoaded.value = true
  mtLoading.value = false
}

async function loadPdd() {
  if (pddLoading.value) return
  pddLoading.value = true
  const res = await fetchPddIndexGoods()
  pddList.value = formatPddList(res.list)
  pddLoading.value = false
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  if (key === 'vip' && vipList.value.length === 0) loadVip(true)
  if (key === 'meituan' && mtList.value.length === 0) loadMeituan()
  if (key === 'pdd' && pddList.value.length === 0) loadPdd()
}

onShow(() => {
  if (vipList.value.length === 0) loadVip(true)
  loadActivities()
})

onReachBottom(() => {
  if (activeTab.value === 'vip' && vipHasMore.value) loadVip()
})

function goGoods(item) {
  uni.navigateTo({ url: `/pages/goods/goods?goodsId=${item.id}&platform=vip` })
}

function goMeituanGoods(item) {
  if (!item.productViewSign) return
  uni.navigateTo({ url: `/pages/meituan-goods/meituan-goods?sign=${encodeURIComponent(item.productViewSign)}` })
}

async function buyPdd(item) {
  const res = await getGoodsTranUrlByGoodsId({ goodsId: item.id, platform: 'pdd' })
  if (res && res.result && res.urls && res.urls.h5_url) {
    openLink(res.urls.h5_url)
  } else {
    uni.showToast({ title: '获取购买链接失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 40rpx;
}

/* ===== 顶部搜索栏 ===== */
.search-bar {
  padding: 16rpx 32rpx;
}

.search-box {
  display: flex;
  align-items: center;
  height: 72rpx;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 20rpx;
  padding: 0 24rpx;
}

.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-placeholder { color: rgba(60, 60, 67, 0.36); font-size: 28rpx; }

/* ===== 粘贴链接转链区 ===== */
.link-section {
  margin: 8rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx 28rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.link-input-wrap { position: relative; }

.link-textarea {
  width: 100%;
  height: 140rpx;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 16rpx;
  padding: 20rpx 140rpx 20rpx 24rpx;
  box-sizing: border-box;
  font-size: 26rpx;
  color: #1C1C1E;
  line-height: 1.5;
}

.link-paste-btn {
  position: absolute;
  right: 16rpx;
  bottom: 20rpx;
  padding: 10rpx 28rpx;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 26rpx;
  font-weight: 500;
  border-radius: 26rpx;
}

.link-find-btn {
  margin-top: 24rpx;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #007AFF;
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;

  &.btn-disabled { opacity: 0.5; }
}

/* ===== 转换结果卡片 ===== */
.link-result-card {
  margin: 20rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.result-label-title { font-size: 30rpx; font-weight: 600; color: #1C1C1E; }
.result-close { color: rgba(60, 60, 67, 0.36); font-size: 30rpx; padding: 4rpx 8rpx; }

.result-section { margin-top: 12rpx; }
.result-label { display: block; font-size: 22rpx; color: rgba(60, 60, 67, 0.6); margin-bottom: 8rpx; }
.result-url-text {
  font-size: 24rpx;
  color: rgba(60, 60, 67, 0.6);
  word-break: break-all;
  line-height: 1.5;
}
.result-url-highlight { color: #007AFF; font-weight: 500; }
.result-divider { height: 1rpx; background: rgba(60, 60, 67, 0.12); margin: 20rpx 0; }

.result-btn-primary {
  margin-top: 28rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  background: #007AFF;
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 42rpx;
}

.result-btn-secondary {
  margin-top: 16rpx;
  height: 84rpx;
  line-height: 84rpx;
  text-align: center;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 42rpx;
}

/* ===== 今日最优惠活动 ===== */
.activity-section { margin: 32rpx 32rpx 0; }

.activity-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.activity-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.activity-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background: rgba(118, 118, 128, 0.12);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-image-img { width: 160rpx; height: 160rpx; }
.activity-image-placeholder { color: rgba(60, 60, 67, 0.36); font-size: 22rpx; }
.activity-head-text { flex: 1; margin-left: 24rpx; overflow: hidden; }
.activity-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.activity-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: rgba(60, 60, 67, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 精选商品 ===== */
.goods-section { margin: 32rpx 32rpx 0; }

/* iOS 分段控件 */
.goods-tabs {
  display: flex;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 20rpx;
  padding: 4rpx;
}

.goods-tab {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  text-align: center;
  font-size: 27rpx;
  color: #1C1C1E;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}

.goods-tab-active {
  background: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

/* 瀑布流 */
.waterfall-grid {
  margin-top: 24rpx;
  column-count: 2;
  column-gap: 20rpx;
}

.goods-card {
  break-inside: avoid;
  margin-bottom: 20rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: inline-block;
  width: 100%;
}

.goods-image {
  width: 100%;
  display: block;
  background: rgba(118, 118, 128, 0.12);
}

.goods-info { padding: 16rpx 20rpx 20rpx; }

.goods-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 26rpx;
  color: #1C1C1E;
  line-height: 1.45;
}

.goods-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: rgba(60, 60, 67, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.goods-price-row {
  display: flex;
  align-items: baseline;
  margin-top: 12rpx;
  gap: 8rpx;
}

.goods-price-flag {
  font-size: 20rpx;
  color: #FF3B30;
  background: rgba(255, 59, 48, 0.08);
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;
}

.goods-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #FF3B30;
}

.goods-original-price {
  font-size: 22rpx;
  color: rgba(60, 60, 67, 0.36);
  text-decoration: line-through;
}

.goods-status, .goods-loading, .goods-end {
  text-align: center;
  padding: 40rpx 0;
  color: rgba(60, 60, 67, 0.36);
  font-size: 26rpx;
}
</style>
