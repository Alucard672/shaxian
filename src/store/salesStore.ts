import { create } from 'zustand'
import {
  SalesOrder,
  SalesOrderItem,
  SalesOrderFormData,
  SalesOrderStatus,
} from '@/types/sales'
import { useProductStore } from './productStore'
import { useAccountStore } from './accountStore'
// 移除硬编码数据，使用空数组作为初始值

interface SalesState {
  orders: SalesOrder[]
  
  // 销售单操作
  addOrder: (data: SalesOrderFormData, status?: SalesOrderStatus) => SalesOrder
  updateOrder: (id: string, data: Partial<SalesOrderFormData>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => SalesOrder | undefined
  cancelOrder: (id: string) => void // 作废
  generateOrderNumber: () => string
  checkStock: (batchId: string, quantity: number) => boolean // 检查库存
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成销售单号：SO + 年月日 + 3位序号
const generateOrderNumber = (existingNumbers: string[]): string => {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  const prefix = `SO${dateStr}`
  const sameDayNumbers = existingNumbers.filter(n => n.startsWith(prefix))
  const sequence = String((sameDayNumbers.length + 1)).padStart(3, '0')
  
  return `${prefix}${sequence}`
}

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

export const useSalesStore = create<SalesState>((set, get) => ({
  orders: loadFromStorage('salesOrders', []),

  generateOrderNumber: () => {
    const existingNumbers = get().orders.map(o => o.orderNumber)
    return generateOrderNumber(existingNumbers)
  },

  checkStock: (batchId, quantity) => {
    const batches = useProductStore.getState().batches
    const batch = batches.find((b) => b.id === batchId)
    return batch ? batch.stockQuantity >= quantity : false
  },

  addOrder: (data, status = '已出库') => {
    const orderNumber = get().generateOrderNumber()
    
    // 计算明细金额和总金额
    const items: SalesOrderItem[] = data.items.map((item) => ({
      id: generateId(),
      ...item,
      amount: item.quantity * item.price,
    }))
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    const unpaidAmount = totalAmount - (data.receivedAmount || 0)
    
    const newOrder: SalesOrder = {
      id: generateId(),
      orderNumber,
      ...data,
      items,
      totalAmount,
      unpaidAmount,
      status: status,
      operator: '当前用户', // TODO: 从用户状态获取
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // 如果不是草稿状态，自动执行出库操作
    if (status !== '草稿') {
      const { updateBatchStock } = useProductStore.getState()
      const { addAccountReceivable } = useAccountStore.getState()
      
      // 为每个明细减少库存
      items.forEach((item) => {
        const batches = useProductStore.getState().batches
        const batch = batches.find((b) => b.id === item.batchId)
        
        if (batch) {
          const newQuantity = batch.stockQuantity - item.quantity
          if (newQuantity >= 0) {
            updateBatchStock(batch.id, newQuantity)
          }
        }
      })
      
      // 如果有欠款，生成应收账款
      if (unpaidAmount > 0) {
        addAccountReceivable({
          customerId: data.customerId,
          customerName: data.customerName,
          salesOrderId: newOrder.id,
          salesOrderNumber: orderNumber,
          receivableAmount: totalAmount,
          receivedAmount: data.receivedAmount || 0,
          accountDate: data.salesDate,
        })
      }
    }
    
    set((state) => {
      const orders = [...state.orders, newOrder]
      saveToStorage('salesOrders', orders)
      return { orders }
    })
    
    return newOrder
  },

  updateOrder: (id, data) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        // 如果更新了明细，重新计算金额
        let items = order.items
        let totalAmount = order.totalAmount
        let unpaidAmount = order.unpaidAmount
        
        if (data.items) {
          items = data.items.map((item) => ({
            id: generateId(),
            ...item,
            amount: item.quantity * item.price,
          }))
          totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
          unpaidAmount = totalAmount - (data.receivedAmount ?? order.receivedAmount)
        } else if (data.receivedAmount !== undefined) {
          unpaidAmount = order.totalAmount - data.receivedAmount
        }
        
        return {
          ...order,
          ...data,
          items,
          totalAmount,
          unpaidAmount,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('salesOrders', orders)
      return { orders }
    })
  },

  deleteOrder: (id) => {
    set((state) => {
      const orders = state.orders.filter((o) => o.id !== id)
      saveToStorage('salesOrders', orders)
      return { orders }
    })
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },


  // 作废订单
  cancelOrder: (id) => {
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已作废' as const, updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('salesOrders', orders)
      return { ...state, orders }
    })
  },
}))


