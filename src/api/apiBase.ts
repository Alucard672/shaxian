const FALLBACK_API_BASE = 'http://t.jiyizhiyun.com/biz/api'
const OVERRIDE_KEY = 'apiBaseOverride'

// 默认使用当前域名同源 + /biz/api，避免协议/环境串台
function defaultApiBase(): string {
  if (typeof window === 'undefined') return FALLBACK_API_BASE
  return `${window.location.protocol}//${window.location.host}/biz/api`
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return import.meta.env.VITE_API_BASE_URL || defaultApiBase()
  return localStorage.getItem(OVERRIDE_KEY) || import.meta.env.VITE_API_BASE_URL || defaultApiBase()
}

export function setApiBaseOverride(url: string | null): void {
  if (typeof window === 'undefined') return
  if (url) localStorage.setItem(OVERRIDE_KEY, url)
  else localStorage.removeItem(OVERRIDE_KEY)
}

export function clearApiBaseOverride(): void {
  setApiBaseOverride(null)
}
