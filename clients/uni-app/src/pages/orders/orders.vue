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

    <view v-for="o in list" :key="o.id" class="card order-card">
      <image class="order-card__img" :src="o.goodsImgUrl" mode="aspectFill" />
      <view class="order-card__body">
        <text class="order-card__title">{{ o.goodsName || '商品' }}</text>
        <text class="order-card__sn">单号 {{ o.orderSn }}</text>
        <text class="order-card__time">{{ o.createTime }}</text>
        <view class="order-card__amounts">
          <text class="order-card__amount">订单 ¥{{ o.orderAmount }}</text>
          <text class="rebate-tag">佣金 ¥{{ o.commission }}</text>
        </view>
      </view>
      <view class="order-card__status" :class="'order-card__status--' + o.status">
        {{ statusText(o.status) }}
      </view>
    </view>

    <view v-if="list.length && page < totalPages" class="load-more" @tap="loadMore">加载更多</view>
    <view v-if="list.length && page >= totalPages" class="load-more">— 没有更多了 —</view>
    <view v-if="!loading && list.length === 0" class="empty-state">暂无订单</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
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

function loadMore() {
  if (page.value < totalPages.value) load()
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
</script>

<style lang="scss" scoped>
.orders-page {
  padding: 20rpx 24rpx 40rpx;
}

.order-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  position: relative;

  &__img {
    width: 120rpx;
    height: 120rpx;
    border-radius: 16rpx;
    background: #F2F2F7;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    margin-left: 24rpx;
    margin-right: 100rpx;
    overflow: hidden;
  }

  &__title {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #1C1C1E;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sn, &__time {
    display: block;
    font-size: 22rpx;
    color: rgba(60, 60, 67, 0.36);
    margin-top: 6rpx;
  }

  &__amounts {
    display: flex;
    align-items: center;
    gap: 14rpx;
    margin-top: 12rpx;
  }

  &__amount {
    font-size: 26rpx;
    color: #1C1C1E;
    font-weight: 600;
  }

  &__status {
    position: absolute;
    right: 24rpx;
    top: 24rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #34C759;

    &--0 { color: #8E8E93; }
    &--1 { color: #FF9500; }
    &--2 { color: #34C759; }
  }
}
</style>
