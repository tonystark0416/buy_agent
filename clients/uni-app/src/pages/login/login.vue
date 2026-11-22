<template>
  <view class="login-page">
    <view class="login-hero">
      <text class="login-hero__title">值物APP</text>
      <text class="login-hero__sub">登录后购物可享返利</text>
    </view>

    <view class="card login-form">
      <view class="login-form__row">
        <input
          class="login-input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          v-model="phone"
        />
      </view>
      <view class="login-form__row login-form__row--code">
        <input
          class="login-input login-input--code"
          type="number"
          maxlength="6"
          placeholder="验证码"
          v-model="code"
        />
        <view
          class="login-send"
          :class="{ 'login-send--disabled': countdown > 0 || !phoneValid }"
          @tap="onSendCode"
        >
          {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
        </view>
      </view>
      <view
        class="btn-primary login-btn"
        :class="{ 'btn-primary--disabled': !canSubmit }"
        @tap="onLogin"
      >
        登录 / 注册
      </view>
      <text class="login-tip">未注册的手机号将自动创建账号</text>
      <text v-if="devTip" class="login-dev-tip">{{ devTip }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sendVerificationCode, loginByCode } from '@/utils/api'
import { setAuth } from '@/utils/auth'

const phone = ref('')
const code = ref('')
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)
const devTip = ref('')

let timer = null

const phoneValid = computed(() => /^1\d{10}$/.test(phone.value))
const canSubmit = computed(() => phoneValid.value && code.value.length === 6 && !submitting.value)

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function onSendCode() {
  if (countdown.value > 0 || !phoneValid.value) {
    if (!phoneValid.value) uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  sending.value = true
  try {
    const res = await sendVerificationCode(phone.value)
    if (res && res.code === 200) {
      startCountdown()
      // 联调模式：未接 SMS 服务商时后端透出 devCode，自动填入方便体验
      const devCode = res.data && res.data.devCode
      if (devCode) {
        code.value = String(devCode)
        devTip.value = `联调模式：验证码 ${devCode} 已自动填入`
      } else {
        uni.showToast({ title: '验证码已发送', icon: 'none' })
      }
    } else {
      uni.showToast({ title: (res && res.msg) || '发送失败，请稍后再试', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常，请稍后再试', icon: 'none' })
  } finally {
    sending.value = false
  }
}

async function onLogin() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const res = await loginByCode({ phone: phone.value, code: code.value })
    if (res && res.code === 200 && res.data) {
      setAuth({
        uid: (res.data.user && res.data.user.id) || '',
        phone: (res.data.user && res.data.user.phone) || phone.value,
        token: res.data.token || '',
        loginAt: Date.now(),
      })
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 600)
    } else {
      uni.showToast({ title: (res && res.msg) || '登录失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络异常，请稍后再试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  padding: 0 40rpx;
}

.login-hero {
  padding: 140rpx 0 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__title {
    font-size: 52rpx;
    font-weight: 700;
    color: #1C1C1E;
  }

  &__sub {
    margin-top: 16rpx;
    font-size: 28rpx;
    color: rgba(60, 60, 67, 0.6);
  }
}

.login-form {
  padding: 40rpx 32rpx;

  &__row {
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid rgba(60, 60, 67, 0.12);
    padding: 24rpx 0;

    &--code {
      justify-content: space-between;
    }
  }
}

.login-input {
  flex: 1;
  font-size: 32rpx;

  &--code {
    flex: 1;
  }
}

.login-send {
  color: #007AFF;
  font-size: 28rpx;
  font-weight: 600;
  padding-left: 24rpx;

  &--disabled {
    color: rgba(60, 60, 67, 0.36);
  }
}

.login-btn {
  margin-top: 56rpx;
}

.login-tip {
  display: block;
  text-align: center;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: rgba(60, 60, 67, 0.36);
}

.login-dev-tip {
  display: block;
  text-align: center;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #FF9500;
  font-weight: 600;
}
</style>
