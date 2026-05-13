import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Building2, Menu } from 'lucide-react'
import { authApi } from '@/api/client'

interface UserInfo {
  id: string
  name: string
  phone?: string
  email?: string
  role?: string
  position?: string
}

function Header() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentTenantName, setCurrentTenantName] = useState<string>('')
  const [currentTenantId, setCurrentTenantId] = useState<string>('')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [currentDate, setCurrentDate] = useState<string>('')

  const applyFontSize = (size: 'small' | 'medium' | 'large') => {
    const px = size === 'small' ? 14 : size === 'large' ? 18 : 16
    document.documentElement.style.fontSize = `${px}px`
  }

  useEffect(() => {
    // 从localStorage加载用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    }

    // 加载当前租户信息
    const tenantId = localStorage.getItem('currentTenantId')
    const tenantName = localStorage.getItem('currentTenantName')
    if (tenantId) {
      setCurrentTenantId(tenantId)
    }
    if (tenantName) {
      setCurrentTenantName(tenantName)
    }

    const savedFontSize = localStorage.getItem('fontSize')
    if (savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large') {
      setFontSize(savedFontSize)
      applyFontSize(savedFontSize)
    } else {
      applyFontSize('medium')
    }

    const updateDate = () => {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const mi = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setCurrentDate(`${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`)
    }
    updateDate()
    const timer = setInterval(updateDate, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFontSizeChange = (value: 'small' | 'medium' | 'large') => {
    setFontSize(value)
    localStorage.setItem('fontSize', value)
    applyFontSize(value)
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.clear()
      sessionStorage.clear()
      navigate('/login')
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* 左侧：Logo和标题 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">织云 ERP</h1>
        </div>
      </div>

      {/* 右侧：用户信息和操作 */}
      <div className="flex items-center gap-4">
        {/* 字体大小 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>字体</span>
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value as 'small' | 'medium' | 'large')}
            className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>

        {/* 租户信息 */}
        {currentTenantId && (
          <div className="flex flex-col text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>租户: {currentTenantName || currentTenantId}</span>
            </div>
            <div className="text-xs text-gray-500">{currentDate || ''}</div>
          </div>
        )}

        {/* 用户菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-900">{user?.name || '用户'}</div>
              {user?.position && (
                <div className="text-xs text-gray-500">{user.position}</div>
              )}
            </div>
            <User className="w-4 h-4 text-gray-500" />
          </button>

          {/* 下拉菜单 */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {user && (
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    {user.phone && (
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    )}
                    {user.role && (
                      <div className="text-xs text-gray-500">角色: {user.role}</div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
