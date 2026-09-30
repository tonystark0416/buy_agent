import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 开发期代理到后端 Node 服务，避免跨域
export default defineConfig({
  plugins: [vue()],
  // 部署时由后端 Express 托管在 /admin 路径下，资源引用需要带此前缀
  base: '/admin/',
  server: {
    port: 5173,
    proxy: {
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
