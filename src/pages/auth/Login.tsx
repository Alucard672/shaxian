import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, LogIn } from 'lucide-react'
import Button from '@/components/ui/Button'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      alert('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      // 简单的登录逻辑（实际项目中应该调用后端API）
      // 这里为了演示，直接允许登录
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('username', username)
      
      // 延迟一下，模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      navigate('/')
    } catch (error) {
      console.error('登录失败:', error)
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1618354691373-d851c5c3a990?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 深色遮罩层，确保文字可读性 */}
      <div 
        className="absolute inset-0 bg-black/40"
      />

      {/* 渐变遮罩，增强视觉效果 */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/90 backdrop-blur-sm rounded-xl mb-4 shadow-xl border border-white/20">
            <span className="text-blue-600 text-2xl font-bold">纱</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">纱线进销存系统</h1>
          <p className="text-white/90 text-sm drop-shadow-md">请输入您的账号信息登录</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                '登录中...'
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  登录
                </>
              )}
            </Button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              提示：当前为演示版本，任意用户名和密码均可登录
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

