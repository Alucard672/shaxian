import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Phone, Lock, Eye, EyeOff, Loader2,
  ShieldCheck, BarChart3, Boxes, Wallet, ArrowRight,
} from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const reason = sessionStorage.getItem('logoutReason')
      if (reason) {
        setError(reason)
        sessionStorage.removeItem('logoutReason')
      }
    } catch { /* ignore */ }
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
      if (msg.includes('用户不存在')) setError('该手机号未注册，请联系平台运营开通账号')
      else if (msg.includes('租户已到期') || msg.includes('租户已停用')) setError(msg + '，请联系平台运营')
      else setError(msg || '登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* ─── 左侧品牌区（仅桌面） ─── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative overflow-hidden bg-slate-900 text-white">
        {/* 装饰背景：等距网格 + 微弱色块 */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-indigo-600 opacity-25 blur-3xl" />
        <div className="absolute -bottom-24 -right-12 w-[28rem] h-[28rem] rounded-full bg-blue-500 opacity-20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-slate-900 font-bold text-xl flex items-center justify-center">
              纺
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">纺云 ERP</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-[2px]">FANGYUN · SaaS</div>
            </div>
          </div>

          {/* 标语 */}
          <div>
            <div className="text-[11px] text-blue-300 font-mono tracking-[3px] mb-4">SINCE 2026</div>
            <h2 className="text-4xl xl:text-5xl font-semibold leading-[1.15] tracking-tight">
              一支纱<br />一本账
            </h2>
            <p className="mt-5 text-slate-300 text-[15px] leading-relaxed max-w-sm">
              从原料采购到客户回款，全流程在线协同，多租户安全隔离
            </p>

            {/* 功能点 */}
            <ul className="mt-10 space-y-3.5">
              <li className="flex items-center gap-3 text-[14px] text-slate-200">
                <Boxes className="w-4 h-4 text-blue-400 shrink-0" />
                实时库存 · 缸号粒度
              </li>
              <li className="flex items-center gap-3 text-[14px] text-slate-200">
                <Wallet className="w-4 h-4 text-blue-400 shrink-0" />
                应收应付一目了然
              </li>
              <li className="flex items-center gap-3 text-[14px] text-slate-200">
                <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                销售采购看板
              </li>
              <li className="flex items-center gap-3 text-[14px] text-slate-200">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                多租户隔离 · 数据加密
              </li>
            </ul>
          </div>

          {/* 底部 */}
          <div className="text-[11px] text-slate-500 tracking-wider">
            © 2026 纺云 ERP · v2.4 · ALL RIGHTS RESERVED
          </div>
        </div>
      </div>

      {/* ─── 右侧表单区 ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* 移动端 / 小屏品牌（≤lg） */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-xl flex items-center justify-center">
              纺
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900 tracking-tight">纺云 ERP</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-[2px]">FANGYUN · SaaS</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-[11px] text-slate-500 font-mono tracking-[2px] mb-2">SIGN IN</div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">登录您的账号</h1>
            <p className="text-sm text-slate-500 mt-2">输入您的手机号和密码继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-sm animate-shake">
                <span className="text-red-500 mt-0.5 leading-none">●</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={11}
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-white border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="请输入手机号"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-slate-700 mb-1.5 block">密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-lg bg-white border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  placeholder="请输入密码"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-lg bg-slate-900 text-white text-[14px] font-medium tracking-wide transition-all hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>登 录<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              未开通账号？请联系平台运营开通您的租户和登录账号。
            </p>
          </div>

          {/* 仅小屏底部展示 */}
          <div className="lg:hidden mt-8 text-center text-[11px] text-slate-400 tracking-wide">
            © 2026 纺云 ERP · v2.4
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
