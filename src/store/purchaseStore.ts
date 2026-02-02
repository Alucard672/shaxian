import { create } from 'zustand'
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderFormData,
  PurchaseOrderStatus,
} from '@/types/purchase'
import { purchaseApi } from '@/api/client'
import { useProductStore } from './productStore'
import { useAccountStore } from './accountStore'
import { mapPurchaseStatusToApi, mapPurchaseApiToZh } from '@/utils/orderStatusMap'

interface PurchaseState {
  orders: PurchaseOrder[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadOrders: () => Promise<void>
  
  // 进货单操作
  addOrder: (data: PurchaseOrderFormData, status?: PurchaseOrderStatus) => Promise<PurchaseOrder>
  updateOrder: (id: string, data: Partial<PurchaseOrderFormData & { status?: PurchaseOrderStatus }>) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  getOrder: (id: string) => PurchaseOrder | undefined
  cancelOrder: (id: string) => Promise<void> // 作废
  generateOrderNumber: () => string
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有进货单（接口返回 HTML/404 等时为 null，按空数组处理；status 统一为中文）
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const raw = await purchaseApi.getAll()
      const list = Array.isArray(raw) ? raw : []
      const orders = list.map((o: any) => ({
        ...o,
        status: mapPurchaseApiToZh(o.status ?? ''),
      }))
      set({ orders, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load purchase orders', loading: false })
      console.error('Failed to load purchase orders:', error)
    }
  },

  generateOrderNumber: () => {
    // 单号由后端生成，这里返回一个临时值
    // 实际单号会在创建订单时由后端返回
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    return `PO${dateStr}000`
  },

  addOrder: async (data, status = '草稿') => {
    try {
      const { addBatch } = useProductStore.getState()
      const { addAccountPayable } = useAccountStore.getState()
      
      // 准备提交数据（后端使用英文枚举 DRAFT/RECEIVED 等）
      const orderData = {
        ...data,
        operator: '当前用户', // TODO: 从用户状态获取
        status: mapPurchaseStatusToApi(status),
      }
      
      const created = await purchaseApi.create(orderData)
      const newOrder = {
        ...created,
        status: mapPurchaseApiToZh((created as any).status ?? '') || status,
      }

      // 如果不是草稿状态，自动执行入库操作
      if (status !== '草稿') {
        // 为每个明细创建缸号
        for (const item of data.items) {
          if (item.productId && item.colorId) {
            try {
              await addBatch(item.colorId, {
                code: item.batchCode,
                productionDate: item.productionDate || new Date().toISOString().split('T')[0],
                supplierId: data.supplierId,
                supplierName: data.supplierName,
                purchasePrice: item.price,
                initialQuantity: item.quantity,
                stockLocation: item.stockLocation,
                remark: item.remark,
              })
            } catch (error) {
              console.error('Failed to create batch:', error)
            }
          }
        }
        
        // 创建应付账款
        if (newOrder.unpaidAmount > 0) {
          try {
            await addAccountPayable({
              supplierId: data.supplierId,
              supplierName: data.supplierName,
              purchaseOrderId: newOrder.id,
              purchaseOrderNumber: newOrder.orderNumber,
              payableAmount: newOrder.totalAmount,
              paidAmount: data.paidAmount || 0,
              accountDate: data.purchaseDate,
            })
          } catch (error) {
            console.error('Failed to create account payable:', error)
          }
        }
      }
      
      set((state) => ({
        orders: [...state.orders, newOrder]
      }))
      
      return newOrder
    } catch (error: any) {
      console.error('Failed to add purchase order:', error)
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const payload = data.status != null
        ? { ...data, status: mapPurchaseStatusToApi(data.status) }
        : data
      const updated = await purchaseApi.update(id, payload)
      const normalized = {
        ...updated,
        status: mapPurchaseApiToZh((updated as any).status ?? '') ?? (updated as any).status,
      }
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? normalized : o))
      }))
    } catch (error: any) {
      console.error('Failed to update purchase order:', error)
      throw error
    }
  },

  deleteOrder: async (id) => {
    try {
      await purchaseApi.delete(id)
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete purchase order:', error)
      throw error
    }
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  cancelOrder: async (id) => {
    try {
      await purchaseApi.update(id, { status: mapPurchaseStatusToApi('已作废') })
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, status: '已作废' } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to cancel purchase order:', error)
      throw error
    }
  },
}))
