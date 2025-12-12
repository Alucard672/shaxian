import { create } from 'zustand'

export interface Tab {
  key: string
  path: string
  title: string
  closable?: boolean
}

interface TabStore {
  tabs: Tab[]
  activeTab: string | null
  addTab: (tab: Tab) => void
  setActiveTab: (key: string) => void
  closeTab: (key: string) => string | null
  closeOtherTabs: (key: string) => void
  closeAllTabs: () => void
}

// 路由标题映射
const routeTitleMap: Record<string, string> = {
  '/': '工作台',
  '/products': '商品管理',
  '/contacts': '往来单位',
  '/customer': '客户管理',
  '/supplier': '供应商管理',
  '/purchase': '进货管理',
  '/purchase/create': '新建进货单',
  '/sales': '销售管理',
  '/sales/create': '新建销售单',
  '/dyeing': '染色加工',
  '/dyeing/create': '新建加工单',
  '/inventory': '库存查询',
  '/inventory/adjustment': '库存调整',
  '/inventory/adjustment/create': '新建调整单',
  '/inventory/check': '库存盘点',
  '/inventory/check/create': '新建盘点单',
  '/account': '账款管理',
  '/account/receivable': '应收账款',
  '/account/payable': '应付账款',
  '/report': '统计报表',
  '/report/sales': '销售报表',
  '/report/purchase': '采购报表',
  '/report/profit': '利润报表',
  '/report/customer': '客户报表',
  '/report/inventory': '库存报表',
  '/report/fund': '资金报表',
  '/print': '打印管理',
  '/print/template/:id': '模板编辑',
  '/settings': '系统设置',
  '/settings/store': '门店信息',
  '/settings/employees': '员工管理',
  '/settings/roles': '角色管理',
  '/settings/custom-query': '自定义查询',
  '/settings/inventory-alert': '库存预警',
  '/settings/params': '系统参数',
  '/settings/tutorial': '使用教程',
  '/settings/clear-data': '数据清理',
  '/tenant': '租户管理',
  '/tenant/users': '租户用户管理',
  '/tenant/select': '选择租户',
}

// 根据路径获取标题
export function getRouteTitle(path: string): string {
  // 处理动态路由参数
  if (path.includes('/print/template/')) {
    return '模板编辑'
  }
  
  // 直接匹配
  if (routeTitleMap[path]) {
    return routeTitleMap[path]
  }
  
  // 如果没有匹配到，尝试从路径推断
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1]
    // 将路径转换为中文标题
    const titleMap: Record<string, string> = {
      'create': '新建',
      'edit': '编辑',
      'detail': '详情',
      'list': '列表',
    }
    
    if (titleMap[lastSegment]) {
      const parentPath = '/' + segments.slice(0, -1).join('/')
      const parentTitle = routeTitleMap[parentPath] || segments[0]
      return parentTitle + titleMap[lastSegment]
    }
  }
  
  // 默认返回路径的最后一段
  return segments.length > 0 ? segments[segments.length - 1] : '未知页面'
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [
    {
      key: '/',
      path: '/',
      title: '工作台',
      closable: false,
    },
  ],
  activeTab: '/',
  
  addTab: (tab) => {
    const { tabs } = get()
    // 检查标签页是否已存在
    const existingTab = tabs.find((t) => t.key === tab.key)
    if (!existingTab) {
      set({ tabs: [...tabs, tab], activeTab: tab.key })
    } else {
      // 如果已存在，只切换活动标签
      set({ activeTab: tab.key })
    }
  },
  
  setActiveTab: (key) => {
    set({ activeTab: key })
  },
  
  closeTab: (key) => {
    const { tabs, activeTab } = get()
    if (tabs.length <= 1) {
      return null // 至少保留一个标签页
    }
    
    const tabIndex = tabs.findIndex((t) => t.key === key)
    if (tabIndex === -1) {
      return activeTab
    }
    
    const newTabs = tabs.filter((t) => t.key !== key)
    let newActiveTab = activeTab
    
    // 如果关闭的是当前活动标签，切换到相邻的标签
    if (key === activeTab) {
      if (tabIndex > 0) {
        newActiveTab = tabs[tabIndex - 1].key
      } else {
        newActiveTab = tabs[tabIndex + 1].key
      }
    }
    
    set({ tabs: newTabs, activeTab: newActiveTab })
    return newActiveTab
  },
  
  closeOtherTabs: (key) => {
    const { tabs } = get()
    const tab = tabs.find((t) => t.key === key)
    if (tab) {
      set({ tabs: [tab], activeTab: key })
    }
  },
  
  closeAllTabs: () => {
    const { tabs } = get()
    const homeTab = tabs.find((t) => t.key === '/')
    if (homeTab) {
      set({ tabs: [homeTab], activeTab: '/' })
    } else {
      // 如果没有工作台标签，创建一个
      const newHomeTab: Tab = {
        key: '/',
        path: '/',
        title: '工作台',
        closable: false,
      }
      set({ tabs: [newHomeTab], activeTab: '/' })
    }
  },
}))
