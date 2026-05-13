import { create } from 'zustand'
import { getOperatorName } from './userStore'
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
      const orders = list.map((o: any) => {
        const paid = Number(o.paidAmount ?? 0)
        const total = Number(o.totalAmount ?? 0)
        const unpaid = Math.max(0, total - paid)
        return {
          ...o,
          status: mapPurchaseApiToZh(o.status ?? ''),
          paidAmount: paid,
          unpaidAmount: unpaid,
        }
      })
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
        operator: getOperatorName(),
        status: mapPurchaseStatusToApi(status),
      }
      
      const created = await purchaseApi.create(orderData)
      const totalAmount = Number((created as any).totalAmount) || (data.items || []).reduce((s: number, it: any) => s + (Number(it?.quantity) || 0) * (Number(it?.price ?? it?.unitPrice) || 0), 0)
      const normalizedPaid = Number((data as any).paidAmount ?? 0)
      const apiPaid = Number((created as any).paidAmount ?? 0)
      const paidAmount = apiPaid > 0 ? apiPaid : normalizedPaid
      const unpaidAmount = Math.max(0, totalAmount - paidAmount)
      const newOrder = {
        ...created,
        status: mapPurchaseApiToZh((created as any).status ?? '') || status,
        paidAmount,
        unpaidAmount,
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
      const current = get().orders.find((o) => String(o.id) === String(id))
      const isDraft = current?.status === '草稿'
      const nextStatus = data.status ?? current?.status
      const payload = data.status != null
        ? { ...data, status: mapPurchaseStatusToApi(data.status) }
        : data
      const updated = await purchaseApi.update(id, payload)
      const normalized = {
        ...updated,
        status: mapPurchaseApiToZh((updated as any).status ?? '') ?? (updated as any).status,
      }
      // 草稿 -> 已入库时执行入库与应付
      if (isDraft && current && nextStatus === '已入库') {
        const { addBatch } = useProductStore.getState()
        const { addAccountPayable } = useAccountStore.getState()
        const items = (data as any).items || current.items || []
        for (const item of items) {
          if (item.productId && item.colorId) {
            await addBatch(item.colorId, {
              code: item.batchCode,
              productionDate: item.productionDate || new Date().toISOString().split('T')[0],
              supplierId: (data as any).supplierId ?? current.supplierId,
              supplierName: (data as any).supplierName ?? current.supplierName,
              purchasePrice: item.price,
              initialQuantity: item.quantity,
              stockLocation: item.stockLocation,
              remark: item.remark,
            })
          }
        }
        const total = Number((data as any).totalAmount ?? current.totalAmount ?? 0)
        const paid = Number((data as any).paidAmount ?? current.paidAmount ?? 0)
        const unpaid = Math.max(0, total - paid)
        if (unpaid > 0) {
          await addAccountPayable({
            supplierId: (data as any).supplierId ?? current.supplierId,
            supplierName: (data as any).supplierName ?? current.supplierName,
            purchaseOrderId: current.id,
            purchaseOrderNumber: current.orderNumber,
            payableAmount: total,
            paidAmount: paid,
            accountDate: (data as any).purchaseDate ?? current.purchaseDate,
          })
        }
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
      const order = get().orders.find((o) => String(o.id) === String(id))
      if (!order) throw new Error('订单不存在')
      const { batches, updateBatchStock, loadBatches } = useProductStore.getState()
      // 作废时还原库存：已入库订单曾增加库存，需扣减
      if (order.status === '已入库' || order.status === '已审核') {
        for (const item of order.items || []) {
          const qty = Number(item.quantity) || 0
          if (qty <= 0) continue
          const batchId = (item as any).batchId
          let batch: { id: string } | undefined
          if (batchId) {
            batch = batches.find((b) => String(b.id) === String(batchId))
          }
          if (!batch && item.colorId) {
            try {
              await loadBatches(String(item.colorId))
            } catch (e) {
              // ignore: fallback to local search below
            }
          }
          if (!batch && item.colorId && item.batchCode) {
            batch = batches.find(
              (b) =>
                String(b.colorId) === String(item.colorId) &&
                String(b.code || (b as any).batchCode || '') === String(item.batchCode)
            )
          }
          if (!batch && item.colorId && item.batchCode) {
            const refreshed = useProductStore.getState().batches
            batch = refreshed.find(
              (b) =>
                String(b.colorId) === String(item.colorId) &&
                String(b.code || (b as any).batchCode || '') === String(item.batchCode)
            )
          }
          if (!batch) {
            throw new Error(`未找到缸号，无法回滚库存：${item.productName || ''} ${item.batchCode || ''}`)
          }
          if (batch) {
            try {
              await updateBatchStock(batch.id, -qty)
            } catch (e: any) {
              console.error('还原库存失败:', e)
              throw new Error(`还原库存失败：${item.productName || ''} ${item.batchCode || ''}，${e?.message || '请检查缸号是否存在'}`)
            }
          }
        }
      }
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
