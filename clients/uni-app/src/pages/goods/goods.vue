<template>
  <view class="goods-page" v-if="goods">
    <!-- 商品图轮播（全宽置顶，自动播放） -->
    <swiper
      v-if="goods.images.length"
      class="goods-swiper"
      :indicator-dots="goods.images.length > 1"
      indicator-color="rgba(255, 255, 255, 0.4)"
      indicator-active-color="#ffffff"
      :circular="goods.images.length > 1"
      :autoplay="goods.images.length > 1"
      :interval="4000"
    >
      <swiper-item v-for="(img, i) in goods.images" :key="i">
        <image class="goods-image" :src="img" mode="aspectFill" @tap="previewImage(i)" />
      </swiper-item>
    </swiper>
    <image v-else-if="goods.image" class="goods-image" :src="goods.image" mode="aspectFill" @tap="previewImage(0)" />

    <!-- 价格卡 -->
    <view class="price-section">
      <view class="price-row">
        <text class="price-symbol">¥</text>
        <text class="price-value">{{ goods.price }}</text>
        <text v-if="goods.originalPrice > goods.price" class="original-price">¥{{ goods.originalPrice }}</text>
      </view>
      <!-- 价格计算方式（分段高亮） -->
      <view v-if="priceDescParts.length" class="price-desc-row">
        <view class="price-desc-inner">
          <template v-for="(part, i) in priceDescParts" :key="part.id">
            <text v-if="i > 0" class="price-desc-minus">-</text>
            <text class="price-desc-part" :class="{ 'price-desc-part--hl': part.highlight }">{{ part.text }}</text>
          </template>
        </view>
      </view>
    </view>

    <!-- 商品标题 -->
    <view class="info-section">
      <text class="goods-title">{{ goods.title }}</text>
    </view>

    <!-- 标签 -->
    <view v-if="goods.tags.length" class="tags-row">
      <text v-for="(t, i) in goods.tags" :key="i" class="tag-item">{{ t }}</text>
    </view>

    <!-- 品牌/店铺/分类/销量 -->
    <view class="meta-section" v-if="goods.brandName || goods.storeName || goods.categoryName || goods.sales">
      <view v-if="goods.brandName" class="meta-item">
        <text class="meta-label">品牌</text>
        <text class="meta-value">{{ goods.brandName }}</text>
      </view>
      <view v-if="goods.storeName" class="meta-item">
        <text class="meta-label">店铺</text>
        <text class="meta-value">{{ goods.storeName }}</text>
      </view>
      <view v-if="goods.categoryName" class="meta-item">
        <text class="meta-label">分类</text>
        <text class="meta-value">{{ goods.categoryName }}</text>
      </view>
      <view v-if="goods.sales" class="meta-item">
        <text class="meta-label">销量</text>
        <text class="meta-value">{{ goods.sales }}</text>
      </view>
    </view>

    <!-- 商品详情图（全宽通栏） -->
    <view v-if="goods.detailImages.length" class="detail-images">
      <image
        v-for="(img, i) in goods.detailImages"
        :key="i"
        class="detail-img"
        :src="img"
        mode="widthFix"
        lazy-load
        @tap="previewDetailImage(i)"
      />
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="buy-btn" :class="{ 'buy-btn--disabled': buying }" @tap="onBuy">
        {{ buying ? '获取链接中…' : '前往购买' }}
      </view>
    </view>
  </view>

  <!-- 加载/失败态 -->
  <view class="fallback" v-else>
    <text>{{ loadFailed ? '商品详情加载失败' : '加载中...' }}</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getProductDetail, getGoodsTranUrlByGoodsId, openLink } from '@/utils/api'
import { ensureLogin } from '@/utils/auth'

const goods = ref(null)
const loadFailed = ref(false)
const buying = ref(false)
let goodsId = ''
let platform = 'vip'

onLoad(async (query) => {
  goodsId = query.goodsId || ''
  platform = query.platform || 'vip'
  const res = await getProductDetail(goodsId, platform)
  if (res.code === 0 && res.data) {
    goods.value = res.data
  } else {
    loadFailed.value = true
    uni.showToast({ title: res.message || '商品加载失败', icon: 'none' })
  }
})

/**
 * 价格计算方式拆解：priceDesc（如 "¥167-超V折扣 ¥3"）
 * 按首个 "-" 拆两段，后半段（优惠说明）高亮；与小程序 _normalizeDetail 一致
 */
const priceDescParts = computed(() => {
  const desc = (goods.value && goods.value.priceDesc) || ''
  if (!desc) return []
  const dashIdx = desc.indexOf('-')
  if (dashIdx > 0 && dashIdx < desc.length - 1) {
    return [
      { id: 0, text: desc.slice(0, dashIdx).trim(), highlight: false },
      { id: 1, text: desc.slice(dashIdx + 1).trim(), highlight: true },
    ]
  }
  return [{ id: 0, text: desc.trim(), highlight: false }]
})

function previewImage(index) {
  const urls = goods.value.images.length ? goods.value.images : [goods.value.image]
  uni.previewImage({ urls, current: index })
}

function previewDetailImage(index) {
  uni.previewImage({ urls: goods.value.detailImages, current: index })
}

async function onBuy() {
  if (buying.value) return
  if (!ensureLogin()) return
  buying.value = true
  try {
    const res = await getGoodsTranUrlByGoodsId({
      goodsId,
      platform,
      pid: goods.value.pid || '',
    })
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
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 160rpx;
}

/* ===== 轮播 ===== */
.goods-swiper {
  width: 100%;
  height: 750rpx;
  background: rgba(118, 118, 128, 0.12);
}

.goods-image {
  width: 100%;
  height: 750rpx;
  display: block;
  background: rgba(118, 118, 128, 0.12);
}

/* ===== 价格卡 ===== */
.price-section {
  margin: 24rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  flex-wrap: wrap;
}

.price-symbol {
  font-size: 30rpx;
  font-weight: 700;
  color: #FF3B30;
}

.price-value {
  font-size: 52rpx;
  font-weight: 700;
  color: #FF3B30;
  letter-spacing: -1rpx;
}

.original-price {
  font-size: 26rpx;
  color: rgba(60, 60, 67, 0.36);
  text-decoration: line-through;
}

/* 价格计算方式（红底分段） */
.price-desc-row {
  margin-top: 16rpx;
}

.price-desc-inner {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  background: rgba(255, 59, 48, 0.08);
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
}

.price-desc-part {
  font-size: 22rpx;
  color: #FF3B30;

  &--hl {
    font-weight: 700;
  }
}

.price-desc-minus {
  font-size: 22rpx;
  color: #FF3B30;
  opacity: 0.7;
}

/* ===== 商品标题卡 ===== */
.info-section {
  margin: 20rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.goods-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1C1C1E;
  line-height: 1.5;
}

/* ===== 标签行 ===== */
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 20rpx 32rpx 0;
}

.tag-item {
  font-size: 22rpx;
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 10rpx;
  padding: 6rpx 18rpx;
}

/* ===== 品牌/店铺/分类/销量 ===== */
.meta-section {
  margin: 20rpx 32rpx 0;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 8rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.meta-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid rgba(60, 60, 67, 0.08);

  &:last-child {
    border-bottom: none;
  }
}

.meta-label {
  font-size: 26rpx;
  color: rgba(60, 60, 67, 0.6);
  flex-shrink: 0;
}

.meta-value {
  font-size: 26rpx;
  color: #1C1C1E;
  text-align: right;
  line-height: 1.5;
}

/* ===== 详情图（全宽通栏） ===== */
.detail-images {
  margin: 20rpx 32rpx 40rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.detail-img {
  width: 100%;
  display: block;
}

/* ===== 底部操作栏 ===== */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.buy-btn {
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  background: #007AFF;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 46rpx;

  &--disabled {
    opacity: 0.5;
  }
}

/* ===== 加载/失败 ===== */
.fallback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(60, 60, 67, 0.36);
  font-size: 28rpx;
  background: #F2F2F7;
}
</style>
