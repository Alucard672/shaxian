import { create } from 'zustand'
import {
  AdjustmentOrder,
  AdjustmentOrderFormData,
  AdjustmentStatus,
  AdjustmentItem,
} from '@/types/adjustment'
import { useProductStore } from './productStore'

interface AdjustmentState {
  orders: AdjustmentOrder[]
  
  // 调整单操作
  addOrder: (data: AdjustmentOrderFormData, status?: AdjustmentStatus) => AdjustmentOrder
  updateOrder: (id: string, data: Partial<AdjustmentOrderFormData>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => AdjustmentOrder | undefined
  completeOrder: (id: string) => void // 完成调整单
  generateOrderNumber: () => string
}

// 生成唯一ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成调整单号
const generateOrderNumber = (existingNumbers: string[]): string => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  let num = 1
  let orderNumber = `TZ${dateStr}${String(num).padStart(3, '0')}`
  
  while (existingNumbers.includes(orderNumber)) {
    num++
    orderNumber = `TZ${dateStr}${String(num).padStart(3, '0')}`
  }
  
  return orderNumber
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

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const useAdjustmentStore = create<AdjustmentState>((set, get) => ({
  orders: loadFromStorage('adjustmentOrders', []),

  generateOrderNumber: () => {
    const existingNumbers = get().orders.map((o) => o.orderNumber)
    return generateOrderNumber(existingNumbers)
  },

  addOrder: (data, status = '草稿') => {
    const orderNumber = get().generateOrderNumber()
    
    // 为每个明细生成ID
    const items: AdjustmentItem[] = data.items.map((item) => ({
      id: generateId(),
      ...item,
    }))
    
    // 计算调整总量（所有数量的绝对值之和）
    const totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
    
    const newOrder: AdjustmentOrder = {
      id: generateId(),
      orderNumber,
      type: data.type,
      adjustmentDate: data.adjustmentDate,
      items,
      totalQuantity,
      status,
      operator: '管理员', // TODO: 从用户上下文获取
      remark: data.remark,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const orders = [...state.orders, newOrder]
      saveToStorage('adjustmentOrders', orders)
      return { orders }
    })
    
    return newOrder
  },

  updateOrder: (id, data) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        let items = order.items
        let totalQuantity = order.totalQuantity
        
        if (data.items) {
          items = data.items.map((item) => ({
            id: generateId(),
            ...item,
          }))
          totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0)
        }
        
        return {
          ...order,
          ...data,
          items,
          totalQuantity,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('adjustmentOrders', orders)
      return { orders }
    })
  },

  deleteOrder: (id) => {
    set((state) => {
      const orders = state.orders.filter((o) => o.id !== id)
      saveToStorage('adjustmentOrders', orders)
      return { orders }
    })
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  // 完成调整单 - 更新库存
  completeOrder: (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status === '已完成') return
    
    const { updateBatchStock } = useProductStore.getState()
    
    // 根据调整类型更新库存
    order.items.forEach((item) => {
      // quantity 正数表示增加,负数表示减少
      const currentBatch = useProductStore.getState().batches.find((b) => b.id === item.batchId)
      if (currentBatch) {
        const newQuantity = currentBatch.stockQuantity + item.quantity
        updateBatchStock(item.batchId, newQuantity)
      }
    })
    
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已完成' as const, updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('adjustmentOrders', orders)
      return { ...state, orders }
    })
  },
}))

