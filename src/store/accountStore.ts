import { create } from 'zustand'
import {
  AccountReceivable,
  AccountPayable,
  ReceiptRecord,
  PaymentRecord,
  AccountStatus,
  PaymentMethod,
} from '@/types/account'
import { accountApi } from '@/api/client'

interface AccountState {
  receivables: AccountReceivable[]
  payables: AccountPayable[]
  receipts: ReceiptRecord[]
  payments: PaymentRecord[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadReceivables: () => Promise<void>
  loadPayables: () => Promise<void>
  loadReceipts: () => Promise<void>
  loadPayments: () => Promise<void>
  loadAll: () => Promise<void>
  
  // 应收账款操作
  addAccountReceivable: (data: {
    customerId: string
    customerName: string
    salesOrderId: string
    salesOrderNumber: string
    receivableAmount: number
    receivedAmount: number
    accountDate: string
  }) => Promise<AccountReceivable>
  getReceivablesByCustomer: (customerId: string) => AccountReceivable[]
  
  // 收款记录操作
  addReceipt: (data: {
    accountReceivableId: string
    amount: number
    paymentMethod: PaymentMethod
    receiptDate: string
    operator: string
    remark?: string
  }) => Promise<ReceiptRecord>
  getReceiptsByAccount: (accountReceivableId: string) => ReceiptRecord[]
  
  // 应付账款操作
  addAccountPayable: (data: {
    supplierId: string
    supplierName: string
    purchaseOrderId: string
    purchaseOrderNumber: string
    payableAmount: number
    paidAmount: number
    accountDate: string
  }) => Promise<AccountPayable>
  getPayablesBySupplier: (supplierId: string) => AccountPayable[]
  
  // 付款记录操作
  addPayment: (data: {
    accountPayableId: string
    amount: number
    paymentMethod: PaymentMethod
    paymentDate: string
    operator: string
    remark?: string
  }) => Promise<PaymentRecord>
  getPaymentsByAccount: (accountPayableId: string) => PaymentRecord[]
}

export const useAccountStore = create<AccountState>((set, get) => ({
  receivables: [],
  payables: [],
  receipts: [],
  payments: [],
  loading: false,
  error: null,

  // 加载所有应收账款
  loadReceivables: async () => {
    try {
      const receivables = await accountApi.getAllReceivables()
      set((state) => ({ ...state, receivables }))
    } catch (error: any) {
      console.error('Failed to load receivables:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load receivables' }))
    }
  },

  // 加载所有应付账款
  loadPayables: async () => {
    try {
      const payables = await accountApi.getAllPayables()
      set((state) => ({ ...state, payables }))
    } catch (error: any) {
      console.error('Failed to load payables:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load payables' }))
    }
  },

  // 加载所有收款记录
  loadReceipts: async () => {
    try {
      const receipts = await accountApi.getAllReceipts()
      set((state) => ({ ...state, receipts }))
    } catch (error: any) {
      console.error('Failed to load receipts:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load receipts' }))
    }
  },

  // 加载所有付款记录
  loadPayments: async () => {
    try {
      const payments = await accountApi.getAllPayments()
      set((state) => ({ ...state, payments }))
    } catch (error: any) {
      console.error('Failed to load payments:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load payments' }))
    }
  },

  // 加载所有数据
  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      await Promise.all([
        get().loadReceivables(),
        get().loadPayables(),
        get().loadReceipts(),
        get().loadPayments(),
      ])
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load account data', loading: false })
    }
  },

  // 应收账款操作
  addAccountReceivable: async (data) => {
    try {
      const newReceivable = await accountApi.createReceivable(data)
      set((state) => ({
        receivables: [...state.receivables, newReceivable]
      }))
      return newReceivable
    } catch (error: any) {
      console.error('Failed to add account receivable:', error)
      throw error
    }
  },

  getReceivablesByCustomer: (customerId) => {
    return get().receivables.filter((r) => r.customerId === customerId)
  },

  // 收款记录操作
  addReceipt: async (data) => {
    try {
      const newReceipt = await accountApi.createReceipt(data.accountReceivableId, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        receiptDate: data.receiptDate,
        operator: data.operator,
        remark: data.remark,
      })
      
      // 更新本地状态
      set((state) => {
        const receipts = [...state.receipts, newReceipt]
        
        // 更新应收账款
        const receivables = state.receivables.map((r) => {
          if (r.id !== data.accountReceivableId) return r
          
          const newReceivedAmount = r.receivedAmount + data.amount
          const newUnpaidAmount = r.receivableAmount - newReceivedAmount
          
          return {
            ...r,
            receivedAmount: newReceivedAmount,
            unpaidAmount: newUnpaidAmount,
            status: newUnpaidAmount <= 0 ? '已结清' : '未结清',
            updatedAt: new Date().toISOString(),
          }
        })
        
        return { receipts, receivables }
      })
      
      return newReceipt
    } catch (error: any) {
      console.error('Failed to add receipt:', error)
      throw error
    }
  },

  getReceiptsByAccount: (accountReceivableId) => {
    return get().receipts.filter((r) => r.accountReceivableId === accountReceivableId)
  },

  // 应付账款操作
  addAccountPayable: async (data) => {
    try {
      const newPayable = await accountApi.createPayable(data)
      set((state) => ({
        payables: [...state.payables, newPayable]
      }))
      return newPayable
    } catch (error: any) {
      console.error('Failed to add account payable:', error)
      throw error
    }
  },

  getPayablesBySupplier: (supplierId) => {
    return get().payables.filter((p) => p.supplierId === supplierId)
  },

  // 付款记录操作
  addPayment: async (data) => {
    try {
      const newPayment = await accountApi.createPayment(data.accountPayableId, {
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        operator: data.operator,
        remark: data.remark,
      })
      
      // 更新本地状态
      set((state) => {
        const payments = [...state.payments, newPayment]
        
        // 更新应付账款
        const payables = state.payables.map((p) => {
          if (p.id !== data.accountPayableId) return p
          
          const newPaidAmount = p.paidAmount + data.amount
          const newUnpaidAmount = p.payableAmount - newPaidAmount
          
          return {
            ...p,
            paidAmount: newPaidAmount,
            unpaidAmount: newUnpaidAmount,
            status: newUnpaidAmount <= 0 ? '已结清' : '未结清',
            updatedAt: new Date().toISOString(),
          }
        })
        
        return { payments, payables }
      })
      
      return newPayment
    } catch (error: any) {
      console.error('Failed to add payment:', error)
      throw error
    }
  },

  getPaymentsByAccount: (accountPayableId) => {
    return get().payments.filter((p) => p.accountPayableId === accountPayableId)
  },
}))
