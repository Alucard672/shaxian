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
import { mapSalesStatusToApi, mapSalesApiToZh } from '@/utils/orderStatusMap'

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
  revertOutbound: (id: string) => Promise<void> // 撤销出库：恢复库存、状态改为草稿，便于修改明细
  generateOrderNumber: () => string
  checkStock: (batchId: string, quantity: number) => Promise<boolean> // 检查库存
}

export const useSalesStore = create<SalesState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  // 加载所有销售单（接口返回 HTML/404 等时为 null，按空数组处理；status 统一为中文）
  loadOrders: async () => {
    set({ loading: true, error: null })
    try {
      const raw = await salesApi.getAll()
      const list = Array.isArray(raw) ? raw : []
      const orders = list.map((o: any) => {
        const received = Number(o.receivedAmount ?? o.paidAmount ?? 0)
        const total = Number(o.totalAmount ?? 0)
        const unpaid = Math.max(0, total - received)
        return {
          ...o,
          status: mapSalesApiToZh(o.status ?? ''),
          receivedAmount: received,
          paidAmount: received,
          unpaidAmount: o.unpaidAmount != null ? Number(o.unpaidAmount) : unpaid,
        }
      })
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
      
      // 准备提交数据（兼容后端字段命名 & 必填要求）
      // - 后端常用字段：receivedAmount、unitPrice、deliveryDate
      const normalizedReceivedAmount =
        (data as any).receivedAmount ?? (data as any).paidAmount ?? 0
      const normalizedPaidAmount =
        (data as any).paidAmount ?? (data as any).receivedAmount ?? 0

      const normalizedItems = (data.items || []).map((it: any, idx: number) => {
        // 前端兜底校验（后端只会返回“必填信息不能为空”很难定位）
        if (!it?.productId) throw new Error(`商品明细第 ${idx + 1} 行：商品不能为空`)
        if (!it?.colorId) throw new Error(`商品明细第 ${idx + 1} 行：色号不能为空`)
        if (it?.quantity == null || Number(it.quantity) <= 0) throw new Error(`商品明细第 ${idx + 1} 行：数量必须大于 0`)
        const price = it?.price ?? it?.unitPrice ?? 0
        const unitPrice = it?.unitPrice ?? it?.price ?? 0
        return {
          ...it,
          price,
          unitPrice,
          batchId: it?.batchId ?? '',
          batchCode: it?.batchCode ?? '',
        }
      })
      const totalAmount = normalizedItems.reduce((sum: number, it: any) => {
        return sum + (Number(it.quantity) || 0) * (Number(it.price) || 0)
      }, 0)
      const unpaidAmount = Math.max(0, totalAmount - Number(normalizedReceivedAmount || 0))

      const orderData: any = {
        ...data,
        // 兜底：交货日期若为空，默认等于销售日期（避免后端必填校验失败）
        deliveryDate: (data as any).deliveryDate || (data as any).salesDate,
        // 同时带上两套字段，兼容不同后端实现
        receivedAmount: normalizedReceivedAmount,
        paidAmount: normalizedPaidAmount,
        totalAmount,
        unpaidAmount,
        items: normalizedItems,
        operator: '当前用户', // TODO: 从用户状态获取
        status: mapSalesStatusToApi(status),
      }
      
      const created = await salesApi.create(orderData)
      const newOrder = {
        ...created,
        status: mapSalesApiToZh((created as any).status ?? '') || status,
      }

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
              receivedAmount: normalizedReceivedAmount,
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
      const debug =
        typeof window !== 'undefined' &&
        (import.meta as any).env?.DEV ||
        (typeof window !== 'undefined' && localStorage.getItem('debugOrderSave') === '1')
      if (debug) {
        console.error('[sales][addOrder] failed', error)
      } else {
        console.error('Failed to add sales order:', error)
      }
      throw error
    }
  },

  updateOrder: async (id, data) => {
    try {
      const current = get().orders.find((o) => String(o.id) === String(id))
      const isDraft = current?.status === '草稿'
      const received = Number((data as any).paidAmount ?? (data as any).receivedAmount ?? 0)
      const totalFromItems = Array.isArray((data as any).items)
        ? (data as any).items.reduce((sum: number, it: any) => sum + (Number(it?.quantity) || 0) * (Number(it?.price ?? it?.unitPrice) || 0), 0)
        : 0
      const totalAmount = totalFromItems > 0 ? totalFromItems : (Number(current?.totalAmount) || 0)
      const unpaidAmount = Math.max(0, totalAmount - received)

      if (!isDraft && current) {
        const fullPayload = {
          ...current,
          ...(data as any),
          status: mapSalesStatusToApi((current as any).status ?? ''),
          receivedAmount: received,
          paidAmount: received,
          totalAmount,
          unpaidAmount,
          remark: (data as any).remark ?? current.remark,
          items: Array.isArray((data as any).items) ? (data as any).items : current.items,
        }
        try {
          const updated = await salesApi.updatePayment(id, fullPayload) as any
          const merged = {
            ...current,
            ...(updated && typeof updated === 'object' ? updated : {}),
            receivedAmount: received,
            paidAmount: received,
            totalAmount,
            unpaidAmount,
            remark: fullPayload.remark,
          }
          set((state) => ({
            orders: state.orders.map((o) => (String(o.id) === String(id) ? merged : o))
          }))
          return
        } catch (err: any) {
          const msg = String(err?.message ?? '')
          if (/只能修改草稿|仅.*草稿|draft only/i.test(msg)) {
            throw new Error('当前后端仅允许修改草稿状态订单。已出库订单的收款请通过【账款管理】操作；或联系管理员开放已出库订单的收款更新。')
          }
          throw err
        }
      }

      const d = data as Partial<SalesOrderFormData> & { status?: string }
      const payload = d.status != null
        ? { ...data, status: mapSalesStatusToApi(d.status) }
        : data
      const updated = await salesApi.update(id, payload) as any
      const normalized = {
        ...updated,
        status: (mapSalesApiToZh(updated?.status ?? '') ?? updated?.status) as string,
        receivedAmount: received,
        paidAmount: received,
        totalAmount: totalFromItems > 0 ? totalFromItems : (Number(updated?.totalAmount) || 0),
        unpaidAmount,
      }
      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(id) ? normalized : o))
      }))
    } catch (error: any) {
      console.error('Failed to update sales order:', error)
      const msg = String(error?.message ?? '')
      if (/只能修改草稿|仅.*草稿|draft only/i.test(msg)) {
        throw new Error('当前后端仅允许修改草稿状态订单。已出库订单的收款请通过【账款管理】操作；或联系管理员开放已出库订单的收款更新。')
      }
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
      await salesApi.update(id, { status: mapSalesStatusToApi('已作废') })
      set((state) => ({
        orders: state.orders.map((o) =>
          String(o.id) === String(id) ? { ...o, status: '已作废' } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to cancel sales order:', error)
      throw error
    }
  },

  revertOutbound: async (id) => {
    const order = get().orders.find((o) => String(o.id) === String(id))
    if (!order) throw new Error('订单不存在')
    if (order.status !== '已出库' && order.status !== '已审核') {
      throw new Error('只有已出库或已审核的订单可以撤销出库')
    }
    const { updateBatchStock } = useProductStore.getState()
    try {
      for (const item of order.items || []) {
        if (item.batchId && (item.quantity ?? 0) > 0) {
          try {
            await updateBatchStock(item.batchId, Number(item.quantity))
          } catch (e: any) {
            console.error('恢复库存失败:', e)
            throw new Error(`恢复库存失败：${item.productName || ''} ${item.batchCode || ''}，${e?.message || '请检查缸号是否存在'}`)
          }
        }
      }
      const fullPayload = {
        ...order,
        status: mapSalesStatusToApi('草稿'),
        items: order.items ?? [],
      }
      await salesApi.update(id, fullPayload)
      set((state) => ({
        orders: state.orders.map((o) =>
          String(o.id) === String(id) ? { ...o, status: '草稿' } : o
        )
      }))
    } catch (error: any) {
      console.error('Failed to revert outbound:', error)
      throw error
    }
  },
}))
