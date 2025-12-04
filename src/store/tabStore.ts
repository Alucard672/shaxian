import { create } from 'zustand'

export interface Tab {
  key: string // 唯一标识，通常是路径
  path: string // 路由路径
  title: string // 标签页标题
  closable?: boolean // 是否可关闭，默认 true
}

interface TabState {
  tabs: Tab[]
  activeTab: string | null // 当前激活的标签页 key
  addTab: (tab: Tab) => void
  removeTab: (key: string) => string | null
  setActiveTab: (key: string) => void
  closeTab: (key: string) => string | null
  closeOtherTabs: (key: string) => void
  closeAllTabs: () => void
}

// 路由路径到标题的映射
const routeTitleMap: Record<string, string> = {
  '/': '工作台',
  '/product': '商品管理',
  '/purchase': '进货管理',
  '/purchase/create': '新增进货单',
  '/sales': '销售管理',
  '/sales/create': '新增销售单',
  '/dyeing': '染色加工',
  '/dyeing/create': '新增加工单',
  '/inventory': '库存管理',
  '/inventory/adjustment': '库存调整',
  '/inventory/adjustment/create': '新增调整单',
  '/inventory/check': '盘点单',
  '/inventory/check/create': '新增盘点单',
  '/account/receivable': '账款管理',
  '/account/payable': '账款管理',
  '/customer': '往来单位',
  '/supplier': '往来单位',
  '/contact/customer/create': '新增客户',
  '/contact/supplier/create': '新增供应商',
  '/print': '打印管理',
  '/print/template/create': '新增模板',
  '/report': '统计报表',
  '/report/sales': '销售报表',
  '/report/purchase': '采购报表',
  '/report/inventory': '库存报表',
  '/report/profit': '利润报表',
  '/report/customer': '客户报表',
  '/report/fund': '资金报表',
  '/settings': '系统设置',
}

// 获取路由标题
const getRouteTitle = (path: string): string => {
  // 处理动态路由
  if (path.includes('/edit')) {
    if (path.includes('/purchase')) return '编辑进货单'
    if (path.includes('/sales')) return '编辑销售单'
    if (path.includes('/dyeing')) return '编辑加工单'
    if (path.includes('/adjustment')) return '编辑调整单'
    if (path.includes('/check')) return '编辑盘点单'
    if (path.includes('/template')) return '编辑模板'
    if (path.includes('/contact')) return '编辑往来单位'
  }
  
  // 处理带参数的路由
  const basePath = path.split('/').slice(0, -1).join('/') || '/'
  if (routeTitleMap[basePath]) {
    return routeTitleMap[basePath]
  }
  
  return routeTitleMap[path] || '未知页面'
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [{ key: '/', path: '/', title: '工作台', closable: false }], // 默认打开工作台
  activeTab: '/',
  
  addTab: (tab: Tab) => {
    const { tabs } = get()
    // 检查标签页是否已存在
    const existingTab = tabs.find((t) => t.key === tab.key)
    if (existingTab) {
      // 如果已存在，激活它
      set({ activeTab: tab.key })
      return
    }
    
    // 添加新标签页
    const newTabs = [...tabs, tab]
    set({ tabs: newTabs, activeTab: tab.key })
  },
  
  removeTab: (key: string) => {
    const { tabs, activeTab } = get()
    const newTabs = tabs.filter((t) => t.key !== key)
    
    // 如果关闭的是当前激活的标签页，需要激活另一个标签页
    let newActiveTab = activeTab
    if (key === activeTab) {
      const currentIndex = tabs.findIndex((t) => t.key === key)
      if (currentIndex > 0) {
        newActiveTab = tabs[currentIndex - 1].key
      } else if (newTabs.length > 0) {
        newActiveTab = newTabs[0].key
      } else {
        newActiveTab = null
      }
    }
    
    set({ tabs: newTabs, activeTab: newActiveTab })
    return newActiveTab
  },
  
  setActiveTab: (key: string) => {
    set({ activeTab: key })
  },
  
  closeTab: (key: string): string | null => {
    const { tabs } = get()
    const tab = tabs.find((t) => t.key === key)
    if (tab && tab.closable !== false) {
      return get().removeTab(key)
    }
    return null
  },
  
  closeOtherTabs: (key: string) => {
    const { tabs } = get()
    const newTabs = tabs.filter((t) => t.key === key || t.closable === false)
    set({ tabs: newTabs, activeTab: key })
  },
  
  closeAllTabs: () => {
    const { tabs } = get()
    const homeTab = tabs.find((t) => t.key === '/')
    if (homeTab) {
      set({ tabs: [homeTab], activeTab: '/' })
    } else {
      set({ tabs: [], activeTab: null })
    }
  },
}))

// 导出工具函数
export { getRouteTitle }

