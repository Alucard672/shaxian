import { User, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          纱线进销存系统
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-5 h-5" />
          <span className="text-sm">管理员</span>
        </div>
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">退出</span>
        </button>
      </div>
    </header>
  )
}

export default Header


