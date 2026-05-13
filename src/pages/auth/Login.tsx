import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'

function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 进入登录页时，读取上一次 401 的原因（顶号 / 到期 / 停用 / 普通过期）展示
  useEffect(() => {
    try {
      const reason = sessionStorage.getItem('logoutReason')
      if (reason) {
        setError(reason)
        sessionStorage.removeItem('logoutReason')
      }
    } catch {/* ignore */}
  }, [])

  const performLogin = useCallback(async (phoneValue: string, passwordValue: string) => {
    const { authApi } = await import('@/api/client')
    const loginPayload = { phone: phoneValue, password: passwordValue }
    // 不再自动注册：登录失败直接把后端错误抛给用户处理
    // 历史上有"用户不存在自动 register"逻辑，是 SaaS 平台漏洞，已删除
    return authApi.login(loginPayload)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const phoneValue = phone.trim()
    const passwordValue = password
    if (!phoneValue || !passwordValue) {
      setError('请输入手机号和密码')
      return
    }
    setLoading(true)
    try {
      const userData = await performLogin(phoneValue, passwordValue)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')
      const user = userData as any
      if (user?.tenantId != null) {
        localStorage.setItem('currentTenantId', String(user.tenantId))
        if (user.tenantName) localStorage.setItem('currentTenantName', user.tenantName)
        if (user.tenantCode) localStorage.setItem('currentTenantCode', user.tenantCode)
      }
      navigate('/')
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('用户不存在')) {
        setError('该手机号未注册，请先注册账号')
      } else if (msg.includes('租户已到期') || msg.includes('租户已停用')) {
        setError(msg + '，请联系平台运营')
      } else {
        setError(msg || '登录失败，请检查网络连接')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">沙县ERP系统</h1>
          <p className="text-gray-600">请输入您的账号信息登录</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 手机号输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入手机号"
                disabled={loading}
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入密码（默认：123456）"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">默认密码：123456</p>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">首次登录请使用默认密码：123456</p>
          <div className="flex justify-center items-center space-x-2">
            <span>还没有账号？</span>
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login


