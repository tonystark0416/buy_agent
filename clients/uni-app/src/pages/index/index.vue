<template>
  <view class="index-page">
    <!-- 搜索入口 -->
    <view class="search-entry" @tap="goSearch">
      <text class="search-entry__icon">🔍</text>
      <text class="search-entry__text">搜索商品领返利</text>
    </view>

    <!-- 平台分段控件 -->
    <view class="ios-segment">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="ios-segment__item"
        :class="{ 'ios-segment__item--active': activeTab === t.key }"
        @tap="switchTab(t.key)"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- 唯品好货（双列卡片，offset 分页） -->
    <template v-if="activeTab === 'vip'">
      <view class="goods-grid">
        <view
          v-for="item in vipList"
          :key="item.id"
          class="card goods-card"
          @tap="goGoods(item)"
        >
          <image class="goods-card__img" :src="item.image" mode="aspectFill" />
          <view class="goods-card__body">
            <text class="goods-card__title">{{ item.title }}</text>
            <view class="goods-card__price-row">
              <text class="price-text goods-card__price">{{ item.priceText }}</text>
              <text class="price-original">{{ item.originalPriceText }}</text>
            </view>
          </view>
        </view>
      </view>
      <view v-if="vipList.length" class="load-more">
        {{ vipHasMore ? '上拉加载更多' : '— 没有更多了 —' }}
      </view>
    </template>

    <!-- 美团热销（双列卡片） -->
    <template v-if="activeTab === 'meituan'">
      <view class="goods-grid">
        <view
          v-for="item in meituanList"
          :key="item.skuViewId || item.productViewSign"
          class="card goods-card"
          @tap="goMeituanGoods(item)"
        >
          <image class="goods-card__img" :src="item.image" mode="aspectFill" />
          <view class="goods-card__body">
            <text class="goods-card__title">{{ item.title }}</text>
            <text class="goods-card__subtitle">{{ [item.poiName, item.brandName].filter(Boolean).join(' · ') }}</text>
            <view class="goods-card__price-row">
              <text class="price-text goods-card__price">{{ priceText(item.price) }}</text>
              <text class="price-original">{{ priceText(item.originalPrice) }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 多多好货（双列卡片，点击直接转链） -->
    <template v-if="activeTab === 'pdd'">
      <view class="goods-grid">
        <view
          v-for="item in pddList"
          :key="item.id"
          class="card goods-card"
          @tap="buyPdd(item)"
        >
          <image class="goods-card__img" :src="item.image" mode="aspectFill" />
          <view class="goods-card__body">
            <text class="goods-card__title">{{ item.title }}</text>
            <view class="goods-card__price-row">
              <text class="price-text goods-card__price">{{ item.priceText }}</text>
              <text class="price-original">{{ item.originalPriceText }}</text>
            </view>
            <view class="rebate-tag">直达购买</view>
          </view>
        </view>
      </view>
    </template>

    <view v-if="loading" class="load-more">加载中…</view>
    <view
      v-if="!loading && activeList.length === 0"
      class="empty-state"
    >
      暂无商品
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onReachBottom } from '@dcloudio/uni-app'
import {
  fetchVipIndexGoods, fetchMeituanIndexGoods, fetchPddIndexGoods,
  formatVipList, formatPddList, getGoodsTranUrlByGoodsId, openLink,
} from '@/utils/api'
import { ensureLogin } from '@/utils/auth'

const tabs = [
  { key: 'vip', label: '唯品好货' },
  { key: 'meituan', label: '美团热销' },
  { key: 'pdd', label: '多多好货' },
]
const activeTab = ref('vip')
const loading = ref(false)

const vipList = ref([])
const vipOffset = ref(0)
const vipHasMore = ref(false)

const meituanList = ref([])
const pddList = ref([])

const activeList = computed(() => {
  if (activeTab.value === 'vip') return vipList.value
  if (activeTab.value === 'meituan') return meituanList.value
  return pddList.value
})

function priceText(v) {
  const n = parseFloat(v) || 0
  return n > 0 ? '¥' + n.toFixed(2) : ''
}

async function loadVip(reset = false) {
  if (loading.value) return
  loading.value = true
  const offset = reset ? 0 : vipOffset.value
  const res = await fetchVipIndexGoods({ offset, pageSize: 10 })
  const list = formatVipList(res.list)
  vipList.value = reset ? list : [...vipList.value, ...list]
  vipOffset.value = res.nextOffset
  vipHasMore.value = res.hasMore && list.length > 0
  loading.value = false
}

async function loadMeituan() {
  if (loading.value) return
  loading.value = true
  const res = await fetchMeituanIndexGoods({})
  meituanList.value = res.list
  loading.value = false
}

async function loadPdd() {
  if (loading.value) return
  loading.value = true
  const res = await fetchPddIndexGoods()
  pddList.value = formatPddList(res.list)
  loading.value = false
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  if (key === 'vip' && vipList.value.length === 0) loadVip(true)
  if (key === 'meituan' && meituanList.value.length === 0) loadMeituan()
  if (key === 'pdd' && pddList.value.length === 0) loadPdd()
}

onMounted(() => loadVip(true))

onShow(() => {
  ensureLogin()
})

function goSearch() {
  uni.navigateTo({ url: '/pages/search/search' })
}

function goGoods(item) {
  uni.navigateTo({ url: `/pages/goods/goods?goodsId=${item.id}&platform=vip` })
}

function goMeituanGoods(item) {
  const sign = item.productViewSign
  if (!sign) return
  uni.navigateTo({ url: `/pages/meituan-goods/meituan-goods?sign=${encodeURIComponent(sign)}` })
}

async function buyPdd(item) {
  const res = await getGoodsTranUrlByGoodsId({ goodsId: item.id, platform: 'pdd' })
  if (res && res.result && res.urls && res.urls.h5_url) {
    openLink(res.urls.h5_url)
  } else {
    uni.showToast({ title: '获取购买链接失败', icon: 'none' })
  }
}

/** 上拉加载（页面滚动到底部） */
onReachBottom(() => {
  if (activeTab.value === 'vip' && vipHasMore.value) loadVip()
})
</script>

<style lang="scss" scoped>
.index-page {
  padding: 20rpx 24rpx 40rpx;
}

.search-entry {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 20rpx 28rpx;
  margin-bottom: 8rpx;

  &__icon { font-size: 28rpx; margin-right: 12rpx; }
  &__text { color: rgba(60, 60, 67, 0.36); font-size: 28rpx; }
}

.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-card {
  width: 340rpx;
  margin-bottom: 20rpx;

  &__img {
    width: 100%;
    height: 340rpx;
    display: block;
    background: #F2F2F7;
  }

  &__body {
    padding: 20rpx;
  }

  &__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    font-size: 26rpx;
    line-height: 36rpx;
    color: #1C1C1E;
  }

  &__subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: rgba(60, 60, 67, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__price-row {
    margin-top: 12rpx;
    display: flex;
    align-items: baseline;
    gap: 10rpx;
  }

  &__price { font-size: 32rpx; }
}
</style>
