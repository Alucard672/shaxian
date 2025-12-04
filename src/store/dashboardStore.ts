import { create } from 'zustand'
import { useSalesStore } from './salesStore'
import { usePurchaseStore } from './purchaseStore'
import { useInventoryStore } from './inventoryStore'
import { useAccountStore } from './accountStore'
import { useProductStore } from './productStore'
import { useContactStore } from './contactStore'
import { format } from 'date-fns'

interface DashboardStats {
  // 今日销售额
  todaySales: number
  todaySalesChange: number // 百分比变化
  
  // 今日进货额
  todayPurchases: number
  todayPurchasesChange: number
  
  // 库存总值
  totalInventoryValue: number
  totalInventoryValueChange: number
  
  // 待收账款
  accountsReceivable: number
  accountsReceivableChange: number
  
  // 待处理订单数
  pendingOrders: number
}

interface DashboardState {
  getStats: () => DashboardStats
  getRecentOrders: () => Array<{
    orderNumber: string
    type: '销售单' | '进货单'
    counterparty: string
    amount: number
    status: string
    date: string
  }>
  getAlerts: () => Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    icon: string
  }>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  getStats: () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    // 今日销售额
    const salesOrders = useSalesStore.getState().orders
    const todaySalesOrders = salesOrders.filter(
      (order) => order.salesDate === today && order.status === '已审核'
    )
    const todaySales = todaySalesOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    
    // 今日进货额
    const purchaseOrders = usePurchaseStore.getState().orders
    const todayPurchaseOrders = purchaseOrders.filter(
      (order) => order.purchaseDate === today && order.status === '已审核'
    )
    const todayPurchases = todayPurchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    
    // 库存总值（简化计算：使用缸号的采购单价 * 库存数量）
    const { batches } = useProductStore.getState()
    const totalInventoryValue = batches.reduce(
      (sum, batch) => sum + (batch.purchasePrice || 0) * batch.stockQuantity,
      0
    )
    
    // 待收账款
    const { receivables } = useAccountStore.getState()
    const accountsReceivable = receivables
      .filter((r) => r.status === '未结清')
      .reduce((sum, r) => sum + r.unpaidAmount, 0)
    
    // 待处理订单
    const pendingSales = salesOrders.filter((o) => o.status === '待审核').length
    const pendingPurchases = purchaseOrders.filter((o) => o.status === '待审核').length
    const pendingOrders = pendingSales + pendingPurchases
    
    // 计算变化百分比 - 基于实际数据，如果没有历史数据则显示0
    // TODO: 未来可以添加历史数据对比功能
    const todaySalesChange = todaySales > 0 ? 0 : 0
    const todayPurchasesChange = todayPurchases > 0 ? 0 : 0
    const totalInventoryValueChange = totalInventoryValue > 0 ? 0 : 0
    const accountsReceivableChange = accountsReceivable > 0 ? 0 : 0
    
    return {
      todaySales,
      todaySalesChange,
      todayPurchases,
      todayPurchasesChange,
      totalInventoryValue,
      totalInventoryValueChange,
      accountsReceivable,
      accountsReceivableChange,
      pendingOrders,
    }
  },

  getRecentOrders: () => {
    const salesOrders = useSalesStore.getState().orders
    const purchaseOrders = usePurchaseStore.getState().orders
    const { customers } = useContactStore.getState()
    const { suppliers } = useContactStore.getState()
    
    // 合并销售单和进货单
    const allOrders = [
      ...salesOrders.slice(0, 10).map((order) => ({
        orderNumber: order.orderNumber,
        type: '销售单' as const,
        counterparty: order.customerName,
        amount: order.totalAmount,
        status: order.status,
        date: order.salesDate,
        createdAt: order.createdAt,
      })),
      ...purchaseOrders.slice(0, 10).map((order) => ({
        orderNumber: order.orderNumber,
        type: '进货单' as const,
        counterparty: order.supplierName,
        amount: order.totalAmount,
        status: order.status,
        date: order.purchaseDate,
        createdAt: order.createdAt,
      })),
    ]
    
    // 按创建时间排序，取最近4条
    return allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  },

  getAlerts: () => {
    const alerts: Array<{
      type: 'warning' | 'error' | 'info'
      message: string
      icon: string
    }> = []
    
    // 库存预警
    const lowStockBatches = useInventoryStore.getState().getLowStockAlerts(200)
    lowStockBatches.slice(0, 1).forEach((batch) => {
      const { colors, products } = useProductStore.getState()
      const color = colors.find((c) => c.id === batch.colorId)
      const product = color ? products.find((p) => p.id === color.productId) : null
      
      if (product && color) {
        alerts.push({
          type: 'warning',
          message: `${product.name}-${color.name}库存不足,当前库存:${batch.stockQuantity}${product.unit}`,
          icon: 'warning',
        })
      }
    })
    
    // 账款逾期提醒
    const { receivables } = useAccountStore.getState()
    const overdueReceivables = receivables.filter((r) => {
      if (r.status === '已结清') return false
      const daysDiff = Math.floor(
        (new Date().getTime() - new Date(r.accountDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff > 15
    })
    
    overdueReceivables.slice(0, 1).forEach((r) => {
      alerts.push({
        type: 'error',
        message: `客户"${r.customerName}"账款已逾期${Math.floor((new Date().getTime() - new Date(r.accountDate).getTime()) / (1000 * 60 * 60 * 24))}天,欠款金额:¥${r.unpaidAmount.toLocaleString()}`,
        icon: 'error',
      })
    })
    
    // 缸号过期提醒
    const { batches } = useProductStore.getState()
    const expiringBatches = batches.filter((batch) => {
      if (!batch.productionDate) return false
      const daysDiff = Math.floor(
        (new Date(batch.productionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff > 0 && daysDiff <= 3
    })
    
    expiringBatches.slice(0, 1).forEach((batch) => {
      alerts.push({
        type: 'info',
        message: `缸号 ${batch.code} 将于${Math.floor((new Date(batch.productionDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}天后过期,请及时处理`,
        icon: 'info',
      })
    })
    
    return alerts
  },
}))

