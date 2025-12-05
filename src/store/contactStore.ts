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
      set({ customers, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load customers', loading: false })
      console.error('Failed to load customers:', error)
    }
  },

  // 加载所有供应商
  loadSuppliers: async () => {
    try {
      const suppliers = await contactApi.getAllSuppliers()
      set((state) => ({ ...state, suppliers }))
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

  // 客户操作
  addCustomer: async (data) => {
    try {
      const newCustomer = await contactApi.createCustomer(data)
      set((state) => ({
        customers: [...state.customers, newCustomer]
      }))
      return newCustomer
    } catch (error: any) {
      console.error('Failed to add customer:', error)
      throw error
    }
  },

  updateCustomer: async (id, data) => {
    try {
      const updated = await contactApi.updateCustomer(id, data)
      set((state) => ({
        customers: state.customers.map((c) => c.id === id ? updated : c)
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
      const newSupplier = await contactApi.createSupplier(data)
      set((state) => ({
        suppliers: [...state.suppliers, newSupplier]
      }))
      return newSupplier
    } catch (error: any) {
      console.error('Failed to add supplier:', error)
      throw error
    }
  },

  updateSupplier: async (id, data) => {
    try {
      const updated = await contactApi.updateSupplier(id, data)
      set((state) => ({
        suppliers: state.suppliers.map((s) => s.id === id ? updated : s)
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
