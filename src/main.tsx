import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

/**
 * 修复静态站点（如 GitHub Pages）下 BrowserRouter 刷新/直达路由 404 的问题。
 *
 * public/404.html 会把 /shaxian/product/123?tenantId=1
 * 重定向成 /shaxian/?/product/123&tenantId=1（并把原查询串中的 & 编码为 ~and~）。
 * 这里在应用启动前把它还原回真实路径，避免落到受保护的 "/" 从而跳转登录。
 */
function restoreSpaPathFromQuery() {
  if (typeof window === 'undefined') return

  const { pathname, search, hash } = window.location

  // 1) 处理 hash 路由（用于二维码：/#/product/:id?...）
  // 把 "/shaxian/#/product/123?tenantId=1" 还原为 "/shaxian/product/123?tenantId=1"
  if (hash && hash.startsWith('#/')) {
    const frag = hash.slice(1) // "/product/123?tenantId=1"
    const [routePathRaw, queryRaw] = frag.split('?')
    const routePath = routePathRaw || ''
    if (routePath) {
      const base =
        pathname === '/'
          ? ''
          : (pathname.endsWith('/') ? pathname.slice(0, -1) : pathname)
      const query = queryRaw ? `?${queryRaw}` : ''
      const nextPath = `${base}${routePath}${query}`
      window.history.replaceState(null, '', nextPath)
      return
    }
  }

  if (!search || !search.startsWith('?/')) return

  // 去掉 "?/"，并把 ~and~ 还原为 "&"
  const decoded = search.slice(2).replace(/~and~/g, '&')
  const parts = decoded.split('&').filter(Boolean)
  const routePath = parts.shift() || ''
  if (!routePath) return

  const query = parts.length > 0 ? `?${parts.join('&')}` : ''

  // pathname 在 404 重定向后通常是 "/shaxian/"（或 "/"）
  const base = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const nextPath = `${base}/${routePath.replace(/^\/+/, '')}${query}${hash || ''}`

  window.history.replaceState(null, '', nextPath)
}

restoreSpaPathFromQuery()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)












