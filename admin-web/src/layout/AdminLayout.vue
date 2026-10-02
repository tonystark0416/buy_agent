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
        <el-menu-item index="/goods">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { getProfile } from '../api/auth'

const router = useRouter()

// 安全读取 localStorage 中的管理员信息（数据损坏时返回 null，避免白屏）
function parseAdminInfo() {
  try {
    return JSON.parse(localStorage.getItem('admin_info') || 'null')
  } catch (e) {
    return null
  }
}

const adminName = ref('')
adminName.value = (() => {
  const info = parseAdminInfo()
  return info ? (info.nickname || info.username || '管理员') : '管理员'
})()

// 每次进入后台时刷新管理员信息，避免登录后角色被修改而前端仍用旧缓存
onMounted(async () => {
  try {
    const profile = await getProfile()
    if (profile) {
      const info = {
        id: profile.id,
        username: profile.username,
        nickname: profile.nickname,
        role: profile.role
      }
      localStorage.setItem('admin_info', JSON.stringify(info))
      adminName.value = info.nickname || info.username || '管理员'
    }
  } catch (e) {
    // 拉取失败（如 token 过期）时由 axios 拦截器统一处理，这里忽略
  }
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
