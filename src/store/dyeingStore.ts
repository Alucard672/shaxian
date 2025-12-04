import { create } from 'zustand'
import {
  DyeingOrder,
  DyeingOrderFormData,
  DyeingOrderStatus,
  DyeingOrderItem,
} from '@/types/dyeing'
// 移除硬编码数据，使用空数组作为初始值
import { useProductStore } from './productStore'

interface DyeingState {
  orders: DyeingOrder[]
  
  // 加工单操作
  addOrder: (data: DyeingOrderFormData) => DyeingOrder
  updateOrder: (id: string, data: Partial<DyeingOrderFormData>) => void
  deleteOrder: (id: string) => void
  getOrder: (id: string) => DyeingOrder | undefined
  updateStatus: (id: string, status: DyeingOrderStatus) => void
  stockIn: (id: string, stockLocation: string) => void // 入库操作
  generateOrderNumber: () => string
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成加工单号：JG + 年月日 + 3位序号
const generateOrderNumber = (existingNumbers: string[]): string => {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  
  const prefix = `JG${dateStr}`
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

export const useDyeingStore = create<DyeingState>((set, get) => ({
  orders: loadFromStorage('dyeingOrders', []),

  generateOrderNumber: () => {
    const existingNumbers = get().orders.map(o => o.orderNumber)
    return generateOrderNumber(existingNumbers)
  },

  addOrder: (data) => {
    const orderNumber = get().generateOrderNumber()
    
    // 为每个目标色号项目生成ID
    const items: DyeingOrderItem[] = data.items.map((item) => ({
      id: generateId(),
      ...item,
    }))
    
    // 计算总重量和总金额
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = totalQuantity * data.processingPrice
    
    const newOrder: DyeingOrder = {
      id: generateId(),
      orderNumber,
      productId: data.productId,
      productName: data.productName,
      greyBatchId: data.greyBatchId,
      greyBatchCode: data.greyBatchCode,
      items,
      factoryId: data.factoryId,
      factoryName: data.factoryName,
      factoryPhone: data.factoryPhone,
      shipmentDate: data.shipmentDate,
      expectedCompletionDate: data.expectedCompletionDate,
      processingPrice: data.processingPrice,
      totalAmount,
      status: '待发货',
      remark: data.remark,
      operator: '当前用户', // TODO: 从用户状态获取
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set((state) => {
      const orders = [...state.orders, newOrder]
      saveToStorage('dyeingOrders', orders)
      return { orders }
    })
    
    return newOrder
  },

  updateOrder: (id, data) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        // 如果items更新了，重新生成items并计算总金额
        let items = order.items
        let totalAmount = order.totalAmount
        
        if (data.items) {
          items = data.items.map((item) => ({
            id: generateId(),
            ...item,
          }))
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
          const processingPrice = data.processingPrice ?? order.processingPrice
          totalAmount = totalQuantity * processingPrice
        } else if (data.processingPrice !== undefined) {
          // 如果只更新了单价，重新计算总金额
          const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
          totalAmount = totalQuantity * data.processingPrice
        }
        
        return {
          ...order,
          ...data,
          items,
          totalAmount,
          updatedAt: new Date().toISOString(),
        }
      })
      saveToStorage('dyeingOrders', orders)
      return { orders }
    })
  },

  deleteOrder: (id) => {
    set((state) => {
      const orders = state.orders.filter((o) => o.id !== id)
      saveToStorage('dyeingOrders', orders)
      return { orders }
    })
  },

  getOrder: (id) => {
    return get().orders.find((o) => o.id === id)
  },

  updateStatus: (id, status) => {
    set((state) => {
      const orders = state.orders.map((order) => {
        if (order.id !== id) return order
        
        const updateData: Partial<DyeingOrder> = {
          status,
          updatedAt: new Date().toISOString(),
        }
        
        // 如果状态变为已完成，记录实际完成日期
        if (status === '已完成' && !order.actualCompletionDate) {
          updateData.actualCompletionDate = new Date().toISOString().split('T')[0]
        }
        
        return { ...order, ...updateData }
      })
      
      saveToStorage('dyeingOrders', orders)
      return { orders }
    })
  },

  // 入库操作：创建批次并更新状态为已入库
  stockIn: (id, stockLocation) => {
    const order = get().orders.find((o) => o.id === id)
    if (!order || order.status !== '已完成') {
      alert('只能对已完成状态的加工单进行入库操作')
      return
    }
    
    const { addColor, addBatch, getColorsByProduct } = useProductStore.getState()

    // 为每个目标色号创建批次
    order.items.forEach((item) => {
      // 检查目标色号是否存在，如果不存在则创建
      let targetColor = getColorsByProduct(order.productId).find(c => c.id === item.targetColorId)
      if (!targetColor) {
        targetColor = addColor(order.productId, {
          code: item.targetColorCode,
          name: item.targetColorName,
          colorValue: item.targetColorValue,
          status: '在售',
        })
      }

      // 为每个目标色号创建一个新的缸号
      addBatch(targetColor.id, {
        code: `${order.greyBatchCode}-${item.targetColorCode}-${generateId().substring(0, 4)}`,
        productionDate: order.actualCompletionDate || new Date().toISOString().split('T')[0],
        supplierId: order.factoryId || '', // 加工厂作为供应商
        purchasePrice: order.processingPrice, // 加工单价作为采购价
        initialQuantity: item.quantity,
        stockLocation: stockLocation, // 使用传入的仓库位置
        remark: `由加工单 ${order.orderNumber} 染色加工`,
      })
    })
    
    // 更新订单状态为已入库
    set((state) => {
      const orders = state.orders.map((o) =>
        o.id === id ? { ...o, status: '已入库' as const, updatedAt: new Date().toISOString() } : o
      )
      saveToStorage('dyeingOrders', orders)
      return { ...state, orders }
    })
  },
}))





