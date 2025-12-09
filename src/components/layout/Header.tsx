import { User, LogOut, Search, FileText, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

function Header() {
  const today = format(new Date(), 'yyyy年MM月dd日 EEEE')

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">纱</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">纱线进销存系统</span>
        </Link>

        {/* 搜索框 */}
        <div className="flex-1 max-w-md ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品、订单..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 设计文档 */}
        <Link
          to="#"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="设计文档"
        >
          <FileText className="w-5 h-5" />
        </Link>

        {/* 通知 */}
        <button
          className="relative text-gray-600 hover:text-gray-900 transition-colors"
          title="通知"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        {/* 用户信息 */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">管理员</div>
              <div className="text-xs text-gray-500">admin@example.com</div>
            </div>
          </div>
          <button
            onClick={() => {
              // 清空所有本地存储
              localStorage.clear()
              sessionStorage.clear()
              // 跳转到登录页
              window.location.href = '/shaxian/login'
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">退出</span>
          </button>
        </div>

        {/* 日期 */}
        <div className="text-sm text-gray-600 hidden lg:block">
          {today}
        </div>
      </div>
    </header>
  )
}

export default Header


