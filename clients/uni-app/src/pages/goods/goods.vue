<template>
  <view class="goods-page" v-if="goods">
    <!-- 商品图轮播 -->
    <swiper v-if="goods.images.length" class="detail-swiper" circular>
      <swiper-item v-for="(img, i) in goods.images" :key="i">
        <image class="detail-swiper__img" :src="img" mode="aspectFill" @tap="previewImage(i)" />
      </swiper-item>
    </swiper>

    <!-- 价格与返利 -->
    <view class="card detail-card">
      <view class="detail-price-row">
        <text class="price-text detail-price">¥{{ goods.price }}</text>
        <text v-if="goods.originalPrice > goods.price" class="price-original">¥{{ goods.originalPrice }}</text>
        <view v-if="goods.rebate > 0" class="rebate-tag detail-rebate">下单返 ¥{{ goods.rebate }}</view>
      </view>
      <text class="detail-title">{{ goods.title }}</text>
      <view v-if="goods.tags.length" class="detail-tags">
        <text v-for="(t, i) in goods.tags" :key="i" class="detail-tags__item">{{ t }}</text>
      </view>
      <text v-if="goods.priceDesc" class="detail-price-desc">{{ goods.priceDesc }}</text>
    </view>

    <!-- 商品详情图 -->
    <view v-if="goods.detailImages.length" class="card detail-card">
      <text class="section-title">商品详情</text>
      <image
        v-for="(img, i) in goods.detailImages"
        :key="i"
        class="detail-image"
        :src="img"
        mode="widthFix"
      />
    </view>

    <!-- 底部购买栏 -->
    <view class="buy-bar">
      <view class="buy-bar__rebate">
        <text class="buy-bar__rebate-label">预计返利</text>
        <text class="buy-bar__rebate-value">¥{{ goods.rebate }}</text>
      </view>
      <view class="buy-bar__btn" :class="{ 'buy-bar__btn--disabled': buying }" @tap="onBuy">
        {{ buying ? '获取链接中…' : '前往购买' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getProductDetail, getGoodsTranUrlByGoodsId, openLink } from '@/utils/api'
import { ensureLogin } from '@/utils/auth'

const goods = ref(null)
const buying = ref(false)
let goodsId = ''
let platform = 'vip'

onLoad(async (query) => {
  goodsId = query.goodsId || ''
  platform = query.platform || 'vip'
  const res = await getProductDetail(goodsId, platform)
  if (res.code === 0) {
    goods.value = res.data
  } else {
    uni.showToast({ title: res.message || '商品加载失败', icon: 'none' })
  }
})

function previewImage(index) {
  uni.previewImage({
    urls: goods.value.images,
    current: index,
  })
}

async function onBuy() {
  if (buying.value) return
  if (!ensureLogin()) return
  buying.value = true
  try {
    const res = await getGoodsTranUrlByGoodsId({ goodsId, platform, pid: '123213' })
    if (res && res.result && res.urls && res.urls.h5_url) {
      openLink(res.urls.h5_url)
    } else {
      uni.showToast({ title: '获取购买链接失败，请稍后再试', icon: 'none' })
    }
  } finally {
    buying.value = false
  }
}
</script>

<style lang="scss" scoped>
.goods-page {
  padding-bottom: 160rpx;
}

.detail-swiper {
  width: 100%;
  height: 750rpx;
  background: #F2F2F7;

  &__img { width: 750rpx; height: 750rpx; }
}

.detail-card {
  margin: 20rpx 24rpx;
  padding: 28rpx;
}

.detail-price-row {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
}

.detail-price { font-size: 48rpx; }
.detail-rebate { margin-left: auto; }

.detail-title {
  display: block;
  margin-top: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 44rpx;
  color: #1C1C1E;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;

  &__item {
    background: #F2F2F7;
    color: rgba(60, 60, 67, 0.6);
    font-size: 22rpx;
    border-radius: 8rpx;
    padding: 6rpx 14rpx;
  }
}

.detail-price-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: rgba(60, 60, 67, 0.36);
}

.detail-image {
  width: 100%;
  display: block;
  margin-top: 20rpx;
}

.detail-card .detail-image:first-of-type {
  margin-top: 0;
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
    background: #007AFF;
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
