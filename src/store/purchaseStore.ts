import { create } from 'zustand'
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderFormData,
  PurchaseOrderStatus,
} from '@/types/purchase'
import { useProductStore } from './productStore'
import { useAccountStore } from './accountStore'

interface PurchaseState {
  orders: PurchaseOrder[]
  
  // 进货单操作
  addOrder: (data: PurchaseOrderFormData) => PurchaseOrder
  updateOrder: (id: string, data: Partial<PurchaseOrderFormData>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => PurchaseOrder | undefined
  approveOrder: (id: string) => void // 审核通过
  cancelOrder: (id: string) => void // 作废
  generateOrderNumber: () => string
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成进货单号：CG + 年月日 + 3位序号
const generateOrderNumber = (existingNumbers: string[]): string => {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  const prefix = `CG${dateStr}`
  const sameDayNumbers = existingNumbers.filter(n => n.startsWith(prefix))
  const sequence = String((sameDayNumbers.length + 1)).padStart(3, '0')
  
  return `${prefix}${sequence}`
}

// 从localStorage加载数据
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// 保存到localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  orders: loadFromStorage('purchaseOrders', []),

  generateOrderNumber: () => {
    const existingNumbers = get().orders.map(o => o.orderNumber)
    return generateOrderNumber(existingNumbers)
  },

  addOrder: (data) => {
    const orderNumber = get().generateOrderNumber()
    
    // 计算明细金额和总金额
    const items: PurchaseOrderItem[] = data.items.map((item) => ({
      id: generateId(),
      ...item,
      amount: item.quantity * item.price,
    }))
    
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
    const unpaidAmount = totalAmount - (data.paidAmount || 0)
    
    const newOrder: PurchaseOrder = {
      id: generateId(),
      orderNumber,
      ...data,
      items,
      totalAmount,
      unpaidAmount,
      status: '待审核',
      operator: '当前用户', // TODO: 从用户状态获取
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const orders = [...state.orders, newOrder]
      saveToStorage('purchaseOrders', orders)
      return { orders }
    })
    
    return newOrder
  },

  updateOrder: (id, data) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        // 如果更新了明细，重新计算金额
        let items = order.items
        let totalAmount = order.totalAmount
        let unpaidAmount = order.unpaidAmount
        
        if (data.items) {
          items = data.items.map((item) => ({
            id: generateId(),
            ...item,
            amount: item.quantity * item.price,
          }))
          totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
          unpaidAmount = totalAmount - (data.paidAmount ?? order.paidAmount)
        } else if (data.paidAmount !== undefined) {
          unpaidAmount = order.totalAmount - data.paidAmount
        }
        
        return {
          ...order,
          ...data,
          items,
          totalAmount,
          unpaidAmount,
          updatedAt: new Date().toISOString(),
        }
      })
      
      saveToStorage('purchaseOrders', orders)
      return { orders }
    })
  },

  deleteOrder: (id) => {
    set((state) => {
      const orders = state.orders.filter((o) => o.id !== id)
      saveToStorage('purchaseOrders', orders)
      return { orders }
    })
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  // 审核通过：增加库存并生成应付账款
  approveOrder: (id) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status !== '待审核') return
    
    const { addBatch } = useProductStore.getState()
    const { addAccountPayable } = useAccountStore.getState()
    
    // 为每个明细创建缸号并增加库存
    order.items.forEach((item) => {
      // 查找商品和色号
      const products = useProductStore.getState().products
      const colors = useProductStore.getState().colors
      const product = products.find((p) => p.id === item.productId)
      const color = colors.find((c) => c.id === item.colorId)
      
      if (product && color) {
        // 创建新缸号
        addBatch(color.id, {
          code: item.batchCode,
          productionDate: item.productionDate || new Date().toISOString().split('T')[0],
          supplierId: order.supplierId,
          purchasePrice: item.price,
          initialQuantity: item.quantity,
          stockLocation: item.stockLocation,
          remark: item.remark,
        })
      }
    })
    
    // 如果有欠款，生成应付账款
    if (order.unpaidAmount > 0) {
      addAccountPayable({
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        purchaseOrderId: order.id,
        purchaseOrderNumber: order.orderNumber,
        payableAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        accountDate: order.purchaseDate,
      })
    }
    
    // 更新订单状态
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已审核', updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('purchaseOrders', orders)
      return { orders }
    })
  },

  // 作废订单
  cancelOrder: (id) => {
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已作废', updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('purchaseOrders', orders)
      return { orders }
    })
  },
}))


