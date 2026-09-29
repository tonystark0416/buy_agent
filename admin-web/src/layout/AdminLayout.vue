<template>
  <el-container class="layout">
    <el-aside width="200px" class="aside">
      <div class="logo">buy_agent 后台</div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#fff"
      >
        <el-menu-item index="/order">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ $route.meta.title }}</div>
        <div class="header-right">
          <span class="admin-name">{{ adminName }}</span>
          <el-button link type="danger" @click="logout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'

const router = useRouter()

const adminName = computed(() => {
  const info = JSON.parse(localStorage.getItem('admin_info') || 'null')
  return info ? (info.nickname || info.username) : '管理员'
})

function logout() {
  ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
    .then(() => {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      router.push('/login')
    })
    .catch(() => {})
}
</script>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #001529;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}
.aside :deep(.el-menu) {
  border-right: none;
}
.aside :deep(.el-menu-item.is-active) {
  background: #1890ff;
}
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
.header-title {
  font-size: 16px;
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-name {
  color: #606266;
  font-size: 14px;
}
.main {
  padding: 16px;
}
</style>
