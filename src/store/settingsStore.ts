import { create } from 'zustand'
import { StoreInfo, Employee, InventoryAlertSettings, Role, CustomQuery, SystemInfo, SystemParams } from '@/types/settings'

interface SettingsState {
  // 门店信息
  storeInfo: StoreInfo
  updateStoreInfo: (info: Partial<StoreInfo>) => void
  
  // 员工管理
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Employee
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  getEmployee: (id: string) => Employee | undefined
  
  // 库存预警设置
  inventoryAlertSettings: InventoryAlertSettings
  updateInventoryAlertSettings: (settings: Partial<InventoryAlertSettings>) => void
  
  // 角色管理
  roles: Role[]
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Role
  updateRole: (id: string, role: Partial<Role>) => void
  deleteRole: (id: string) => void
  getRole: (id: string) => Role | undefined
  
  // 自定义查询
  customQueries: CustomQuery[]
  addCustomQuery: (query: Omit<CustomQuery, 'id' | 'createdAt' | 'updatedAt'>) => CustomQuery
  updateCustomQuery: (id: string, query: Partial<CustomQuery>) => void
  deleteCustomQuery: (id: string) => void
  getCustomQuery: (id: string) => CustomQuery | undefined
  
  // 系统参数设置
  systemParams: SystemParams
  updateSystemParams: (params: Partial<SystemParams>) => void
  
  // 系统信息
  systemInfo: SystemInfo
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item)
    }
  } catch {
    // ignore
  }
  return defaultValue
}

// 保存到localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// 初始值（移除硬编码，使用空值）
const defaultStoreInfo: StoreInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  fax: '',
  remark: '',
}

const defaultInventoryAlertSettings: InventoryAlertSettings = {
  enabled: false,
  threshold: 10, // 10%
  autoAlert: false,
}

const defaultSystemInfo: SystemInfo = {
  systemName: '织云ERP',
  version: 'v1.0.0',
  lastUpdate: '2025年12月1日',
}

const defaultSystemParams: SystemParams = {
  enableDyeingProcess: false, // 默认不启用染色加工流程
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // 门店信息
  storeInfo: loadFromStorage('storeInfo', defaultStoreInfo),
  updateStoreInfo: (info) => {
    const newStoreInfo = { ...get().storeInfo, ...info }
    set({ storeInfo: newStoreInfo })
    saveToStorage('storeInfo', newStoreInfo)
  },
  
  // 员工管理
  employees: loadFromStorage('employees', []),
  addEmployee: (employeeData) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const employees = [...get().employees, newEmployee]
    set({ employees })
    saveToStorage('employees', employees)
    return newEmployee
  },
  updateEmployee: (id, employeeData) => {
    const employees = get().employees.map((e) =>
      e.id === id ? { ...e, ...employeeData, updatedAt: new Date().toISOString() } : e
    )
    set({ employees })
    saveToStorage('employees', employees)
  },
  deleteEmployee: (id) => {
    const employees = get().employees.filter((e) => e.id !== id)
    set({ employees })
    saveToStorage('employees', employees)
  },
  getEmployee: (id) => {
    return get().employees.find((e) => e.id === id)
  },
  
  // 库存预警设置
  inventoryAlertSettings: loadFromStorage('inventoryAlertSettings', defaultInventoryAlertSettings),
  updateInventoryAlertSettings: (settings) => {
    const newSettings = { ...get().inventoryAlertSettings, ...settings }
    set({ inventoryAlertSettings: newSettings })
    saveToStorage('inventoryAlertSettings', newSettings)
  },
  
  // 角色管理
  roles: loadFromStorage('roles', []),
  addRole: (roleData) => {
    const newRole: Role = {
      ...roleData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const roles = [...get().roles, newRole]
    set({ roles })
    saveToStorage('roles', roles)
    return newRole
  },
  updateRole: (id, roleData) => {
    const roles = get().roles.map((r) =>
      r.id === id ? { ...r, ...roleData, updatedAt: new Date().toISOString() } : r
    )
    set({ roles })
    saveToStorage('roles', roles)
  },
  deleteRole: (id) => {
    const roles = get().roles.filter((r) => r.id !== id)
    set({ roles })
    saveToStorage('roles', roles)
  },
  getRole: (id) => {
    return get().roles.find((r) => r.id === id)
  },
  
  // 自定义查询
  customQueries: loadFromStorage('customQueries', []),
  addCustomQuery: (queryData) => {
    const newQuery: CustomQuery = {
      ...queryData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const customQueries = [...get().customQueries, newQuery]
    set({ customQueries })
    saveToStorage('customQueries', customQueries)
    return newQuery
  },
  updateCustomQuery: (id, queryData) => {
    const customQueries = get().customQueries.map((q) =>
      q.id === id ? { ...q, ...queryData, updatedAt: new Date().toISOString() } : q
    )
    set({ customQueries })
    saveToStorage('customQueries', customQueries)
  },
  deleteCustomQuery: (id) => {
    const customQueries = get().customQueries.filter((q) => q.id !== id)
    set({ customQueries })
    saveToStorage('customQueries', customQueries)
  },
  getCustomQuery: (id) => {
    return get().customQueries.find((q) => q.id === id)
  },
  
  // 系统参数设置
  systemParams: loadFromStorage('systemParams', defaultSystemParams),
  updateSystemParams: (params) => {
    const newParams = { ...get().systemParams, ...params }
    set({ systemParams: newParams })
    saveToStorage('systemParams', newParams)
  },
  
  // 系统信息
  systemInfo: defaultSystemInfo,
}))

