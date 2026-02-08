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
import { useSalesStore } from './salesStore'

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

  // 加载所有应收账款（接口返回 HTML/404 等时为 null，按空数组处理）
  loadReceivables: async () => {
    try {
      const raw = await accountApi.getAllReceivables()
      const receivables = Array.isArray(raw) ? raw : []
      set((state) => ({ ...state, receivables }))
    } catch (error: any) {
      console.error('Failed to load receivables:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load receivables' }))
    }
  },

  // 加载所有应付账款（接口返回 HTML/404 等时为 null，按空数组处理）
  loadPayables: async () => {
    try {
      const raw = await accountApi.getAllPayables()
      const payables = Array.isArray(raw) ? raw : []
      set((state) => ({ ...state, payables }))
    } catch (error: any) {
      console.error('Failed to load payables:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load payables' }))
    }
  },

  // 加载所有收款记录（接口返回 HTML/404 等时为 null，按空数组处理）
  loadReceipts: async () => {
    try {
      const raw = await accountApi.getAllReceipts()
      const receipts = Array.isArray(raw) ? raw : []
      set((state) => ({ ...state, receipts }))
    } catch (error: any) {
      console.error('Failed to load receipts:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load receipts' }))
    }
  },

  // 加载所有付款记录（接口返回 HTML/404 等时为 null，按空数组处理）
  loadPayments: async () => {
    try {
      const raw = await accountApi.getAllPayments()
      const payments = Array.isArray(raw) ? raw : []
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
          const clampedUnpaidAmount = Math.max(0, newUnpaidAmount)
          
          return {
            ...r,
            receivedAmount: newReceivedAmount,
            unpaidAmount: clampedUnpaidAmount,
            status: (clampedUnpaidAmount <= 0 ? '已结清' : '未结清') as AccountStatus,
            updatedAt: new Date().toISOString(),
          }
        })
        
        return { receipts, receivables }
      })

      // 同步更新销售单的收款/欠款（若存在关联）
      try {
        const receivable = get().receivables.find((r) => r.id === data.accountReceivableId)
        const salesOrderId = (receivable as any)?.salesOrderId
        if (salesOrderId) {
          const salesStore = useSalesStore
          salesStore.setState((s) => ({
            orders: s.orders.map((o: any) => {
              if (String(o.id) !== String(salesOrderId)) return o
              const newPaid = Number(o.paidAmount || 0) + Number(data.amount || 0)
              const total = Number(o.totalAmount || 0)
              return {
                ...o,
                paidAmount: newPaid,
                receivedAmount: newPaid,
                unpaidAmount: Math.max(0, total - newPaid),
              }
            }),
          }))
        }
      } catch {
        // ignore sync errors
      }
      
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
          const clampedUnpaidAmount = Math.max(0, newUnpaidAmount)
          
          return {
            ...p,
            paidAmount: newPaidAmount,
            unpaidAmount: clampedUnpaidAmount,
            status: (clampedUnpaidAmount <= 0 ? '已结清' : '未结清') as AccountStatus,
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
