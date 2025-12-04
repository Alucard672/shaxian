import { NavLink, useNavigate } from 'react-router-dom'
import { useTabStore, getRouteTitle } from '@/store/tabStore'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Palette,
  BarChart3,
  CreditCard,
  Users,
  Printer,
  FileText,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/product', label: '商品管理', icon: Package },
  { path: '/purchase', label: '进货管理', icon: ShoppingCart },
  { path: '/sales', label: '销售管理', icon: DollarSign },
  { path: '/dyeing', label: '染色加工', icon: Palette },
  { path: '/inventory', label: '库存管理', icon: BarChart3 },
  { path: '/print', label: '打印管理', icon: Printer },
  { path: '/account/receivable', label: '账款管理', icon: CreditCard },
  { path: '/customer', label: '往来单位', icon: Users },
  { path: '/report', label: '统计报表', icon: FileText },
]

const settingsItem = {
  path: '/settings',
  label: '系统设置',
  icon: Settings,
}

function Sidebar() {
  const SettingsIcon = settingsItem.icon
  const navigate = useNavigate()
  const { addTab, setActiveTab } = useTabStore()

  // 处理菜单项点击
  const handleMenuClick = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    const title = getRouteTitle(path)
    addTab({
      key: path,
      path,
      title,
      closable: path !== '/',
    })
    setActiveTab(path)
    navigate(path)
  }

  return (
    <aside className="w-48 bg-white/80 border-r border-gray-200/60 h-full flex flex-col">
      {/* 主要导航区域 */}
      <nav className="px-2 pt-2 flex-1">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={(e) => handleMenuClick(item.path, e)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-2 h-9 rounded-lg text-sm font-medium transition-all duration-200 group',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0px_2px_4px_-2px_rgba(59,130,246,0.25),0px_4px_6px_-1px_rgba(59,130,246,0.25)]'
                        : 'text-gray-700 hover:bg-gray-50'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          'w-4 h-4 flex-shrink-0',
                          'transition-colors'
                        )} />
                        <span className="leading-[1.4]">{item.label}</span>
                      </div>
                      <ChevronRight className={cn(
                        'w-3 h-3 flex-shrink-0 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )} />
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 系统设置区域 - 底部带分隔线 */}
      <div className="pt-2 px-2 pb-2 border-t border-gray-200">
        <NavLink
          to={settingsItem.path}
          onClick={(e) => handleMenuClick(settingsItem.path, e)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-2 h-9 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0px_2px_4px_-2px_rgba(59,130,246,0.25),0px_4px_6px_-1px_rgba(59,130,246,0.25)]'
                : 'text-gray-700 hover:bg-gray-50'
            )
          }
        >
          <SettingsIcon className="w-4 h-4 flex-shrink-0" />
          <span className="leading-[1.4]">{settingsItem.label}</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar

