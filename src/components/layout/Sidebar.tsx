import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Palette,
  Warehouse,
  Receipt,
  BarChart3,
  Printer,
  Settings,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'products',
    label: '商品管理',
    icon: Package,
    path: '/products',
  },
  {
    id: 'contacts',
    label: '往来单位',
    icon: Users,
    path: '/contacts',
    children: [
      { id: 'contacts-all', label: '全部', icon: Users, path: '/contacts' },
      { id: 'customer', label: '客户管理', icon: Users, path: '/customer' },
      { id: 'supplier', label: '供应商管理', icon: Users, path: '/supplier' },
    ],
  },
  {
    id: 'purchase',
    label: '进货管理',
    icon: ShoppingCart,
    path: '/purchase',
  },
  {
    id: 'sales',
    label: '销售管理',
    icon: DollarSign,
    path: '/sales',
  },
  {
    id: 'dyeing',
    label: '染色加工',
    icon: Palette,
    path: '/dyeing',
  },
  {
    id: 'inventory',
    label: '库存管理',
    icon: Warehouse,
    path: '/inventory',
  },
  {
    id: 'account',
    label: '账款管理',
    icon: Receipt,
    path: '/account',
  },
  {
    id: 'report',
    label: '统计报表',
    icon: BarChart3,
    path: '/report',
  },
  {
    id: 'print',
    label: '打印管理',
    icon: Printer,
    path: '/print',
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: Settings,
    path: '/settings',
  },
  {
    id: 'tenant',
    label: '租户管理',
    icon: Building2,
    path: '/tenant',
  },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const isActive = (path: string) => {
    const currentPath = location.pathname.replace(/^\/shaxian/, '') || '/'
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }
      return newSet
    })
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toggleMenu(item.id)
    } else {
      navigate(item.path)
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedMenus.has(item.id)
            const active = isActive(item.path)

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  )}
                </button>

                {/* 子菜单 */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon
                      const childActive = isActive(child.path)
                      return (
                        <button
                          key={child.id}
                          onClick={() => navigate(child.path)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                            childActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span>{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
