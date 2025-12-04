import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabStore, getRouteTitle } from '@/store/tabStore'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tabs, activeTab, addTab, setActiveTab, closeTab } = useTabStore()

  // 当路由变化时，自动添加标签页
  useEffect(() => {
    const path = location.pathname
    const title = getRouteTitle(path)
    
    // 处理动态路由的 key（如 /purchase/123/edit）
    let key = path
    if (path.includes('/edit') || path.includes('/create')) {
      // 对于编辑和创建页面，使用完整路径作为 key，以便区分不同的编辑页面
      key = path
    }
    
    addTab({
      key,
      path,
      title,
      closable: path !== '/', // 工作台不可关闭
    })
  }, [location.pathname, addTab])

  // 切换标签页
  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveTab(tab.key)
    navigate(tab.path)
  }

  // 关闭标签页
  const handleCloseTab = (e: React.MouseEvent, tab: typeof tabs[0]) => {
    e.stopPropagation()
    if (tab.closable !== false) {
      const newActiveTab = closeTab(tab.key)
      if (newActiveTab !== null && newActiveTab !== undefined) {
        const targetTab = tabs.find((t) => t.key === newActiveTab)
        if (targetTab) {
          navigate(targetTab.path)
        }
      } else {
        // 如果没有其他标签页，导航到工作台
        navigate('/')
      }
    }
  }

  if (tabs.length <= 1) {
    return null // 只有一个标签页时不显示标签栏
  }

  return (
    <div className="bg-white border-b border-gray-200 flex items-center gap-1 px-2 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <div
            key={tab.key}
            onClick={() => handleTabClick(tab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-t-lg cursor-pointer transition-colors min-w-fit',
              isActive
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <span className="text-xs font-medium whitespace-nowrap">{tab.title}</span>
            {tab.closable !== false && (
              <button
                onClick={(e) => handleCloseTab(e, tab)}
                className={cn(
                  'w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 transition-colors',
                  isActive ? 'hover:bg-blue-100' : ''
                )}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TabBar

