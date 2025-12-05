import { create } from 'zustand'
import {
  AdjustmentOrder,
  AdjustmentOrderFormData,
  AdjustmentStatus,
  AdjustmentItem,
} from '@/types/adjustment'
import { inventoryApi } from '@/api/client'
import { useProductStore } from './productStore'

interface AdjustmentState {
  orders: AdjustmentOrder[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadOrders: () => Promise<void>
  
  // 调整单操作
  addOrder: (data: AdjustmentOrderFormData, status?: AdjustmentStatus) => Promise<AdjustmentOrder>
  updateOrder: (id: string, data: Partial<AdjustmentOrderFormData>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrder: (id: string) => AdjustmentOrder | undefined
  completeOrder: (id: string) => Promise<void> // 完成调整单
  generateOrderNumber: () => string
}

export const useAdjustmentStore = create<AdjustmentState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有调整单
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await inventoryApi.getAllAdjustments()
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load adjustment orders', loading: false })
      console.error('Failed to load adjustment orders:', error)
    }
  },

  generateOrderNumber: () => {
    // 单号由后端生成，这里返回一个临时值
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    return `TZ${dateStr}000`
  },

  addOrder: async (data, status = '草稿') => {
    try {
      const orderData = {
        ...data,
        operator: '管理员', // TODO: 从用户上下文获取
        status,
      }
      
      const newOrder = await inventoryApi.createAdjustment(orderData)
      
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      return newOrder
    } catch (error: any) {
      console.error('Failed to add adjustment order:', error)
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const updated = await inventoryApi.updateAdjustment(id, data)
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update adjustment order:', error)
      throw error
    }
  },

  deleteOrder: async (id) => {
    try {
      await inventoryApi.deleteAdjustment(id)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete adjustment order:', error)
      throw error
    }
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  // 完成调整单 - 更新库存
  completeOrder: async (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status === '已完成') return
    
    try {
      // 更新订单状态为已完成（后端会自动处理库存更新）
      await inventoryApi.updateAdjustment(id, { status: '已完成' })
      
      // 更新本地状态
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status: '已完成' as const, updatedAt: new Date().toISOString() } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to complete adjustment order:', error)
      throw error
    }
  },
}))
