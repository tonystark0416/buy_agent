<template>
  <view class="mt-page" v-if="goods">
    <view class="card mt-hero">
      <image class="mt-hero__img" :src="goods.image" mode="aspectFill" @tap="previewImage" />
      <view class="mt-hero__body">
        <text class="mt-hero__title">{{ goods.title }}</text>
        <view class="mt-hero__price-row">
          <text class="price-text mt-hero__price">¥{{ goods.price }}</text>
          <text v-if="goods.originalPrice > goods.price" class="price-original">¥{{ goods.originalPrice }}</text>
        </view>
        <text v-if="goods.historyPriceLabel" class="mt-hero__label">{{ goods.historyPriceLabel }}</text>
      </view>
    </view>

    <view class="card mt-card">
      <text class="section-title">团购信息</text>
      <view class="mt-info-row"><text class="mt-info-row__label">品牌</text><text>{{ goods.brandName || '-' }}</text></view>
      <view class="mt-info-row"><text class="mt-info-row__label">门店</text><text>{{ goods.poiName || '-' }}</text></view>
      <view class="mt-info-row"><text class="mt-info-row__label">距离</text><text>{{ goods.distance || '-' }}</text></view>
      <view v-if="goods.validTimeText" class="mt-info-row">
        <text class="mt-info-row__label">有效期</text><text>{{ goods.validTimeText }}</text>
      </view>
      <view class="mt-info-row">
        <text class="mt-info-row__label">可约门店</text>
        <text>{{ goods.availablePoiNum }} 家</text>
      </view>
    </view>

    <view class="buy-bar">
      <view class="buy-bar__rebate">
        <text class="buy-bar__rebate-label">预计佣金</text>
        <text class="buy-bar__rebate-value">¥{{ goods.rebate }}</text>
      </view>
      <view class="buy-bar__btn" :class="{ 'buy-bar__btn--disabled': buying }" @tap="onBuy">
        {{ buying ? '获取链接中…' : '领券购买' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMeituanGoodsDetail, getMeituanBuyLink, openLink } from '@/utils/api'
import { ensureLogin } from '@/utils/auth'

const goods = ref(null)
const buying = ref(false)
let sign = ''

onLoad(async (query) => {
  sign = decodeURIComponent(query.sign || '')
  goods.value = await getMeituanGoodsDetail(sign)
  if (!goods.value) {
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
  padding: 20rpx 24rpx 160rpx;
}

.mt-hero {
  display: flex;
  padding: 24rpx;

  &__img { width: 280rpx; height: 280rpx; border-radius: 16rpx; background: #F2F2F7; flex-shrink: 0; }
  &__body { flex: 1; margin-left: 24rpx; }
  &__title { font-size: 30rpx; font-weight: 600; line-height: 42rpx; color: #1C1C1E; }
  &__price-row { display: flex; align-items: baseline; gap: 12rpx; margin-top: 16rpx; }
  &__price { font-size: 44rpx; }
  &__label { display: block; margin-top: 12rpx; font-size: 22rpx; color: #FF9500; }
}

.mt-card {
  margin-top: 20rpx;
  padding: 28rpx;
}

.mt-info-row {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(60, 60, 67, 0.08);
  font-size: 28rpx;

  &:last-child { border-bottom: none; }

  &__label { color: rgba(60, 60, 67, 0.6); }
}

.buy-bar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);

  &__rebate {
    display: flex;
    flex-direction: column;
    margin-right: 24rpx;

    &-label { font-size: 22rpx; color: rgba(60, 60, 67, 0.6); }
    &-value { font-size: 32rpx; font-weight: 700; color: #FF3B30; }
  }

  &__btn {
    flex: 1;
    background: #FF3B30;
    color: #FFFFFF;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    border-radius: 44rpx;
    padding: 22rpx 0;

    &--disabled { opacity: 0.5; }
  }
}
</style>
