import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api/admin',
  timeout: 15000
})

// 请求拦截：注入 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一处理 code / 401
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) {
      return res.data
    }
    ElMessage.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg || '请求失败'))
  },
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.msg
    if (status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      ElMessage.error('登录已过期，请重新登录')
      // 避免在登录页循环跳转；基于 BASE_URL 拼接，兼容 /admin/ 子路径部署
      const loginPath = `${import.meta.env.BASE_URL}login`
      if (!location.pathname.endsWith('/login')) {
        location.href = loginPath
      }
    } else {
      ElMessage.error(msg || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
