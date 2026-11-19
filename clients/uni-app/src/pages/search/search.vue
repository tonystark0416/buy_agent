<template>
  <view class="search-page">
    <view class="search-bar">
      <input
        class="search-bar__input"
        placeholder="搜索商品领返利"
        confirm-type="search"
        v-model="keyword"
        @confirm="doSearch(true)"
      />
      <view class="search-bar__btn" @tap="doSearch(true)">搜索</view>
    </view>

    <view class="goods-grid">
      <view
        v-for="item in list"
        :key="item.id"
        class="card goods-card"
        @tap="goGoods(item)"
      >
        <image class="goods-card__img" :src="item.image" mode="aspectFill" />
        <view class="goods-card__body">
          <text class="goods-card__title">{{ item.title }}</text>
          <view class="goods-card__price-row">
            <text class="price-text goods-card__price">¥{{ item.price }}</text>
            <text class="price-original">¥{{ item.originalPrice }}</text>
          </view>
          <view v-if="item.rebate > 0" class="rebate-tag">返利 ¥{{ item.rebate }}</view>
        </view>
      </view>
    </view>

    <view v-if="loading" class="load-more">搜索中…</view>
    <view v-if="list.length && hasMore" class="load-more">上拉加载更多</view>
    <view v-if="!loading && searched && list.length === 0" class="empty-state">没有找到相关商品</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onReachBottom } from '@dcloudio/uni-app'
import { searchProducts } from '@/utils/api'

const keyword = ref('')
const list = ref([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const searched = ref(false)

async function doSearch(reset = false) {
  if (loading.value || !keyword.value.trim()) return
  loading.value = true
  const targetPage = reset ? 1 : page.value + 1
  const res = await searchProducts({ keyword: keyword.value.trim(), page: targetPage })
  searched.value = true
  list.value = reset ? res.data.list : [...list.value, ...res.data.list]
  page.value = targetPage
  hasMore.value = res.data.hasMore
  loading.value = false
}

function goGoods(item) {
  uni.navigateTo({ url: `/pages/goods/goods?goodsId=${item.id}&platform=${item.platform}` })
}

onReachBottom(() => {
  if (hasMore.value) doSearch()
})
</script>

<style lang="scss" scoped>
.search-page {
  padding: 20rpx 24rpx 40rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 12rpx 12rpx 12rpx 28rpx;
  margin-bottom: 24rpx;

  &__input {
    flex: 1;
    font-size: 28rpx;
  }

  &__btn {
    background: #007AFF;
    color: #FFFFFF;
    font-size: 26rpx;
    font-weight: 600;
    border-radius: 32rpx;
    padding: 12rpx 32rpx;
  }
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
  &__price-row { margin-top: 12rpx; display: flex; align-items: baseline; gap: 10rpx; }
  &__price { font-size: 32rpx; }
}
</style>
