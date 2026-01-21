import { create } from 'zustand'
import { StoreInfo, Employee, InventoryAlertSettings, Role, CustomQuery, SystemInfo, SystemParams } from '@/types/settings'
import { Unit } from '@/types/unit'
import { settingsApi } from '@/api/client'

interface SettingsState {
  // 门店信息
  storeInfo: StoreInfo
  loading: boolean
  error: string | null
  
  // 数据加载
  loadStoreInfo: () => Promise<void>
  loadEmployees: () => Promise<void>
  loadRoles: () => Promise<void>
  loadCustomQueries: () => Promise<void>
  loadInventoryAlert: () => Promise<void>
  loadSystemParams: () => Promise<void>
  loadAll: () => Promise<void>
  
  updateStoreInfo: (info: Partial<StoreInfo>) => Promise<void>
  
  // 员工管理
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Employee>
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  getEmployee: (id: string) => Employee | undefined
  
  // 库存预警设置
  inventoryAlertSettings: InventoryAlertSettings
  updateInventoryAlertSettings: (settings: Partial<InventoryAlertSettings>) => Promise<void>
  
  // 角色管理
  roles: Role[]
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>
  updateRole: (id: string, role: Partial<Role>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  getRole: (id: string) => Role | undefined
  
  // 自定义查询
  customQueries: CustomQuery[]
  addCustomQuery: (query: Omit<CustomQuery, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomQuery>
  updateCustomQuery: (id: string, query: Partial<CustomQuery>) => Promise<void>
  deleteCustomQuery: (id: string) => Promise<void>
  getCustomQuery: (id: string) => CustomQuery | undefined
  
  // 系统参数设置
  systemParams: SystemParams
  updateSystemParams: (params: Partial<SystemParams>) => Promise<void>
  
  // 单位管理
  units: Unit[]
  loadUnits: () => Promise<void>
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Unit>
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  getUnit: (id: string) => Unit | undefined
  
  // 系统信息
  systemInfo: SystemInfo
}

// 初始值
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
  storeInfo: defaultStoreInfo,
  employees: [],
  roles: [],
  customQueries: [],
  inventoryAlertSettings: defaultInventoryAlertSettings,
  systemParams: defaultSystemParams,
  systemInfo: defaultSystemInfo,
  units: [],
  loading: false,
  error: null,

  // 加载门店信息
  loadStoreInfo: async () => {
    try {
      const storeInfo = await settingsApi.getStoreInfo()
      set({ storeInfo })
    } catch (error: any) {
      console.error('Failed to load store info:', error)
      // 如果不存在，使用默认值
    }
  },

  // 加载员工
  loadEmployees: async () => {
    try {
      const employees = await settingsApi.getAllEmployees()
      set({ employees })
    } catch (error: any) {
      console.error('Failed to load employees:', error)
    }
  },

  // 加载角色
  loadRoles: async () => {
    try {
      const roles = await settingsApi.getAllRoles()
      set({ roles })
    } catch (error: any) {
      console.error('Failed to load roles:', error)
    }
  },

  // 加载自定义查询
  loadCustomQueries: async () => {
    try {
      const customQueries = await settingsApi.getAllQueries()
      set({ customQueries })
    } catch (error: any) {
      console.error('Failed to load custom queries:', error)
    }
  },

  // 加载库存预警设置
  loadInventoryAlert: async () => {
    try {
      const inventoryAlertSettings = await settingsApi.getInventoryAlert()
      set({ inventoryAlertSettings })
    } catch (error: any) {
      console.error('Failed to load inventory alert settings:', error)
    }
  },

  // 加载系统参数
  loadSystemParams: async () => {
    try {
      const systemParams = await settingsApi.getParams()
      set({ systemParams })
    } catch (error: any) {
      console.error('Failed to load system params:', error)
    }
  },

  // 加载所有数据
  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      await Promise.all([
        get().loadStoreInfo(),
        get().loadEmployees(),
        get().loadRoles(),
        get().loadCustomQueries(),
        get().loadInventoryAlert(),
        get().loadSystemParams(),
      ])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load settings', loading: false })
    }
  },

  updateStoreInfo: async (info) => {
    try {
      const updated = await settingsApi.updateStoreInfo(info)
      set({ storeInfo: updated })
    } catch (error: any) {
      console.error('Failed to update store info:', error)
      throw error
    }
  },
  
  // 员工管理
  addEmployee: async (employeeData) => {
    try {
      const newEmployee = await settingsApi.createEmployee(employeeData)
      set((state) => ({
        employees: [...state.employees, newEmployee]
      }))
      return newEmployee
    } catch (error: any) {
      console.error('Failed to add employee:', error)
      throw error
    }
  },
  
  updateEmployee: async (id, employeeData) => {
    try {
      const updated = await settingsApi.updateEmployee(id, employeeData)
      set((state) => ({
        employees: state.employees.map((e) => e.id === id ? updated : e)
      }))
    } catch (error: any) {
      console.error('Failed to update employee:', error)
      throw error
    }
  },
  
  deleteEmployee: async (id) => {
    try {
      await settingsApi.deleteEmployee(id)
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete employee:', error)
      throw error
    }
  },
  
  getEmployee: (id) => {
    return get().employees.find((e) => e.id === id)
  },
  
  // 库存预警设置
  updateInventoryAlertSettings: async (settings) => {
    try {
      const updated = await settingsApi.updateInventoryAlert(settings)
      set({ inventoryAlertSettings: updated })
    } catch (error: any) {
      console.error('Failed to update inventory alert settings:', error)
      throw error
    }
  },
  
  // 角色管理
  addRole: async (roleData) => {
    try {
      const newRole = await settingsApi.createRole(roleData)
      set((state) => ({
        roles: [...state.roles, newRole]
      }))
      return newRole
    } catch (error: any) {
      console.error('Failed to add role:', error)
      throw error
    }
  },
  
  updateRole: async (id, roleData) => {
    try {
      const updated = await settingsApi.updateRole(id, roleData)
      set((state) => ({
        roles: state.roles.map((r) => r.id === id ? updated : r)
      }))
    } catch (error: any) {
      console.error('Failed to update role:', error)
      throw error
    }
  },
  
  deleteRole: async (id) => {
    try {
      await settingsApi.deleteRole(id)
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete role:', error)
      throw error
    }
  },
  
  getRole: (id) => {
    return get().roles.find((r) => r.id === id)
  },
  
  // 自定义查询
  addCustomQuery: async (queryData) => {
    try {
      const newQuery = await settingsApi.createQuery(queryData)
      set((state) => ({
        customQueries: [...state.customQueries, newQuery]
      }))
      return newQuery
    } catch (error: any) {
      console.error('Failed to add custom query:', error)
      throw error
    }
  },
  
  updateCustomQuery: async (id, queryData) => {
    try {
      // 注意：后端可能没有单独的更新接口，需要确认
      set((state) => ({
        customQueries: state.customQueries.map((q) =>
          q.id === id ? { ...q, ...queryData, updatedAt: new Date().toISOString() } : q
        )
      }))
    } catch (error: any) {
      console.error('Failed to update custom query:', error)
      throw error
    }
  },
  
  deleteCustomQuery: async (id) => {
    try {
      set((state) => ({
        customQueries: state.customQueries.filter((q) => q.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete custom query:', error)
      throw error
    }
  },
  
  getCustomQuery: (id) => {
    return get().customQueries.find((q) => q.id === id)
  },
  
  // 系统参数设置
  updateSystemParams: async (params) => {
    try {
      const updated = await settingsApi.updateParams(params)
      set({ systemParams: updated })
    } catch (error: any) {
      console.error('Failed to update system params:', error)
      throw error
    }
  },
  
  // 单位管理
  loadUnits: async () => {
    try {
      // 注意：API文档中没有units接口，使用本地存储
      // 如果将来需要API支持，可以在这里添加
      const localUnits = localStorage.getItem('units')
      if (localUnits) {
        set({ units: JSON.parse(localUnits) })
      } else {
        // 初始化默认单位
        const defaultUnits: Unit[] = [
          {
            id: 'unit-001',
            name: 'kg',
            code: 'KG',
            category: '重量',
            sortOrder: 1,
            isEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'unit-002',
            name: 'g',
            code: 'G',
            category: '重量',
            sortOrder: 2,
            isEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'unit-003',
            name: 'ton',
            code: 'TON',
            category: '重量',
            sortOrder: 3,
            isEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'unit-004',
            name: '斤',
            code: 'JIN',
            category: '重量',
            sortOrder: 4,
            isEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'unit-005',
            name: '件',
            code: 'PIECE',
            category: '数量',
            sortOrder: 5,
            isEnabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
        set({ units: defaultUnits })
        localStorage.setItem('units', JSON.stringify(defaultUnits))
      }
    } catch (error: any) {
      console.error('Failed to load units:', error)
      // 如果出错，尝试使用本地存储的默认值
      const localUnits = localStorage.getItem('units')
      if (localUnits) {
        try {
          set({ units: JSON.parse(localUnits) })
        } catch (e) {
          // 如果本地存储的数据也损坏了，使用默认值
          set({ units: [] })
        }
      }
    }
  },
  
  addUnit: async (unitData) => {
    // 注意：API文档中没有units接口，直接使用本地存储
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      ...unitData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({
      units: [...state.units, newUnit]
    }))
    const { units } = get()
    localStorage.setItem('units', JSON.stringify(units))
    return newUnit
  },
  
  updateUnit: async (id, unitData) => {
    // 注意：API文档中没有units接口，直接使用本地存储
    set((state) => ({
      units: state.units.map((u) =>
        u.id === id ? { ...u, ...unitData, updatedAt: new Date().toISOString() } : u
      )
    }))
    const { units } = get()
    localStorage.setItem('units', JSON.stringify(units))
  },
  
  deleteUnit: async (id) => {
    // 注意：API文档中没有units接口，直接使用本地存储
    set((state) => ({
      units: state.units.filter((u) => u.id !== id)
    }))
    const { units } = get()
    localStorage.setItem('units', JSON.stringify(units))
  },
  
  getUnit: (id) => {
    return get().units.find((u) => u.id === id)
  },
}))
