import { create } from 'zustand'
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderFormData,
  PurchaseOrderStatus,
} from '@/types/purchase'
import { useProductStore } from './productStore'
import { useAccountStore } from './accountStore'
// 移除硬编码数据，使用空数组作为初始值

interface PurchaseState {
  orders: PurchaseOrder[]
  
  // 进货单操作
  addOrder: (data: PurchaseOrderFormData, status?: PurchaseOrderStatus) => PurchaseOrder
  updateOrder: (id: string, data: Partial<PurchaseOrderFormData & { status?: PurchaseOrderStatus }>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => PurchaseOrder | undefined
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
  
  const prefix = `PO${dateStr}`
  const sameDayNumbers = existingNumbers.filter(n => n.startsWith(prefix))
  const sequence = String((sameDayNumbers.length + 1)).padStart(3, '0')
  
  return `${prefix}${sequence}`
}

// 从localStorage加载数据，不再自动初始化硬编码数据
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      return JSON.parse(item)
    }
    // 如果没有数据，返回默认值（空数组），不自动写入
    return defaultValue
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

  addOrder: (data, status = '已入库') => {
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
      status: status,
      operator: '当前用户', // TODO: 从用户状态获取
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // 如果不是草稿状态，自动执行入库操作
    if (status !== '草稿') {
      const { addBatch } = useProductStore.getState()
      const { addAccountPayable } = useAccountStore.getState()
      
      // 为每个明细创建缸号并增加库存
      items.forEach((item) => {
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
            supplierId: data.supplierId,
            purchasePrice: item.price,
            initialQuantity: item.quantity,
            stockLocation: item.stockLocation,
            remark: item.remark,
          })
        }
      })
      
      // 如果有欠款，生成应付账款
      if (unpaidAmount > 0) {
        addAccountPayable({
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          purchaseOrderId: newOrder.id,
          purchaseOrderNumber: orderNumber,
          payableAmount: totalAmount,
          paidAmount: data.paidAmount || 0,
          accountDate: data.purchaseDate,
        })
      }
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


  // 作废订单
  cancelOrder: (id) => {
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已作废' as const, updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('purchaseOrders', orders)
      return { ...state, orders }
    })
  },
}))


