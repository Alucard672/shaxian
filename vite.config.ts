import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
function normalizeBase(input: string | undefined): string {
  const raw = (input ?? '').trim()
  if (!raw) return '/'
  // NOTE: This project uses BrowserRouter, so base should be an absolute path ("/" or "/shaxian/").
  let base = raw
  if (!base.startsWith('/')) base = `/${base}`
  if (!base.endsWith('/')) base = `${base}/`
  return base
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer VITE_BASE for different deployment targets:
  // - Domain root: VITE_BASE="/"
  // - Subpath (e.g. GitHub Pages): VITE_BASE="/shaxian/"
  const base = normalizeBase(env.VITE_BASE)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base,
    server: {
      port: 5173,
      proxy: {
        // dev 模式下：前端调 /biz/api/* 自动转给后端 8080
        '/biz/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        // 兼容旧逻辑（如果还有代码走 /api 前缀的，转到 mock 后端 3000）
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
