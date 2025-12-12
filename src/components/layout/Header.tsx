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
  const [currentTenant, setCurrentTenant] = useState<string>('')

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
    if (tenantId) {
      setCurrentTenant(tenantId)
    }
  }, [])

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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* 左侧：Logo和标题 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">沙县ERP系统</h1>
        </div>
      </div>

      {/* 右侧：用户信息和操作 */}
      <div className="flex items-center gap-4">
        {/* 租户信息 */}
        {currentTenant && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>租户: {currentTenant}</span>
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
