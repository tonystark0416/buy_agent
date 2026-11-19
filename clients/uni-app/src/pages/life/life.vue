<template>
  <view class="life-page">
    <!-- 活动Banner -->
    <swiper v-if="banners.length" class="banner-swiper" circular autoplay interval="4000">
      <swiper-item v-for="b in banners" :key="b.id" @tap="onBannerTap(b)">
        <image class="banner-swiper__img" :src="b.banner_img_url" mode="aspectFill" />
        <view class="banner-swiper__mask">
          <text class="banner-swiper__title">{{ b.title }}</text>
          <text v-if="b.sub_text" class="banner-swiper__sub">{{ b.sub_text }}</text>
        </view>
      </swiper-item>
    </swiper>

    <!-- 美团团购列表 -->
    <view class="goods-grid">
      <view
        v-for="item in goodsList"
        :key="item.skuViewId || item.productViewSign"
        class="card goods-card"
        @tap="goMeituanGoods(item)"
      >
        <image class="goods-card__img" :src="item.image" mode="aspectFill" />
        <view class="goods-card__body">
          <text class="goods-card__title">{{ item.title }}</text>
          <text class="goods-card__subtitle">{{ [item.poiName, item.distance].filter(Boolean).join(' · ') }}</text>
          <view class="goods-card__price-row">
            <text class="price-text goods-card__price">{{ priceText(item.price) }}</text>
            <text class="price-original">{{ priceText(item.originalPrice) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="load-more">加载中…</view>
    <view v-if="!loading && goodsList.length === 0" class="empty-state">暂无团购商品</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getBanners, searchMeituanGoods, getMeituanBuyLink, openLink } from '@/utils/api'

const banners = ref([])
const goodsList = ref([])
const loading = ref(false)
const pageNo = ref(1)
const hasNext = ref(false)
let searchId = ''

function priceText(v) {
  const n = parseFloat(v) || 0
  return n > 0 ? '¥' + n.toFixed(2) : ''
}

async function loadBanners() {
  banners.value = await getBanners()
}

async function loadGoods(reset = false) {
  if (loading.value) return
  loading.value = true
  const res = await searchMeituanGoods({
    searchText: '',
    pageNo: reset ? 1 : pageNo.value,
    searchId: reset ? '' : searchId,
  })
  goodsList.value = reset ? res.list : [...goodsList.value, ...res.list]
  hasNext.value = res.hasNext
  searchId = res.searchId
  pageNo.value = reset ? 2 : pageNo.value + 1
  loading.value = false
}

onShow(() => {
  loadBanners()
  loadGoods(true)
})

onPullDownRefresh(async () => {
  await Promise.all([loadBanners(), loadGoods(true)])
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (hasNext.value) loadGoods()
})

function onBannerTap(b) {
  if (!b.extra_id) return
  getMeituanBuyLink(b.extra_id).then((url) => {
    if (url) openLink(url)
    else uni.showToast({ title: '活动链接获取失败', icon: 'none' })
  })
}

function goMeituanGoods(item) {
  const sign = item.productViewSign
  if (!sign) return
  uni.navigateTo({ url: `/pages/meituan-goods/meituan-goods?sign=${encodeURIComponent(sign)}` })
}
</script>

<style lang="scss" scoped>
.life-page {
  padding: 20rpx 24rpx 40rpx;
}

.banner-swiper {
  height: 280rpx;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;

  &__img { width: 100%; height: 280rpx; }

  &__mask {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 20rpx 28rpx;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  }

  &__title { display: block; color: #FFFFFF; font-size: 32rpx; font-weight: 600; }
  &__sub { display: block; color: rgba(255, 255, 255, 0.8); font-size: 24rpx; margin-top: 4rpx; }
}

.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-card {
  width: 340rpx;
  margin-bottom: 20rpx;

  &__img { width: 100%; height: 340rpx; display: block; background: #F2F2F7; }
  &__body { padding: 20rpx; }
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
  &__price-row { margin-top: 12rpx; display: flex; align-items: baseline; gap: 10rpx; }
  &__price { font-size: 32rpx; }
}
</style>
