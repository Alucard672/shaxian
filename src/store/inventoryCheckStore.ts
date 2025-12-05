import { create } from 'zustand'
import {
  InventoryCheckOrder,
  InventoryCheckOrderFormData,
  InventoryCheckStatus,
  InventoryCheckItem,
} from '@/types/inventoryCheck'
import { inventoryApi } from '@/api/client'
import { useProductStore } from './productStore'

interface InventoryCheckState {
  orders: InventoryCheckOrder[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadOrders: () => Promise<void>
  
  // 盘点单操作
  addOrder: (data: InventoryCheckOrderFormData) => Promise<InventoryCheckOrder>
  updateOrder: (id: string, data: Partial<InventoryCheckOrderFormData>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrder: (id: string) => InventoryCheckOrder | undefined
  updateStatus: (id: string, status: InventoryCheckStatus) => Promise<void>
  updateItemQuantity: (orderId: string, itemId: string, actualQuantity: number) => Promise<void>
  completeCheck: (id: string) => Promise<void> // 完成盘点,生成调整单
  generateOrderNumber: () => string
}

export const useInventoryCheckStore = create<InventoryCheckState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有盘点单
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await inventoryApi.getAllChecks()
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load inventory check orders', loading: false })
      console.error('Failed to load inventory check orders:', error)
    }
  },

  generateOrderNumber: () => {
    // 单号由后端生成，这里返回一个临时值
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    return `PD${dateStr}000`
  },

  addOrder: async (data) => {
    try {
      const orderData = {
        ...data,
        operator: '管理员', // TODO: 从用户上下文获取
        status: '计划中',
      }
      
      const newOrder = await inventoryApi.createCheck(orderData)
      
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      return newOrder
    } catch (error: any) {
      console.error('Failed to add inventory check order:', error)
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const updated = await inventoryApi.updateCheck(id, data)
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update inventory check order:', error)
      throw error
    }
  },

  deleteOrder: async (id) => {
    try {
      await inventoryApi.deleteCheck(id)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete inventory check order:', error)
      throw error
    }
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await inventoryApi.updateCheck(id, { status })
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update inventory check order status:', error)
      throw error
    }
  },

  // 更新盘点明细的实际数量
  updateItemQuantity: async (orderId, itemId, actualQuantity) => {
    try {
      const order = get().orders.find((o) => o.id === orderId)
      if (!order) return
      
      const item = order.items.find((i) => i.id === itemId)
      if (!item) return
      
      // 更新单个明细项
      const updatedItems = order.items.map((i) => {
        if (i.id !== itemId) return i
        const difference = actualQuantity - i.systemQuantity
        return {
          ...i,
          actualQuantity,
          difference,
        }
      })
      
      // 重新计算进度和盘盈盘亏
      const completed = updatedItems.filter((item) => item.actualQuantity !== undefined).length
      const surplus = updatedItems
        .filter((item) => item.difference && item.difference > 0)
        .reduce((sum, item) => sum + (item.difference || 0), 0)
      const deficit = updatedItems
        .filter((item) => item.difference && item.difference < 0)
        .reduce((sum, item) => sum + Math.abs(item.difference || 0), 0)
      
      // 如果所有明细都已完成,自动更新状态为盘点中或已完成
      let newStatus = order.status
      if (completed === updatedItems.length && order.status === '计划中') {
        newStatus = '盘点中'
      }
      
      // 更新订单
      await inventoryApi.updateCheck(orderId, {
        items: updatedItems,
        progress: {
          total: updatedItems.length,
          completed,
        },
        surplus,
        deficit,
        status: newStatus,
      })
      
      // 更新本地状态
      set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id !== orderId) return o
          return {
            ...o,
            items: updatedItems,
            progress: {
              total: updatedItems.length,
              completed,
            },
            surplus,
            deficit,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          }
        })
      }))
    } catch (error: any) {
      console.error('Failed to update item quantity:', error)
      throw error
    }
  },

  // 完成盘点 - 生成调整单
  completeCheck: async (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status === '已完成') return
    
    try {
      // 更新盘点单状态为已完成（后端会自动生成调整单）
      await inventoryApi.updateCheck(id, { status: '已完成' })
      
      // 更新本地状态
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status: '已完成' as const, updatedAt: new Date().toISOString() } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to complete inventory check:', error)
      throw error
    }
  },
}))
