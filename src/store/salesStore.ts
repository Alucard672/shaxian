import { create } from 'zustand'
import {
  SalesOrder,
  SalesOrderItem,
  SalesOrderFormData,
  SalesOrderStatus,
} from '@/types/sales'
import { salesApi } from '@/api/client'
import { useProductStore } from './productStore'
import { useAccountStore } from './accountStore'

interface SalesState {
  orders: SalesOrder[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadOrders: () => Promise<void>
  
  // 销售单操作
  addOrder: (data: SalesOrderFormData, status?: SalesOrderStatus) => Promise<SalesOrder>
  updateOrder: (id: string, data: Partial<SalesOrderFormData>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrder: (id: string) => SalesOrder | undefined
  cancelOrder: (id: string) => Promise<void> // 作废
  generateOrderNumber: () => string
  checkStock: (batchId: string, quantity: number) => Promise<boolean> // 检查库存
}

export const useSalesStore = create<SalesState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有销售单
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await salesApi.getAll()
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load sales orders', loading: false })
      console.error('Failed to load sales orders:', error)
    }
  },

  generateOrderNumber: () => {
    // 单号由后端生成，这里返回一个临时值
    // 实际单号会在创建订单时由后端返回
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    return `SO${dateStr}000`
  },

  checkStock: async (batchId, quantity) => {
    try {
      const result = await salesApi.checkStock(batchId, quantity)
      return result.available
    } catch (error: any) {
      console.error('Failed to check stock:', error)
      return false
    }
  },

  addOrder: async (data, status = '草稿') => {
    try {
      const { updateBatchStock } = useProductStore.getState()
      const { addAccountReceivable } = useAccountStore.getState()
      
      // 准备提交数据
      const orderData = {
        ...data,
        operator: '当前用户', // TODO: 从用户状态获取
        status: status,
      }
      
      const newOrder = await salesApi.create(orderData)
      
      // 如果不是草稿状态，自动执行出库操作
      if (status !== '草稿') {
        // 减少库存
        for (const item of data.items) {
          try {
            await updateBatchStock(item.batchId, -item.quantity)
          } catch (error) {
            console.error('Failed to update batch stock:', error)
          }
        }
        
        // 创建应收账款
        if (newOrder.unpaidAmount > 0) {
          try {
            await addAccountReceivable({
              customerId: data.customerId,
              customerName: data.customerName,
              salesOrderId: newOrder.id,
              salesOrderNumber: newOrder.orderNumber,
              receivableAmount: newOrder.totalAmount,
              receivedAmount: data.receivedAmount || 0,
              accountDate: data.salesDate,
            })
          } catch (error) {
            console.error('Failed to create account receivable:', error)
          }
        }
      }
      
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      return newOrder
    } catch (error: any) {
      console.error('Failed to add sales order:', error)
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const updated = await salesApi.update(id, data)
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? updated : o)
      }))
    } catch (error: any) {
      console.error('Failed to update sales order:', error)
      throw error
    }
  },

  deleteOrder: async (id) => {
    try {
      await salesApi.delete(id)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete sales order:', error)
      throw error
    }
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  cancelOrder: async (id) => {
    try {
      await salesApi.update(id, { status: '已作废' })
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status: '已作废' } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to cancel sales order:', error)
      throw error
    }
  },
}))
