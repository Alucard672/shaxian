import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

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
    return authApi.login({ phone: phoneValue, password: passwordValue })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const phoneValue = phone.trim()
    if (!phoneValue || !password) {
      setError('请输入手机号和密码')
      return
    }
    setLoading(true)
    try {
      const userData = await performLogin(phoneValue, password)
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
      if (msg.includes('用户不存在')) setError('该手机号未注册，请先注册账号')
      else if (msg.includes('租户已到期') || msg.includes('租户已停用')) setError(msg + '，请联系平台运营')
      else setError(msg || '登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500" />

      {/* 模糊光斑 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-cyan-400 opacity-50 blur-[80px] animate-float-slow" />
        <div className="absolute -bottom-24 -right-20 w-[380px] h-[380px] rounded-full bg-pink-400 opacity-50 blur-[80px] animate-float-mid" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-violet-400 opacity-45 blur-[80px] animate-float-fast" />
      </div>

      {/* 玻璃卡片 */}
      <div className="relative z-10 w-full max-w-md animate-card-in">
        <div className="bg-white/75 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl shadow-[0_20px_60px_rgba(30,30,70,0.25),0_4px_16px_rgba(30,30,70,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] border border-white/60 p-10">
          {/* 品牌 */}
          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-pink-500 text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-indigo-500/30">
              纱
            </div>
            <div>
              <div className="text-lg font-semibold text-indigo-950 tracking-tight">纱线通 ERP</div>
              <div className="text-[11px] text-indigo-600 font-mono tracking-widest mt-0.5">YARN ERP · 业务终端</div>
            </div>
          </div>

          {/* 标题 */}
          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-indigo-950 tracking-tight">欢迎回来</h1>
            <p className="text-sm text-gray-500 mt-1">登录进入您的工作台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50/80 backdrop-blur border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">手机号</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/60 border border-indigo-200/40 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 hover:bg-white/80"
                  placeholder="请输入手机号"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">密码</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-10 pr-11 rounded-xl bg-white/60 border border-indigo-200/40 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 hover:bg-white/80"
                  placeholder="请输入密码"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-pink-500 text-white text-[15px] font-semibold tracking-[4px] shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '登 录 进 入 系 统'}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-gray-200/50 flex justify-center items-center gap-2 text-xs text-gray-500">
            <span>还没有账号？</span>
            <Link to="/register" className="text-indigo-600 hover:text-pink-600 font-medium transition-colors">立即注册</Link>
          </div>

          <div className="mt-3 text-center text-[11px] text-gray-400 tracking-wide">
            © 2026 纱线通 · v2.4
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
