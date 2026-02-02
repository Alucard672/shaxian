const DEFAULT_API_BASE = 'http://t.jiyizhiyun.com/biz/api'
const OVERRIDE_KEY = 'apiBaseOverride'

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE
  return localStorage.getItem(OVERRIDE_KEY) || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE
}

export function setApiBaseOverride(url: string | null): void {
  if (typeof window === 'undefined') return
  if (url) localStorage.setItem(OVERRIDE_KEY, url)
  else localStorage.removeItem(OVERRIDE_KEY)
}

export function clearApiBaseOverride(): void {
  setApiBaseOverride(null)
}
