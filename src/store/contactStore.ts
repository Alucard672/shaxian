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
import { initCustomers, initSuppliers } from './initData'

interface ContactState {
  customers: Customer[]
  suppliers: Supplier[]
  
  // 客户操作
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer
  updateCustomer: (id: string, data: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  getCustomer: (id: string) => Customer | undefined
  getCustomers: () => Customer[]
  
  // 供应商操作
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Supplier
  updateSupplier: (id: string, data: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  getSupplier: (id: string) => Supplier | undefined
  getSuppliers: () => Supplier[]
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据，如果为空则使用初始数据
const loadFromStorage = (key: string, initData: any) => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      const data = JSON.parse(item)
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
      if (Array.isArray(data) && data.length === 0) {
        const initialized = localStorage.getItem(`${key}_initialized`)
        if (initialized === 'true') {
          return data
        }
      }
    }
    localStorage.setItem(key, JSON.stringify(initData))
    localStorage.setItem(`${key}_initialized`, 'true')
    return initData
  } catch {
    return initData
  }
}

// 保存到localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const useContactStore = create<ContactState>((set, get) => ({
  customers: loadFromStorage('customers', initCustomers()),
  suppliers: loadFromStorage('suppliers', initSuppliers()),

  addCustomer: (data) => {
    const newCustomer: Customer = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const customers = [...state.customers, newCustomer]
      saveToStorage('customers', customers)
      return { customers }
    })
    
    return newCustomer
  },

  updateCustomer: (id, data) => {
    set((state) => {
      const customers = state.customers.map((c) =>
        c.id === id
          ? { ...c, ...data, updatedAt: new Date().toISOString() }
          : c
      )
      saveToStorage('customers', customers)
      return { customers }
    })
  },

  deleteCustomer: (id) => {
    set((state) => {
      const customers = state.customers.filter((c) => c.id !== id)
      saveToStorage('customers', customers)
      return { customers }
    })
  },

  getCustomer: (id) => {
    return get().customers.find((c) => c.id === id)
  },

  getCustomers: () => {
    return get().customers
  },

  addSupplier: (data) => {
    const newSupplier: Supplier = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const suppliers = [...state.suppliers, newSupplier]
      saveToStorage('suppliers', suppliers)
      return { suppliers }
    })
    
    return newSupplier
  },

  updateSupplier: (id, data) => {
    set((state) => {
      const suppliers = state.suppliers.map((s) =>
        s.id === id
          ? { ...s, ...data, updatedAt: new Date().toISOString() }
          : s
      )
      saveToStorage('suppliers', suppliers)
      return { suppliers }
    })
  },

  deleteSupplier: (id) => {
    set((state) => {
      const suppliers = state.suppliers.filter((s) => s.id !== id)
      saveToStorage('suppliers', suppliers)
      return { suppliers }
    })
  },

  getSupplier: (id) => {
    return get().suppliers.find((s) => s.id === id)
  },

  getSuppliers: () => {
    return get().suppliers
  },
}))






