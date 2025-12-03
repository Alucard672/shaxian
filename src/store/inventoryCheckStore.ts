import { create } from 'zustand'
import {
  InventoryCheckOrder,
  InventoryCheckOrderFormData,
  InventoryCheckStatus,
  InventoryCheckItem,
} from '@/types/inventoryCheck'
import { useProductStore } from './productStore'
import { initInventoryCheckOrders } from './initData'

interface InventoryCheckState {
  orders: InventoryCheckOrder[]
  
  // 盘点单操作
  addOrder: (data: InventoryCheckOrderFormData) => InventoryCheckOrder
  updateOrder: (id: string, data: Partial<InventoryCheckOrderFormData>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => InventoryCheckOrder | undefined
  updateStatus: (id: string, status: InventoryCheckStatus) => void
  updateItemQuantity: (orderId: string, itemId: string, actualQuantity: number) => void
  completeCheck: (id: string) => void // 完成盘点,生成调整单
  generateOrderNumber: () => string
}

// 生成唯一ID
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成盘点单号
const generateOrderNumber = (existingNumbers: string[]): string => {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  let num = 1
  let orderNumber = `PD${dateStr}${String(num).padStart(3, '0')}`
  
  while (existingNumbers.includes(orderNumber)) {
    num++
    orderNumber = `PD${dateStr}${String(num).padStart(3, '0')}`
  }
  
  return orderNumber
}

const loadFromStorage = (key: string, initData: any) => {
  try {
    const stored = localStorage.getItem(key)
    const initialized = localStorage.getItem(`${key}_initialized`)
    
    if (stored && initialized === 'true') {
      return JSON.parse(stored)
    }
    
    localStorage.setItem(key, JSON.stringify(initData))
    localStorage.setItem(`${key}_initialized`, 'true')
    return initData
  } catch {
    return initData
  }
}

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const useInventoryCheckStore = create<InventoryCheckState>((set, get) => ({
  orders: loadFromStorage('inventoryCheckOrders', initInventoryCheckOrders()),

  generateOrderNumber: () => {
    const existingNumbers = get().orders.map((o) => o.orderNumber)
    return generateOrderNumber(existingNumbers)
  },

  addOrder: (data) => {
    const orderNumber = get().generateOrderNumber()
    
    // 为每个明细生成ID并计算系统库存
    const { batches } = useProductStore.getState()
    const items: InventoryCheckItem[] = data.items.map((item) => {
      const batch = batches.find((b) => b.id === item.batchId)
      return {
        id: generateId(),
        ...item,
        systemQuantity: batch?.stockQuantity || 0,
      }
    })
    
    const newOrder: InventoryCheckOrder = {
      id: generateId(),
      orderNumber,
      name: data.name,
      warehouse: data.warehouse,
      planDate: data.planDate,
      items,
      progress: {
        total: items.length,
        completed: 0,
      },
      surplus: 0,
      deficit: 0,
      status: '计划中',
      operator: '管理员', // TODO: 从用户上下文获取
      remark: data.remark,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const orders = [...state.orders, newOrder]
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
    
    return newOrder
  },

  updateOrder: (id, data) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        let items = order.items
        
        if (data.items) {
          const { batches } = useProductStore.getState()
          items = data.items.map((item) => {
            const existingItem = order.items.find((i) => i.batchId === item.batchId)
            const batch = batches.find((b) => b.id === item.batchId)
            return {
              id: existingItem?.id || generateId(),
              ...item,
              systemQuantity: batch?.stockQuantity || existingItem?.systemQuantity || 0,
              actualQuantity: existingItem?.actualQuantity,
              difference: existingItem?.difference,
            }
          })
        }
        
        // 重新计算进度和盘盈盘亏
        const completed = items.filter((item) => item.actualQuantity !== undefined).length
        const surplus = items
          .filter((item) => item.difference && item.difference > 0)
          .reduce((sum, item) => sum + (item.difference || 0), 0)
        const deficit = items
          .filter((item) => item.difference && item.difference < 0)
          .reduce((sum, item) => sum + Math.abs(item.difference || 0), 0)
        
        return {
          ...order,
          ...data,
          items,
          progress: {
            total: items.length,
            completed,
          },
          surplus,
          deficit,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
  },

  deleteOrder: (id) => {
    set((state) => {
      const orders = state.orders.filter((o) => o.id !== id)
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  updateStatus: (id, status) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        return {
          ...order,
          status,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
  },

  // 更新盘点明细的实际数量
  updateItemQuantity: (orderId, itemId, actualQuantity) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== orderId) return order
        
        const items = order.items.map((item) => {
          if (item.id !== itemId) return item
          
          const difference = actualQuantity - item.systemQuantity
          
          return {
            ...item,
            actualQuantity,
            difference,
          }
        })
        
        // 重新计算进度和盘盈盘亏
        const completed = items.filter((item) => item.actualQuantity !== undefined).length
        const surplus = items
          .filter((item) => item.difference && item.difference > 0)
          .reduce((sum, item) => sum + (item.difference || 0), 0)
        const deficit = items
          .filter((item) => item.difference && item.difference < 0)
          .reduce((sum, item) => sum + Math.abs(item.difference || 0), 0)
        
        // 如果所有明细都已完成,自动更新状态为盘点中或已完成
        let newStatus = order.status
        if (completed === items.length && order.status === '计划中') {
          newStatus = '盘点中'
        }
        
        return {
          ...order,
          items,
          progress: {
            total: items.length,
            completed,
          },
          surplus,
          deficit,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
  },

  // 完成盘点 - 生成调整单
  completeCheck: (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status === '已完成') return
    
    // 更新盘点单状态为已完成
    // 注意: 生成调整单的逻辑应该在组件中调用,避免循环依赖
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已完成', updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('inventoryCheckOrders', orders)
      return { orders }
    })
  },
}))

