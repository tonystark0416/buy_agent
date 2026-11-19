/**
 * 登录态（App 端）：手机号+验证码登录，本地持久化 uid/token
 */
const AUTH_KEY = 'app_auth'

export function getAuth() {
  return uni.getStorageSync(AUTH_KEY) || {}
}

export function setAuth(auth) {
  uni.setStorageSync(AUTH_KEY, auth)
}

export function isLoggedIn() {
  return !!getAuth().uid
}

export function getUid() {
  return getAuth().uid || ''
}

export function logout() {
  uni.removeStorageSync(AUTH_KEY)
}

/** 未登录时跳转登录页 */
export function ensureLogin() {
  if (isLoggedIn()) return true
  uni.navigateTo({ url: '/pages/login/login' })
  return false
}
