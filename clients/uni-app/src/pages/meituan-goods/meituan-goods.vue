<template>
  <view class="mt-page" v-if="goods">
    <!-- 商品大图（全宽置顶） -->
    <image
      class="mt-hero-img"
      :src="goods.image"
      mode="aspectFill"
      @tap="previewImage"
    />

    <!-- 价格卡 -->
    <view class="mt-price-card">
      <view class="mt-price-row">
        <text class="mt-price-symbol">¥</text>
        <text class="mt-price-value">{{ goods.price }}</text>
        <text v-if="goods.originalPrice && goods.originalPrice !== goods.price" class="mt-price-original">¥{{ goods.originalPrice }}</text>
        <text v-if="goods.historyPriceLabel" class="mt-price-label">{{ goods.historyPriceLabel }}</text>
      </view>
      <view class="mt-rebate-row" v-if="goods.rebate">
        <text class="mt-rebate-label">预估返利</text>
        <text class="mt-rebate-value">¥{{ goods.rebate }}</text>
        <text v-if="goods.rebatePercent" class="mt-rebate-percent">{{ goods.rebatePercent }}</text>
      </view>
    </view>

    <!-- 商品信息卡 -->
    <view class="mt-info-card">
      <text class="mt-goods-title">{{ goods.title }}</text>
      <text v-if="goods.sales" class="mt-goods-sales">已售{{ goods.sales }}</text>
    </view>

    <!-- 门店卡 -->
    <view class="mt-store-card" v-if="goods.poiName">
      <image v-if="goods.poiLogoUrl" class="mt-store-logo" :src="goods.poiLogoUrl" mode="aspectFill" />
      <view v-else class="mt-store-logo mt-store-logo--placeholder">
        <text>店</text>
      </view>
      <view class="mt-store-text">
        <text class="mt-store-name">{{ goods.poiName }}</text>
        <view class="mt-store-meta">
          <text v-if="goods.distance" class="mt-store-meta-item">距您{{ goods.distance }}</text>
          <text v-if="goods.availablePoiNum > 0" class="mt-store-meta-item">{{ goods.availablePoiNum }}家门店可用</text>
        </view>
      </view>
    </view>

    <!-- 购买须知卡 -->
    <view class="mt-meta-card">
      <view class="mt-meta-title">购买须知</view>
      <view v-if="goods.validTimeText" class="mt-meta-item">
        <text class="mt-meta-label">有效期</text>
        <text class="mt-meta-value">{{ goods.validTimeText }}</text>
      </view>
      <view v-if="goods.brandName" class="mt-meta-item">
        <text class="mt-meta-label">品牌</text>
        <text class="mt-meta-value">{{ goods.brandName }}</text>
      </view>
      <view class="mt-meta-item">
        <text class="mt-meta-label">使用方式</text>
        <text class="mt-meta-value">购买后券发放至美团账号，可在美团App/小程序核销使用</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="mt-bottom-bar">
      <view class="mt-buy-btn" :class="{ 'mt-buy-btn--disabled': buying }" @tap="onBuy">
        {{ buying ? '获取链接中…' : '前往购买' }}
      </view>
    </view>
  </view>

  <!-- 加载/失败态 -->
  <view class="mt-fallback" v-else>
    <text>{{ loadFailed ? '商品信息获取失败' : '加载中...' }}</text>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMeituanGoodsDetail, getMeituanBuyLink, openLink } from '@/utils/api'
import { ensureLogin } from '@/utils/auth'

const goods = ref(null)
const loadFailed = ref(false)
const buying = ref(false)
let sign = ''

onLoad(async (query) => {
  sign = decodeURIComponent(query.sign || '')
  goods.value = await getMeituanGoodsDetail(sign)
  if (!goods.value) {
    loadFailed.value = true
    uni.showToast({ title: '商品加载失败', icon: 'none' })
  }
})

function previewImage() {
  if (goods.value && goods.value.image) {
    uni.previewImage({ urls: [goods.value.image] })
  }
}

async function onBuy() {
  if (buying.value) return
  if (!ensureLogin()) return
  buying.value = true
  try {
    const url = await getMeituanBuyLink(sign)
    if (url) openLink(url)
    else uni.showToast({ title: '获取购买链接失败，请稍后再试', icon: 'none' })
  } finally {
    buying.value = false
  }
}
</script>

<style lang="scss" scoped>
.mt-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 160rpx;
}

/* ===== 全宽大图 ===== */
.mt-hero-img {
  width: 100%;
  height: 750rpx;
  display: block;
  background: rgba(118, 118, 128, 0.12);
}

/* ===== 价格卡 ===== */
.mt-price-card {
  margin: 24rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.mt-price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  flex-wrap: wrap;
}

.mt-price-symbol {
  font-size: 30rpx;
  font-weight: 700;
  color: #FF3B30;
}

.mt-price-value {
  font-size: 52rpx;
  font-weight: 700;
  color: #FF3B30;
  letter-spacing: -1rpx;
}

.mt-price-original {
  font-size: 26rpx;
  color: rgba(60, 60, 67, 0.36);
  text-decoration: line-through;
}

.mt-price-label {
  font-size: 22rpx;
  color: #FF9500;
  background: rgba(255, 149, 0, 0.12);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

.mt-rebate-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(60, 60, 67, 0.1);
}

.mt-rebate-label {
  font-size: 24rpx;
  color: rgba(60, 60, 67, 0.6);
}

.mt-rebate-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #34C759;
}

.mt-rebate-percent {
  font-size: 22rpx;
  color: #34C759;
  background: rgba(52, 199, 89, 0.12);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}

/* ===== 商品信息卡 ===== */
.mt-info-card {
  margin: 20rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.mt-goods-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1C1C1E;
  line-height: 1.5;
}

.mt-goods-sales {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(60, 60, 67, 0.6);
}

/* ===== 门店卡 ===== */
.mt-store-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: 20rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.mt-store-logo {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
  background: rgba(118, 118, 128, 0.12);

  &--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(60, 60, 67, 0.36);
    font-size: 30rpx;
    font-weight: 600;
  }
}

.mt-store-text {
  flex: 1;
  overflow: hidden;
}

.mt-store-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mt-store-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 8rpx;
}

.mt-store-meta-item {
  font-size: 22rpx;
  color: rgba(60, 60, 67, 0.6);
}

/* ===== 购买须知卡 ===== */
.mt-meta-card {
  margin: 20rpx 32rpx 40rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 8rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.mt-meta-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
  padding: 24rpx 0 8rpx;
}

.mt-meta-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18rpx 0;

  & + & {
    border-top: 1rpx solid rgba(60, 60, 67, 0.08);
  }
}

.mt-meta-label {
  font-size: 26rpx;
  color: rgba(60, 60, 67, 0.6);
  flex-shrink: 0;
  margin-right: 24rpx;
}

.mt-meta-value {
  font-size: 26rpx;
  color: #1C1C1E;
  text-align: right;
  line-height: 1.5;
  flex: 1;
}

/* ===== 底部操作栏 ===== */
.mt-bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.mt-buy-btn {
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  background: #FF3B30;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 46rpx;

  &--disabled { opacity: 0.5; }
}

/* ===== 加载/失败 ===== */
.mt-fallback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(60, 60, 67, 0.36);
  font-size: 28rpx;
  background: #F2F2F7;
}
</style>
