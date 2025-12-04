import { create } from 'zustand'
import {
  AccountReceivable,
  AccountPayable,
  ReceiptRecord,
  PaymentRecord,
  AccountStatus,
  PaymentMethod,
} from '@/types/account'
// 移除硬编码数据，使用空数组作为初始值

interface AccountState {
  receivables: AccountReceivable[]
  payables: AccountPayable[]
  receipts: ReceiptRecord[]
  payments: PaymentRecord[]
  
  // 应收账款操作
  addAccountReceivable: (data: {
    customerId: string
    customerName: string
    salesOrderId: string
    salesOrderNumber: string
    receivableAmount: number
    receivedAmount: number
    accountDate: string
  }) => AccountReceivable
  getReceivablesByCustomer: (customerId: string) => AccountReceivable[]
  
  // 收款记录操作
  addReceipt: (data: {
    accountReceivableId: string
    amount: number
    paymentMethod: PaymentMethod
    receiptDate: string
    operator: string
    remark?: string
  }) => ReceiptRecord
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
  }) => AccountPayable
  getPayablesBySupplier: (supplierId: string) => AccountPayable[]
  
  // 付款记录操作
  addPayment: (data: {
    accountPayableId: string
    amount: number
    paymentMethod: PaymentMethod
    paymentDate: string
    operator: string
    remark?: string
  }) => PaymentRecord
  getPaymentsByAccount: (accountPayableId: string) => PaymentRecord[]
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据，不再自动初始化硬编码数据
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item)
    }
    // 如果没有数据，返回默认值（空数组），不自动写入
    return defaultValue
  } catch {
    return defaultValue
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

export const useAccountStore = create<AccountState>((set, get) => ({
  receivables: loadFromStorage('accountReceivables', []),
  payables: loadFromStorage('accountPayables', []),
  receipts: loadFromStorage('receiptRecords', []),
  payments: loadFromStorage('paymentRecords', []),

  addAccountReceivable: (data) => {
    const newReceivable: AccountReceivable = {
      id: generateId(),
      ...data,
      unpaidAmount: data.receivableAmount - data.receivedAmount,
      status: data.receivedAmount >= data.receivableAmount ? '已结清' : '未结清',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const receivables = [...state.receivables, newReceivable]
      saveToStorage('accountReceivables', receivables)
      return { receivables }
    })
    
    return newReceivable
  },

  getReceivablesByCustomer: (customerId) => {
    return get().receivables.filter((r) => r.customerId === customerId)
  },

  addReceipt: (data) => {
    const newReceipt: ReceiptRecord = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    }
    
    set((state) => {
      const receipts = [...state.receipts, newReceipt]
      saveToStorage('receiptRecords', receipts)
      
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
      
      saveToStorage('accountReceivables', receivables)
      
      return { receipts, receivables } as Partial<AccountState>
    })
    
    return newReceipt
  },

  getReceiptsByAccount: (accountReceivableId) => {
    return get().receipts.filter((r) => r.accountReceivableId === accountReceivableId)
  },

  addAccountPayable: (data) => {
    const newPayable: AccountPayable = {
      id: generateId(),
      ...data,
      unpaidAmount: data.payableAmount - data.paidAmount,
      status: data.paidAmount >= data.payableAmount ? '已结清' : '未结清',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const payables = [...state.payables, newPayable]
      saveToStorage('accountPayables', payables)
      return { payables }
    })
    
    return newPayable
  },

  getPayablesBySupplier: (supplierId) => {
    return get().payables.filter((p) => p.supplierId === supplierId)
  },

  addPayment: (data) => {
    const newPayment: PaymentRecord = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    }
    
    set((state) => {
      const payments = [...state.payments, newPayment]
      saveToStorage('paymentRecords', payments)
      
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
      
      saveToStorage('accountPayables', payables)
      
      return { payments, payables } as Partial<AccountState>
    })
    
    return newPayment
  },

  getPaymentsByAccount: (accountPayableId) => {
    return get().payments.filter((p) => p.accountPayableId === accountPayableId)
  },
}))






