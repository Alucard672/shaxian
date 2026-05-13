import { create } from 'zustand'
import { getOperatorName } from './userStore'
import {
  SalesOrder,
  SalesOrderItem,
  SalesOrderFormData,
  SalesOrderStatus,
} from '@/types/sales'
import { salesApi } from '@/api/client'
import { useProductStore } from './productStore'
import { useSettingsStore } from './settingsStore'
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
          unpaidAmount: unpaid,
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

  addOrder: async (data, status = '已完成') => {
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

      const allowNegativeStock = !!useSettingsStore.getState().systemParams?.allowNegativeStock
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
        operator: getOperatorName(),
        status: mapSalesStatusToApi(status),
        allowNegativeStock, // 传递允许负库存，供后端校验时参考
      }
      
      const created = await salesApi.create(orderData)
      const apiReceived = Number((created as any).receivedAmount ?? (created as any).paidAmount ?? 0)
      const newOrder = {
        ...created,
        status: mapSalesApiToZh((created as any).status ?? '') || status,
        receivedAmount: apiReceived > 0 ? apiReceived : normalizedReceivedAmount,
        paidAmount: apiReceived > 0 ? apiReceived : normalizedPaidAmount,
        unpaidAmount: apiReceived > 0 ? Math.max(0, totalAmount - apiReceived) : unpaidAmount,
      }

      // 默认即为完成单，自动执行出库操作
      if (status !== '草稿') {
        // 减少库存（失败时抛出，让用户看到错误提示）
        for (const item of data.items) {
          try {
            await updateBatchStock(item.batchId, -item.quantity)
          } catch (error: any) {
            console.error('Failed to update batch stock:', error)
            const msg = error?.message || '库存更新失败'
            const hint = allowNegativeStock ? '（后端可能未支持负库存，请联系管理员）' : '。如需允许负库存出库，请在【系统设置→参数设置】中开启「允许负库存出库」。'
            throw new Error(/库存不足|缸号/i.test(msg) ? msg + hint : msg)
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
    let current: any = null
    let detail: any | null = null
    try {
      current = get().orders.find((o) => String(o.id) === String(id))
      const isDraft = current?.status === '草稿'
      const hasInvalidItems = (items?: any[]) =>
        !Array.isArray(items) ||
        items.length === 0 ||
        items.some((it) => {
          const qty = Number(it?.quantity ?? 0)
          const price = Number(it?.price ?? it?.unitPrice ?? 0)
          return !it?.productId || !it?.colorId || qty <= 0 || price <= 0
        })
      if (!current || !current.customerId || hasInvalidItems((current as any)?.items)) {
        try {
          detail = await salesApi.getById(id)
          if (detail) {
            current = {
              ...detail,
              status: mapSalesApiToZh((detail as any).status ?? '') || (detail as any).status,
            } as any
          }
        } catch (e) {
          console.error('Failed to load sales order detail:', e)
        }
      }
      if (!current) throw new Error('订单不存在')
      // 允许修改明细（不再区分草稿/正式）
      const received = Number((data as any).paidAmount ?? (data as any).receivedAmount ?? 0)
      const nextStatus = (data as any).status ?? current?.status
      const normalizeItems = (items: any[]) =>
        items.map((it) => ({
          ...it,
          price: it?.price ?? it?.unitPrice ?? 0,
          unitPrice: it?.unitPrice ?? it?.price ?? 0,
          batchId: it?.batchId ?? '',
          batchCode: it?.batchCode ?? '',
        }))
      const nextItems = Array.isArray((data as any).items)
        ? normalizeItems((data as any).items)
        : normalizeItems(((detail as any)?.items ?? (current as any).items) || [])
      const totalFromItems = nextItems.reduce((sum: number, it: any) => {
        return sum + (Number(it?.quantity) || 0) * (Number(it?.price ?? it?.unitPrice) || 0)
      }, 0)
      const totalAmount = totalFromItems > 0 ? totalFromItems : (Number((current as any)?.totalAmount) || 0)
      const unpaidAmount = Math.max(0, totalAmount - received)

      if (!isDraft && current) {
        const base = (detail as any) || current
        const fullPayload = {
          ...base,
          ...(data as any),
          status: mapSalesStatusToApi((current as any).status ?? ''),
          receivedAmount: received,
          paidAmount: received,
          totalAmount,
          unpaidAmount,
          remark: (data as any).remark ?? base.remark,
          customerId: (data as any).customerId ?? base.customerId,
          customerName: (data as any).customerName ?? base.customerName,
          salesDate: (data as any).salesDate ?? base.salesDate,
          deliveryDate: (data as any).deliveryDate ?? base.deliveryDate ?? (data as any).salesDate ?? base.salesDate,
          items: nextItems,
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
          throw err
        }
      }

      const d = data as Partial<SalesOrderFormData> & { status?: string }
      const payload = d.status != null
        ? { ...data, status: mapSalesStatusToApi(d.status) }
        : data
      if (!(payload as any).deliveryDate) {
        ;(payload as any).deliveryDate = (payload as any).salesDate ?? (current as any).salesDate
      }
      if (!(payload as any).items) {
        ;(payload as any).items = nextItems
      }
      if (!(payload as any).customerId) {
        ;(payload as any).customerId = (detail as any)?.customerId ?? (current as any).customerId
      }
      if (!(payload as any).customerName) {
        ;(payload as any).customerName = (detail as any)?.customerName ?? (current as any).customerName
      }
      const updated = await salesApi.update(id, payload) as any
      const normalized = {
        ...updated,
        status: (mapSalesApiToZh(updated?.status ?? '') ?? updated?.status) as string,
        receivedAmount: received,
        paidAmount: received,
        totalAmount: totalFromItems > 0 ? totalFromItems : (Number(updated?.totalAmount) || 0),
        unpaidAmount,
      }
      // 草稿 -> 已完成时执行出库与应收
      if (isDraft && current && (nextStatus === '已完成' || nextStatus === '已审核')) {
        const { updateBatchStock } = useProductStore.getState()
        const { addAccountReceivable } = useAccountStore.getState()
        for (const item of (normalized.items || current.items || []) as any[]) {
          if (item?.batchId && item?.quantity) {
            await updateBatchStock(item.batchId, -Number(item.quantity))
          }
        }
        const total = Number(normalized.totalAmount ?? 0)
        const unpaid = Math.max(0, total - received)
        if (unpaid > 0) {
          await addAccountReceivable({
            customerId: (data as any).customerId ?? current.customerId,
            customerName: (data as any).customerName ?? current.customerName,
            salesOrderId: current.id,
            salesOrderNumber: current.orderNumber,
            receivableAmount: total,
            receivedAmount: received,
            accountDate: (data as any).salesDate ?? current.salesDate,
          })
        }
      }
      set((state) => ({
        orders: state.orders.map((o) => (String(o.id) === String(id) ? normalized : o))
      }))
    } catch (error: any) {
      const msg = String(error?.message || '')
      if (msg.includes('只能修改草稿状态')) {
        // 历史实现：自动 cancel + 重建。但作废 + 重建会改变订单 ID，
        // 跟应收账款关联断链，且金额已收时会被后端拒绝。
        // 现在改为抛错给 UI 层，由 UI 层弹确认对话框（并提示风险）。
        const explainErr = new Error(
          '该订单已审核，不能直接修改。如需修改请先作废原单（自动还库存 + 冲销未收应收）后重新开单。'
        )
        ;(explainErr as any).code = 'NON_DRAFT_NOT_EDITABLE'
        throw explainErr
      }
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
      // 调用后端事务化 cancel 接口：还库存 + 冲销未收款应收 + 改状态。
      // 历史前端实现是 update + 手动 updateBatchStock，但 PUT /sales 限草稿，作废其实是失败的；同时无应收冲销。
      await salesApi.cancel(id)
      set((state) => ({
        orders: state.orders.map((o) =>
          String(o.id) === String(id) ? { ...o, status: '已作废' } : o
        )
      }))
      // 后端已经把关联应收设为 VOIDED，前端账款 store 同步刷新
      try {
        const { useAccountStore } = await import('./accountStore')
        await useAccountStore.getState().loadReceivables()
      } catch (e) {
        console.warn('账款列表刷新失败（不影响作废）:', e)
      }
    } catch (error: any) {
      console.error('Failed to cancel sales order:', error)
      throw error
    }
  },

}))
