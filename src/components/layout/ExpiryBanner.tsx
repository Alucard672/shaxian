import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * 到期提醒：
 * - >30 天：顶部灰条 "剩余 N 天到期"
 * - ≤30 天：橙色 + ⚠️
 * - ≤7 天：红色 banner，可关闭（sessionStorage 记忆）
 */
const BANNER_DISMISSED_KEY = 'expiry_banner_dismissed_v1'

function ExpiryBanner() {
  const [tenantExpiresAt, setTenantExpiresAt] = useState<string | null>(null)
  const [tenantName, setTenantName] = useState<string>('')
  const [dismissed, setDismissed] = useState<boolean>(false)

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user?.tenantExpiresAt) setTenantExpiresAt(user.tenantExpiresAt)
        if (user?.tenantName) setTenantName(user.tenantName)
      }
    } catch {
      /* ignore */
    }
    setDismissed(sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1')
  }, [])

  if (!tenantExpiresAt) return null

  const daysLeft = Math.ceil((new Date(tenantExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0) return null // 应该已经在登录被拦

  // 红色 banner（≤7 天）
  if (daysLeft <= 7 && !dismissed) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>租户{tenantName ? ` ${tenantName} ` : ''}即将于 {daysLeft} 天后到期，请联系运营续费</span>
        </div>
        <button
          aria-label="关闭"
          onClick={() => {
            sessionStorage.setItem(BANNER_DISMISSED_KEY, '1')
            setDismissed(true)
          }}
          className="hover:bg-red-600 rounded p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // 橙色细条（≤30 天）
  if (daysLeft <= 30) {
    return (
      <div className="bg-orange-50 text-orange-700 px-4 py-1 text-xs flex items-center gap-2 border-b border-orange-200">
        <AlertTriangle className="w-3 h-3" />
        <span>剩余 {daysLeft} 天到期{tenantName ? `（${tenantName}）` : ''}</span>
      </div>
    )
  }

  // 普通灰色（>30 天）
  return (
    <div className="bg-gray-50 text-gray-500 px-4 py-1 text-xs border-b border-gray-200">
      剩余 {daysLeft} 天到期{tenantName ? `（${tenantName}）` : ''}
    </div>
  )
}

export default ExpiryBanner
