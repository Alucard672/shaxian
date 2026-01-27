import { create } from 'zustand'
import {
  Customer,
  Supplier,
  CustomerType,
  CustomerStatus,
  SupplierType,
  SupplierStatus,
  SettlementCycle,
} from '@/types/contact'
import { contactApi } from '@/api/client'

interface ContactState {
  customers: Customer[]
  suppliers: Supplier[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadCustomers: () => Promise<void>
  loadSuppliers: () => Promise<void>
  loadAll: () => Promise<void>
  
  // 映射函数
  mapCustomerTypeToApi: (type: string) => string
  mapCustomerTypeFromApi: (type: string) => string
  mapCustomerStatusToApi: (status: string) => string
  mapCustomerStatusFromApi: (status: string) => string
  mapSupplierTypeToApi: (type: string) => string
  mapSupplierTypeFromApi: (type: string) => string
  mapSupplierStatusToApi: (status: string) => string
  mapSupplierStatusFromApi: (status: string) => string
  mapSettlementCycleToApi: (cycle: string) => string
  mapSettlementCycleFromApi: (cycle: string) => string
  
  // 客户操作
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  getCustomer: (id: string) => Customer | undefined
  getCustomers: () => Customer[]
  
  // 供应商操作
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Supplier>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  getSupplier: (id: string) => Supplier | undefined
  getSuppliers: () => Supplier[]
}

export const useContactStore = create<ContactState>((set, get) => ({
  customers: [],
  suppliers: [],
  loading: false,
  error: null,

  // 加载所有客户
  loadCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const customers = await contactApi.getAllCustomers()
      // 映射后端枚举值到前端显示值
      const mappedCustomers = customers.map((c: any) => ({
        ...c,
        id: String(c.id),
        type: get().mapCustomerTypeFromApi(c.type || 'DIRECT'),
        status: get().mapCustomerStatusFromApi(c.status || 'NORMAL'),
      }))
      set({ customers: mappedCustomers, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load customers', loading: false })
      console.error('Failed to load customers:', error)
    }
  },

  // 加载所有供应商
  loadSuppliers: async () => {
    try {
      const suppliers = await contactApi.getAllSuppliers()
      // 映射后端枚举值到前端显示值
      const mappedSuppliers = suppliers.map((s: any) => ({
        ...s,
        id: String(s.id),
        type: get().mapSupplierTypeFromApi(s.type || 'MANUFACTURER'),
        status: get().mapSupplierStatusFromApi(s.status || 'ACTIVE'),
        settlementCycle: get().mapSettlementCycleFromApi(s.settlementCycle || 'CASH'),
      }))
      set((state) => ({ ...state, suppliers: mappedSuppliers }))
    } catch (error: any) {
      console.error('Failed to load suppliers:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load suppliers' }))
    }
  },

  // 加载所有数据
  loadAll: async () => {
    await get().loadCustomers()
    await get().loadSuppliers()
  },

  // 映射函数
  mapCustomerTypeToApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      '直客': 'DIRECT',
      '经销商': 'DEALER',
    }
    return typeMap[type] || type
  },

  mapCustomerTypeFromApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      'DIRECT': '直客',
      'DEALER': '经销商',
    }
    return typeMap[type] || type
  },

  mapCustomerStatusToApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      '正常': 'NORMAL',
      '停用': 'INACTIVE',
    }
    return statusMap[status] || status
  },

  mapCustomerStatusFromApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      'NORMAL': '正常',
      'INACTIVE': '停用',
      'FROZEN': '停用', // 兼容旧数据
    }
    return statusMap[status] || status
  },

  mapSupplierTypeToApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      '厂家': 'MANUFACTURER',
      '贸易商': 'TRADER',
    }
    return typeMap[type] || type
  },

  mapSupplierTypeFromApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      'MANUFACTURER': '厂家',
      'TRADER': '贸易商',
    }
    return typeMap[type] || type
  },

  mapSupplierStatusToApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      '合作中': 'ACTIVE',
      '已停用': 'INACTIVE',
    }
    return statusMap[status] || status
  },

  mapSupplierStatusFromApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      'ACTIVE': '合作中',
      'INACTIVE': '已停用',
    }
    return statusMap[status] || status
  },

  mapSettlementCycleToApi: (cycle: string): string => {
    const cycleMap: Record<string, string> = {
      '现结': 'CASH',
      '月结': 'MONTHLY',
      '季结': 'QUARTERLY',
    }
    return cycleMap[cycle] || cycle
  },

  mapSettlementCycleFromApi: (cycle: string): string => {
    const cycleMap: Record<string, string> = {
      'CASH': '现结',
      'MONTHLY': '月结',
      'QUARTERLY': '季结',
    }
    return cycleMap[cycle] || cycle
  },

  // 客户操作
  addCustomer: async (data) => {
    try {
      const apiData: any = {
        name: data.name,
        type: get().mapCustomerTypeToApi(data.type),
        status: get().mapCustomerStatusToApi(data.status),
      }
      if (data.code) apiData.code = data.code
      if (data.contactPerson) apiData.contactPerson = data.contactPerson
      if (data.phone) apiData.phone = data.phone
      if (data.address) apiData.address = data.address
      if (data.creditLimit !== undefined) apiData.creditLimit = data.creditLimit
      if (data.remark) apiData.remark = data.remark

      const newCustomer = await contactApi.createCustomer(apiData)
      // 映射返回的数据
      const mappedCustomer = {
        ...newCustomer,
        id: String(newCustomer.id),
        type: get().mapCustomerTypeFromApi(newCustomer.type || 'DIRECT'),
        status: get().mapCustomerStatusFromApi(newCustomer.status || 'NORMAL'),
      }
      set((state) => ({
        customers: [...state.customers, mappedCustomer]
      }))
      return mappedCustomer
    } catch (error: any) {
      console.error('Failed to add customer:', error)
      throw error
    }
  },

  updateCustomer: async (id, data) => {
    try {
      // 转换前端中文值为后端枚举值
      const apiData: any = {}
      if (data.name !== undefined) apiData.name = data.name
      if (data.code !== undefined) apiData.code = data.code
      if (data.type !== undefined) apiData.type = get().mapCustomerTypeToApi(data.type)
      if (data.status !== undefined) apiData.status = get().mapCustomerStatusToApi(data.status)
      if (data.contactPerson !== undefined) apiData.contactPerson = data.contactPerson
      if (data.phone !== undefined) apiData.phone = data.phone
      if (data.address !== undefined) apiData.address = data.address
      if (data.creditLimit !== undefined) apiData.creditLimit = data.creditLimit
      if (data.remark !== undefined) apiData.remark = data.remark

      const updated = await contactApi.updateCustomer(id, apiData)
      // 映射返回的数据
      const mappedCustomer = {
        ...updated,
        id: String(updated.id),
        type: get().mapCustomerTypeFromApi(updated.type || 'DIRECT'),
        status: get().mapCustomerStatusFromApi(updated.status || 'NORMAL'),
      }
      set((state) => ({
        customers: state.customers.map((c) => c.id === id ? mappedCustomer : c)
      }))
    } catch (error: any) {
      console.error('Failed to update customer:', error)
      throw error
    }
  },

  deleteCustomer: async (id) => {
    try {
      await contactApi.deleteCustomer(id)
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      throw error
    }
  },

  getCustomer: (id) => {
    return get().customers.find((c) => c.id === id)
  },

  getCustomers: () => {
    return get().customers
  },

  // 供应商操作
  addSupplier: async (data) => {
    try {
      const apiData: any = {
        name: data.name,
        type: get().mapSupplierTypeToApi(data.type),
        status: get().mapSupplierStatusToApi(data.status),
        settlementCycle: get().mapSettlementCycleToApi(data.settlementCycle),
      }
      if (data.code) apiData.code = data.code
      if (data.contactPerson) apiData.contactPerson = data.contactPerson
      if (data.phone) apiData.phone = data.phone
      if (data.address) apiData.address = data.address
      if (data.remark) apiData.remark = data.remark

      const newSupplier = await contactApi.createSupplier(apiData)
      // 映射返回的数据
      const mappedSupplier = {
        ...newSupplier,
        id: String(newSupplier.id),
        type: get().mapSupplierTypeFromApi(newSupplier.type || 'MANUFACTURER'),
        status: get().mapSupplierStatusFromApi(newSupplier.status || 'ACTIVE'),
        settlementCycle: get().mapSettlementCycleFromApi(newSupplier.settlementCycle || 'CASH'),
      }
      set((state) => ({
        suppliers: [...state.suppliers, mappedSupplier]
      }))
      return mappedSupplier
    } catch (error: any) {
      console.error('Failed to add supplier:', error)
      throw error
    }
  },

  updateSupplier: async (id, data) => {
    try {
      // 转换前端中文值为后端枚举值
      const apiData: any = {}
      if (data.name !== undefined) apiData.name = data.name
      if (data.code !== undefined) apiData.code = data.code
      if (data.type !== undefined) apiData.type = get().mapSupplierTypeToApi(data.type)
      if (data.status !== undefined) apiData.status = get().mapSupplierStatusToApi(data.status)
      if (data.settlementCycle !== undefined) apiData.settlementCycle = get().mapSettlementCycleToApi(data.settlementCycle)
      if (data.contactPerson !== undefined) apiData.contactPerson = data.contactPerson
      if (data.phone !== undefined) apiData.phone = data.phone
      if (data.address !== undefined) apiData.address = data.address
      if (data.remark !== undefined) apiData.remark = data.remark

      const updated = await contactApi.updateSupplier(id, apiData)
      // 映射返回的数据
      const mappedSupplier = {
        ...updated,
        id: String(updated.id),
        type: get().mapSupplierTypeFromApi(updated.type || 'MANUFACTURER'),
        status: get().mapSupplierStatusFromApi(updated.status || 'ACTIVE'),
        settlementCycle: get().mapSettlementCycleFromApi(updated.settlementCycle || 'CASH'),
      }
      set((state) => ({
        suppliers: state.suppliers.map((s) => s.id === id ? mappedSupplier : s)
      }))
    } catch (error: any) {
      console.error('Failed to update supplier:', error)
      throw error
    }
  },

  deleteSupplier: async (id) => {
    try {
      await contactApi.deleteSupplier(id)
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete supplier:', error)
      throw error
    }
  },

  getSupplier: (id) => {
    return get().suppliers.find((s) => s.id === id)
  },

  getSuppliers: () => {
    return get().suppliers
  },
}))
