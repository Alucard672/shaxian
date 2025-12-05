import { create } from 'zustand'
import {
  DyeingOrder,
  DyeingOrderFormData,
  DyeingOrderStatus,
  DyeingOrderItem,
} from '@/types/dyeing'
import { dyeingApi } from '@/api/client'
import { useProductStore } from './productStore'

interface DyeingState {
  orders: DyeingOrder[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadOrders: () => Promise<void>
  
  // 加工单操作
  addOrder: (data: DyeingOrderFormData) => Promise<DyeingOrder>
  updateOrder: (id: string, data: Partial<DyeingOrderFormData>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrder: (id: string) => DyeingOrder | undefined
  updateStatus: (id: string, status: DyeingOrderStatus) => Promise<void>
  stockIn: (id: string, stockLocation: string) => Promise<void> // 入库操作
  generateOrderNumber: () => string
}

export const useDyeingStore = create<DyeingState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有加工单
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await dyeingApi.getAll()
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load dyeing orders', loading: false })
      console.error('Failed to load dyeing orders:', error)
    }
  },

  generateOrderNumber: () => {
    // 单号由后端生成，这里返回一个临时值
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    return `JG${dateStr}000`
  },

  addOrder: async (data) => {
    try {
      const orderData = {
        ...data,
        operator: '当前用户', // TODO: 从用户状态获取
        status: '待发货',
      }
      
      const newOrder = await dyeingApi.create(orderData)
      
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      return newOrder
    } catch (error: any) {
      console.error('Failed to add dyeing order:', error)
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const updated = await dyeingApi.update(id, data)
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update dyeing order:', error)
      throw error
    }
  },

  deleteOrder: async (id) => {
    try {
      await dyeingApi.delete(id)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete dyeing order:', error)
      throw error
    }
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  updateStatus: async (id, status) => {
    try {
      const updated = await dyeingApi.update(id, { status })
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update dyeing order status:', error)
      throw error
    }
  },

  // 入库操作：创建批次并更新状态为已入库
  stockIn: async (id, stockLocation) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status !== '已完成') {
      alert('只能对已完成状态的加工单进行入库操作')
      return
    }
    
    try {
      const { addColor, addBatch, getColorsByProduct } = useProductStore.getState()

      // 为每个目标色号创建批次
      for (const item of order.items) {
        // 检查目标色号是否存在，如果不存在则创建
        let targetColor = getColorsByProduct(order.productId).find(c => c.id === item.targetColorId)
        if (!targetColor) {
          targetColor = await addColor(order.productId, {
            code: item.targetColorCode,
            name: item.targetColorName,
            colorValue: item.targetColorValue,
            status: '在售',
          })
        }

        // 为每个目标色号创建一个新的缸号
        await addBatch(targetColor.id, {
          code: `${order.greyBatchCode}-${item.targetColorCode}-${Date.now().toString(36).substring(0, 4)}`,
          productionDate: order.actualCompletionDate || new Date().toISOString().split('T')[0],
          supplierId: order.factoryId || '', // 加工厂作为供应商
          purchasePrice: order.processingPrice, // 加工单价作为采购价
          initialQuantity: item.quantity,
          stockLocation: stockLocation, // 使用传入的仓库位置
          remark: `由加工单 ${order.orderNumber} 染色加工`,
        })
      }
      
      // 更新订单状态为已入库
      await get().updateStatus(id, '已入库')
    } catch (error: any) {
      console.error('Failed to stock in dyeing order:', error)
      throw error
    }
  },
}))
