import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Users,
  Printer,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/purchase', label: '进货管理', icon: Package },
  { path: '/sales', label: '销售管理', icon: ShoppingCart },
  { path: '/inventory', label: '库存管理', icon: BarChart3 },
  { path: '/account/receivable', label: '应收账款', icon: CreditCard },
  { path: '/account/payable', label: '应付账款', icon: CreditCard },
  { path: '/customer', label: '客户管理', icon: Users },
  { path: '/supplier', label: '供应商管理', icon: Users },
  { path: '/print', label: '打单管理', icon: Printer },
  { path: '/report', label: '统计报表', icon: FileText },
  { path: '/product', label: '商品管理', icon: Settings },
]

function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

