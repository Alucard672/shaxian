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
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
