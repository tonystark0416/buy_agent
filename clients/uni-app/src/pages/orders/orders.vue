<template>
  <view class="orders-page">
    <!-- 平台分段控件 -->
    <view class="ios-segment">
      <view
        v-for="t in platformTabs"
        :key="t.key"
        class="ios-segment__item"
        :class="{ 'ios-segment__item--active': platform === t.key }"
        @tap="switchPlatform(t.key)"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- 订单卡片 -->
    <view v-for="o in list" :key="o.id" class="order-card">
      <!-- 卡片头：订单号 + 状态 -->
      <view class="order-card__header">
        <text class="order-card__sn">订单号 {{ o.orderSn }}</text>
        <view class="order-card__status" :class="'order-card__status--' + o.status">
          <view class="order-card__dot"></view>
          <text>{{ statusText(o.status) }}</text>
        </view>
      </view>

      <!-- 卡片体：商品图 + 信息 -->
      <view class="order-card__body">
        <image class="order-card__img" :src="o.goodsImgUrl" mode="aspectFill" />
        <view class="order-card__info">
          <text class="order-card__title">{{ o.goodsName || '商品' }}</text>
          <text class="order-card__platform">{{ platform === 'vip' ? '唯品会' : '美团' }}</text>
          <text class="order-card__time">下单时间 {{ o.createTime }}</text>
        </view>
      </view>

      <!-- 卡片尾：实付 + 佣金 -->
      <view class="order-card__footer">
        <view class="order-card__amount">
          <text class="order-card__amount-label">实付</text>
          <text class="order-card__amount-value">¥{{ o.orderAmount }}</text>
        </view>
        <view class="order-card__commission" v-if="o.commission">
          <text class="order-card__commission-label">佣金</text>
          <text class="order-card__commission-value">¥{{ o.commission }}</text>
        </view>
      </view>
    </view>

    <!-- 加载/空状态 -->
    <view v-if="loading && list.length" class="load-more"><text>加载中...</text></view>
    <view v-if="!loading && list.length && page >= totalPages" class="load-more"><text>没有更多了</text></view>
    <view v-if="!loading && list.length === 0" class="empty-state">
      <view class="empty-state__icon">📦</view>
      <text class="empty-state__text">暂无{{ platform === 'vip' ? '唯品会' : '美团' }}订单</text>
      <view class="empty-state__retry" @tap="load(true)">刷新</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { getOrderList, ORDER_STATUS_TEXT } from '@/utils/api'
import { getUid, ensureLogin } from '@/utils/auth'

const platformTabs = [
  { key: 'vip', label: '唯品会' },
  { key: 'meituan', label: '美团' },
]
const platform = ref('vip')
const list = ref([])
const page = ref(1)
const totalPages = ref(0)
const loading = ref(false)

function statusText(s) {
  return ORDER_STATUS_TEXT[s] || '未知'
}

async function load(reset = false) {
  if (!ensureLogin()) return
  if (loading.value) return
  loading.value = true
  const targetPage = reset ? 1 : page.value + 1
  const res = await getOrderList(getUid(), targetPage, platform.value)
  list.value = reset ? res.list : [...list.value, ...res.list]
  page.value = res.page
  totalPages.value = res.totalPages
  loading.value = false
}

function switchPlatform(key) {
  if (platform.value === key) return
  platform.value = key
  list.value = []
  load(true)
}

onShow(() => load(true))

onPullDownRefresh(async () => {
  await load(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (page.value < totalPages.value) load()
})
</script>

<style lang="scss" scoped>
.orders-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding: 20rpx 24rpx 40rpx;
  box-sizing: border-box;
}

/* ===== 订单卡片（三段式） ===== */
.order-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;

  /* 头：单号 + 状态 */
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 28rpx;
    border-bottom: 1rpx solid rgba(60, 60, 67, 0.1);
  }

  &__sn {
    font-size: 24rpx;
    color: rgba(60, 60, 67, 0.6);
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 26rpx;
    font-weight: 600;

    &--0 { color: #8E8E93; .order-card__dot { background: #8E8E93; } }
    &--1 { color: #FF9500; .order-card__dot { background: #FF9500; } }
    &--2 { color: #34C759; .order-card__dot { background: #34C759; } }
  }

  &__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
  }

  /* 体：图 + 信息 */
  &__body {
    display: flex;
    padding: 24rpx 28rpx;
  }

  &__img {
    width: 140rpx;
    height: 140rpx;
    border-radius: 16rpx;
    background: #F2F2F7;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    margin-left: 24rpx;
    overflow: hidden;
  }

  &__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    font-size: 28rpx;
    font-weight: 600;
    color: #1C1C1E;
    line-height: 1.45;
  }

  &__platform {
    display: inline-block;
    margin-top: 10rpx;
    font-size: 20rpx;
    color: #007AFF;
    background: rgba(0, 122, 255, 0.1);
    border-radius: 8rpx;
    padding: 4rpx 12rpx;
  }

  &__time {
    display: block;
    margin-top: 10rpx;
    font-size: 22rpx;
    color: rgba(60, 60, 67, 0.36);
  }

  /* 尾：实付 + 佣金 */
  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 28rpx;
    background: rgba(118, 118, 128, 0.06);
  }

  &__amount {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
  }

  &__amount-label {
    font-size: 24rpx;
    color: rgba(60, 60, 67, 0.6);
  }

  &__amount-value {
    font-size: 32rpx;
    font-weight: 700;
    color: #1C1C1E;
  }

  &__commission {
    display: flex;
    align-items: center;
    gap: 10rpx;
    background: rgba(52, 199, 89, 0.12);
    border-radius: 26rpx;
    padding: 8rpx 20rpx;
  }

  &__commission-label {
    font-size: 22rpx;
    color: #34C759;
  }

  &__commission-value {
    font-size: 26rpx;
    font-weight: 700;
    color: #34C759;
  }
}

/* ===== 加载 / 空状态 ===== */
.load-more {
  text-align: center;
  padding: 30rpx 0;
  color: rgba(60, 60, 67, 0.36);
  font-size: 26rpx;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;

  &__icon { font-size: 88rpx; margin-bottom: 24rpx; }
  &__text { display: block; color: rgba(60, 60, 67, 0.36); font-size: 28rpx; }
  &__retry {
    display: inline-block;
    margin-top: 32rpx;
    padding: 14rpx 56rpx;
    background: #007AFF;
    color: #FFFFFF;
    font-size: 26rpx;
    font-weight: 600;
    border-radius: 34rpx;
  }
}
</style>
