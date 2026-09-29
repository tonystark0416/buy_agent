<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 class="title">buy_agent 后台管理</h2>
      <el-form :model="form" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登 录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '../api/auth'

const router = useRouter()
const route = useRoute()

const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const data = await login({ username: form.username, password: form.password })
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_info', JSON.stringify(data.admin))
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/')
  } catch (e) {
    // 错误已在拦截器统一提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1c3faa 0%, #1890ff 100%);
}
.login-card {
  width: 380px;
  padding: 12px 8px;
}
.title {
  text-align: center;
  margin: 8px 0 24px;
  color: #303133;
}
.login-btn {
  width: 100%;
}
</style>
