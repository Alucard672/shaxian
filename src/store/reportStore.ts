import { create } from 'zustand'
import { useSalesStore } from './salesStore'
import { usePurchaseStore } from './purchaseStore'
import { useProductStore } from './productStore'
import { useContactStore } from './contactStore'
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'

interface ReportState {
  // 获取本月销售额
  getThisMonthSales: () => number
  // 获取本月采购额
  getThisMonthPurchases: () => number
  // 获取毛利润
  getGrossProfit: () => number
  // 获取利润率
  getProfitRate: () => number
  // 获取销售趋势数据（过去30天）
  getSalesTrend: (days?: number) => Array<{ date: string; amount: number }>
  // 获取商品销售排行
  getProductSalesRanking: (limit?: number) => Array<{
    productId: string
    productName: string
    salesVolume: number
    salesAmount: number
    change: number
  }>
  // 获取客户销售排行
  getCustomerSalesRanking: (limit?: number) => Array<{
    customerId: string
    customerName: string
    orderCount: number
    totalAmount: number
    change: number
  }>
}

export const useReportStore = create<ReportState>((set, get) => ({
  getThisMonthSales: () => {
    const { orders } = useSalesStore.getState()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    return orders
      .filter((o) => {
        const orderDate = new Date(o.salesDate)
        return orderDate >= monthStart && orderDate <= monthEnd && (o.status === '已出库' || o.status === '已审核')
      })
      .reduce((sum, o) => sum + o.totalAmount, 0)
  },

  getThisMonthPurchases: () => {
    const { orders } = usePurchaseStore.getState()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    
    return orders
      .filter((o) => {
        const orderDate = new Date(o.purchaseDate)
        return orderDate >= monthStart && orderDate <= monthEnd && (o.status === '已入库' || o.status === '已审核')
      })
      .reduce((sum, o) => sum + o.totalAmount, 0)
  },

  getGrossProfit: () => {
    const sales = get().getThisMonthSales()
    const purchases = get().getThisMonthPurchases()
    return sales - purchases
  },

  getProfitRate: () => {
    const sales = get().getThisMonthSales()
    const profit = get().getGrossProfit()
    return sales > 0 ? (profit / sales) * 100 : 0
  },

  getSalesTrend: (days = 30) => {
    const { orders } = useSalesStore.getState()
    const today = new Date()
    const startDate = subDays(today, days)
    
    // 按日期分组统计
    const dailySales: Record<string, number> = {}
    
    orders
      .filter((o) => {
        const orderDate = new Date(o.salesDate)
        return orderDate >= startDate && (o.status === '已出库' || o.status === '已审核')
      })
      .forEach((o) => {
        const date = o.salesDate
        dailySales[date] = (dailySales[date] || 0) + o.totalAmount
      })
    
    // 生成过去30天的数据（包括没有销售的日子）
    const trendData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd')
      trendData.push({
        date,
        amount: dailySales[date] || 0,
      })
    }
    
    return trendData
  },

  getProductSalesRanking: (limit = 5) => {
    const { orders } = useSalesStore.getState()
    const { products } = useProductStore.getState()
    
    // 按商品统计销售额
    const productSales: Record<string, {
      productId: string
      productName: string
      salesVolume: number
      salesAmount: number
    }> = {}
    
    orders
      .filter((o) => o.status === '已出库' || o.status === '已审核')
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!productSales[item.productId]) {
            const product = products.find((p) => p.id === item.productId)
            productSales[item.productId] = {
              productId: item.productId,
              productName: product?.name || item.productName,
              salesVolume: 0,
              salesAmount: 0,
            }
          }
          productSales[item.productId].salesVolume += item.quantity
          productSales[item.productId].salesAmount += item.amount
        })
      })
    
    // 排序并取前N名
    return Object.values(productSales)
      .sort((a, b) => b.salesAmount - a.salesAmount)
      .slice(0, limit)
      .map((item) => ({
        ...item,
        change: Math.random() * 30 - 5, // 简化：随机生成变化百分比
      }))
  },

  getCustomerSalesRanking: (limit = 5) => {
    const { orders } = useSalesStore.getState()
    
    // 按客户统计
    const customerSales: Record<string, {
      customerId: string
      customerName: string
      orderCount: number
      totalAmount: number
    }> = {}
    
    orders
      .filter((o) => o.status === '已出库' || o.status === '已审核')
      .forEach((order) => {
        if (!customerSales[order.customerId]) {
          customerSales[order.customerId] = {
            customerId: order.customerId,
            customerName: order.customerName,
            orderCount: 0,
            totalAmount: 0,
          }
        }
        customerSales[order.customerId].orderCount += 1
        customerSales[order.customerId].totalAmount += order.totalAmount
      })
    
    // 排序并取前N名
    return Object.values(customerSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
      .map((item) => ({
        ...item,
        change: Math.random() * 30 - 5, // 简化：随机生成变化百分比
      }))
  },
}))





