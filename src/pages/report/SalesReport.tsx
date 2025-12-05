import { useState, useMemo } from 'react'
import { useSalesStore } from '@/store/salesStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { DollarSign, Download, Filter, ArrowLeft, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from 'date-fns'

type DateRange = '今日' | '本周' | '本月' | '本季度' | '本年' | '自定义'

function SalesReport() {
  const navigate = useNavigate()
  const { orders } = useSalesStore()
  const { products } = useProductStore()
  const { customers } = useContactStore()

  const [dateRange, setDateRange] = useState<DateRange>('本月')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // 获取日期范围
  const getDateRange = useMemo(() => {
    const now = new Date()
    switch (dateRange) {
      case '今日':
        return { start: startOfDay(now), end: endOfDay(now) }
      case '本周':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case '本月':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case '本季度':
        return { start: startOfQuarter(now), end: endOfQuarter(now) }
      case '本年':
        return { start: startOfYear(now), end: endOfYear(now) }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }, [dateRange])

  // 筛选订单
  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange
    return orders.filter((order) => {
      const orderDate = new Date(order.salesDate)
      return orderDate >= start && orderDate <= end && (order.status === '已出库' || order.status === '已审核')
    })
  }, [orders, getDateRange])

  // 统计数据
  const stats = useMemo(() => {
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = filteredOrders.length
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0
    const paidAmount = filteredOrders.reduce((sum, o) => sum + o.receivedAmount, 0)
    const unpaidAmount = filteredOrders.reduce((sum, o) => sum + o.unpaidAmount, 0)

    return {
      totalAmount,
      totalOrders,
      avgOrderAmount,
      paidAmount,
      unpaidAmount,
    }
  }, [filteredOrders])

  // 按商品统计
  const productStats = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; amount: number }> = {}
    
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productMap[item.productId]) {
          const product = products.find((p) => p.id === item.productId)
          productMap[item.productId] = {
            name: product?.name || item.productName,
            quantity: 0,
            amount: 0,
          }
        }
        productMap[item.productId].quantity += item.quantity
        productMap[item.productId].amount += item.amount
      })
    })

    return Object.entries(productMap)
      .map(([productId, data]) => ({
        productId,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [filteredOrders, products])

  // 按客户统计
  const customerStats = useMemo(() => {
    const customerMap: Record<string, { name: string; orderCount: number; amount: number }> = {}
    
    filteredOrders.forEach((order) => {
      if (!customerMap[order.customerId]) {
        customerMap[order.customerId] = {
          name: order.customerName,
          orderCount: 0,
          amount: 0,
        }
      }
      customerMap[order.customerId].orderCount += 1
      customerMap[order.customerId].amount += order.totalAmount
    })

    return Object.entries(customerMap)
      .map(([customerId, data]) => ({
        customerId,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [filteredOrders])

  // 趋势数据（按日）
  const trendData = useMemo(() => {
    const days = dateRange === '今日' ? 1 : dateRange === '本周' ? 7 : dateRange === '本月' ? 30 : dateRange === '本季度' ? 90 : 365
    const { start } = getDateRange
    const dailyMap: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      const date = format(new Date(order.salesDate), 'yyyy-MM-dd')
      dailyMap[date] = (dailyMap[date] || 0) + order.totalAmount
    })

    const result = []
    for (let i = 0; i < days; i++) {
      const date = format(subDays(endOfDay(getDateRange.end), days - 1 - i), 'yyyy-MM-dd')
      result.push({
        date: format(new Date(date), 'MM-dd'),
        amount: dailyMap[date] || 0,
      })
    }

    return result
  }, [filteredOrders, dateRange, getDateRange])

  // 分页数据
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

  // 表格列
  const columns = [
    {
      key: 'orderNumber',
      title: '销售单号',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="text-gray-900 font-medium">{record.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      title: '客户名称',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="text-gray-900">{record.customerName}</span>
      ),
    },
    {
      key: 'salesDate',
      title: '销售日期',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="text-gray-600">{record.salesDate}</span>
      ),
    },
    {
      key: 'items',
      title: '商品数量',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="text-gray-600">{record.items.length} 项</span>
      ),
    },
    {
      key: 'totalAmount',
      title: '销售金额',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="text-gray-900 font-medium">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: typeof filteredOrders[0]) => (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          {record.status}
        </span>
      ),
    },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/report')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">销售报表</h1>
          <p className="text-gray-600 mt-1">查看销售数据统计和分析</p>
        </div>
      </div>

      {/* 日期筛选 */}
      <Card className="p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['今日', '本周', '本月', '本季度', '本年'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
            <Button className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700">
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </div>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-5 border border-gray-200 rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">销售总额</div>
          <div className="text-2xl font-semibold text-gray-900">¥{stats.totalAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border border-gray-200 rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">订单数量</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.totalOrders} 笔</div>
        </Card>
        <Card className="p-5 border border-gray-200 rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">平均金额</div>
          <div className="text-2xl font-semibold text-gray-900">¥{stats.avgOrderAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-5 border border-gray-200 rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">已收金额</div>
          <div className="text-2xl font-semibold text-green-600">¥{stats.paidAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border border-gray-200 rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">未收金额</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.unpaidAmount.toLocaleString()}</div>
        </Card>
      </div>

      {/* 销售趋势图 */}
      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">销售趋势</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '销售额']} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="销售额" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 商品销售统计和客户销售统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 商品销售TOP10 */}
        <Card className="p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">商品销售TOP10</h2>
          <div className="h-80">
            {productStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '销售额']} />
                  <Bar dataKey="amount" fill="#3b82f6" name="销售额" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
            )}
          </div>
        </Card>

        {/* 客户销售TOP10 */}
        <Card className="p-6 rounded-xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">客户销售TOP10</h2>
          <div className="h-80">
            {customerStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerStats.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {customerStats.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
            )}
          </div>
        </Card>
      </div>

      {/* 销售明细表格 */}
      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">销售明细</h2>
        </div>
        {paginatedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无数据</p>
        ) : (
          <>
            <Table columns={columns} data={paginatedOrders} />
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">共 {filteredOrders.length} 条记录</span>
              <Pagination
                current={currentPage}
                total={filteredOrders.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default SalesReport



