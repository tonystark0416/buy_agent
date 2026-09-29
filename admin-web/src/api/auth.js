import request from './request'

// 后台登录
export const login = (data) => request.post('/auth/login', data)

// 当前管理员信息
export const getProfile = () => request.get('/auth/profile')
