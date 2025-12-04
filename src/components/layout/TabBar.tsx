import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabStore, getRouteTitle } from '@/store/tabStore'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tabs, activeTab, addTab, setActiveTab, closeTab, closeOtherTabs, closeAllTabs } = useTabStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabKey: string } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // 当路由变化时，自动添加标签页
  useEffect(() => {
    const path = location.pathname
    // 移除 basename（如果有）
    const cleanPath = path.replace(/^\/shaxian/, '') || '/'
    const title = getRouteTitle(cleanPath)
    
    // 使用完整路径作为 key，确保每个页面都有唯一的标签页
    const key = cleanPath
    
    addTab({
      key,
      path: cleanPath,
      title,
      closable: cleanPath !== '/', // 工作台不可关闭
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

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, tab: typeof tabs[0]) => {
    e.preventDefault()
    e.stopPropagation()
    if (tab.closable !== false) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tabKey: tab.key,
      })
    }
  }

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(null)
  }

  // 处理右键菜单选项
  const handleContextMenuAction = (action: string, tabKey: string) => {
    closeContextMenu()
    const tab = tabs.find((t) => t.key === tabKey)
    if (!tab || tab.closable === false) return

    switch (action) {
      case 'close':
        const newActiveTab = closeTab(tabKey)
        if (newActiveTab !== null && newActiveTab !== undefined) {
          const targetTab = tabs.find((t) => t.key === newActiveTab)
          if (targetTab) {
            navigate(targetTab.path)
          }
        } else {
          navigate('/')
        }
        break
      case 'closeOthers':
        closeOtherTabs(tabKey)
        navigate(tab.path)
        break
      case 'closeAll':
        closeAllTabs()
        navigate('/')
        break
    }
  }

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu()
      }
    }

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [contextMenu])

  if (tabs.length <= 1) {
    return null // 只有一个标签页时不显示标签栏
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 flex items-center gap-1 px-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <div
              key={tab.key}
              onClick={() => handleTabClick(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab)}
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

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={() => handleContextMenuAction('close', contextMenu.tabKey)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            关闭标签
          </button>
          <button
            onClick={() => handleContextMenuAction('closeOthers', contextMenu.tabKey)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            关闭其他标签
          </button>
          <button
            onClick={() => handleContextMenuAction('closeAll', contextMenu.tabKey)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            关闭所有标签
          </button>
        </div>
      )}
    </>
  )
}

export default TabBar

