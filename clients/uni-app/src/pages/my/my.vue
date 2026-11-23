<template>
  <view class="my-page">
    <!-- 未登录引导 -->
    <template v-if="!isLoggedIn">
      <view class="login-guide">
        <view class="login-guide__avatar"><text>?</text></view>
        <text class="login-guide__title">尚未登录</text>
        <text class="login-guide__desc">登录后可查看订单与佣金</text>
        <view class="login-guide__btn" @tap="goLogin">立即登录</view>
      </view>
    </template>

    <!-- 已登录：个人信息 -->
    <template v-else>
      <!-- 用户信息卡 -->
      <view class="user-card">
        <view class="user-card__avatar"><text>{{ avatarText }}</text></view>
        <view class="user-card__info">
          <text class="user-card__name">{{ nickname }}</text>
          <text class="user-card__phone">{{ maskedPhone }}</text>
        </view>
      </view>

      <!-- 账号信息卡 -->
      <view class="info-card">
        <view class="info-card__row">
          <text class="info-card__label">用户 ID</text>
          <text class="info-card__value">{{ uid }}</text>
        </view>
        <view class="info-card__row">
          <text class="info-card__label">注册手机号</text>
          <text class="info-card__value">{{ maskedPhone }}</text>
        </view>
        <view class="info-card__row">
          <text class="info-card__label">登录时间</text>
          <text class="info-card__value">{{ loginAtText }}</text>
        </view>
      </view>

      <!-- 菜单卡 -->
      <view class="menu-card">
        <view class="menu-card__item" @tap="goOrders">
          <text class="menu-card__label">📦 我的订单</text>
          <text class="menu-card__arrow">›</text>
        </view>
        <view class="menu-card__item">
          <text class="menu-card__label">佣金提现</text>
          <text class="menu-card__value">敬请期待</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @tap="onLogout">退出登录</view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAuth, logout } from '@/utils/auth'

const auth = ref({})

onShow(() => {
  auth.value = getAuth()
})

const isLoggedIn = computed(() => !!auth.value.uid)
const uid = computed(() => auth.value.uid || '-')
const phone = computed(() => auth.value.phone || '')

/** 手机号打码：138****0000 */
const maskedPhone = computed(() => {
  const p = phone.value
  return /^1\d{10}$/.test(p) ? p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : p || '-'
})

/** 头像占位：手机号后两位 */
const avatarText = computed(() => {
  const p = phone.value
  return /^1\d{10}$/.test(p) ? p.slice(-2) : '值'
})

/** 昵称：默认「用户 + 手机号后四位」 */
const nickname = computed(() => {
  const p = phone.value
  return /^1\d{10}$/.test(p) ? `用户${p.slice(-4)}` : '值物用户'
})

const loginAtText = computed(() => {
  if (!auth.value.loginAt) return '-'
  const d = new Date(auth.value.loginAt)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function goOrders() {
  uni.switchTab({ url: '/pages/orders/orders' })
}

function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmColor: '#FF3B30',
    success: ({ confirm }) => {
      if (!confirm) return
      logout()
      auth.value = {}
      uni.showToast({ title: '已退出登录', icon: 'none' })
    },
  })
}
</script>

<style lang="scss" scoped>
.my-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding: 24rpx 32rpx 40rpx;
  box-sizing: border-box;
}

/* ===== 未登录引导 ===== */
.login-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 80rpx 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &__avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: rgba(118, 118, 128, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(60, 60, 67, 0.36);
    font-size: 56rpx;
    font-weight: 600;
  }

  &__title {
    margin-top: 32rpx;
    font-size: 34rpx;
    font-weight: 600;
    color: #1C1C1E;
  }

  &__desc {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: rgba(60, 60, 67, 0.36);
  }

  &__btn {
    margin-top: 48rpx;
    padding: 0 80rpx;
    height: 84rpx;
    line-height: 84rpx;
    background: #007AFF;
    color: #FFFFFF;
    font-size: 30rpx;
    font-weight: 600;
    border-radius: 42rpx;
  }
}

/* ===== 用户信息卡 ===== */
.user-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &__avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: #007AFF;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-size: 44rpx;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__info {
    margin-left: 24rpx;
    overflow: hidden;
  }

  &__name {
    display: block;
    font-size: 34rpx;
    font-weight: 600;
    color: #1C1C1E;
  }

  &__phone {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: rgba(60, 60, 67, 0.6);
  }
}

/* ===== 账号信息卡 ===== */
.info-card {
  margin-top: 20rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 8rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22rpx 0;
    border-bottom: 1rpx solid rgba(60, 60, 67, 0.08);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-size: 26rpx;
    color: rgba(60, 60, 67, 0.6);
  }

  &__value {
    font-size: 26rpx;
    color: #1C1C1E;
  }
}

/* ===== 菜单卡 ===== */
.menu-card {
  margin-top: 20rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 8rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 26rpx 0;
    border-bottom: 1rpx solid rgba(60, 60, 67, 0.08);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-size: 28rpx;
    color: #1C1C1E;
  }

  &__value {
    font-size: 24rpx;
    color: rgba(60, 60, 67, 0.36);
  }

  &__arrow {
    font-size: 34rpx;
    color: rgba(60, 60, 67, 0.36);
  }
}

/* ===== 退出登录 ===== */
.logout-btn {
  margin-top: 40rpx;
  height: 92rpx;
  line-height: 92rpx;
  text-align: center;
  background: #FFFFFF;
  color: #FF3B30;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
</style>
