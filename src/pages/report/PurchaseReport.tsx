import { useState, useMemo } from 'react'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useProductStore } from '@/store/productStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { Package, Download, Filter, ArrowLeft } from 'lucide-react'
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
} from 'recharts'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from 'date-fns'

type DateRange = '今日' | '本周' | '本月' | '本季度' | '本年'

function PurchaseReport() {
  const navigate = useNavigate()
  const { orders } = usePurchaseStore()
  const { products } = useProductStore()

  const [dateRange, setDateRange] = useState<DateRange>('本月')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange
    return orders.filter((order) => {
      const orderDate = new Date(order.purchaseDate)
      return orderDate >= start && orderDate <= end && (order.status === '已入库' || order.status === '已审核')
    })
  }, [orders, getDateRange])

  const stats = useMemo(() => {
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalOrders = filteredOrders.length
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0
    const paidAmount = filteredOrders.reduce((sum, o) => sum + o.paidAmount, 0)
    const unpaidAmount = filteredOrders.reduce((sum, o) => sum + o.unpaidAmount, 0)

    return { totalAmount, totalOrders, avgOrderAmount, paidAmount, unpaidAmount }
  }, [filteredOrders])

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
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [filteredOrders, products])

  const trendData = useMemo(() => {
    const days = dateRange === '今日' ? 1 : dateRange === '本周' ? 7 : dateRange === '本月' ? 30 : dateRange === '本季度' ? 90 : 365
    const dailyMap: Record<string, number> = {}

    filteredOrders.forEach((order) => {
      const date = format(new Date(order.purchaseDate), 'yyyy-MM-dd')
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

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

  const columns = [
    { key: 'orderNumber', title: '进货单号', render: (_: any, r: typeof filteredOrders[0]) => <span className="font-medium">{r.orderNumber}</span> },
    { key: 'supplierName', title: '供应商名称', render: (_: any, r: typeof filteredOrders[0]) => <span>{r.supplierName}</span> },
    { key: 'purchaseDate', title: '进货日期', render: (_: any, r: typeof filteredOrders[0]) => <span className="text-gray-600">{r.purchaseDate}</span> },
    { key: 'items', title: '商品数量', render: (_: any, r: typeof filteredOrders[0]) => <span className="text-gray-600">{r.items.length} 项</span> },
    { key: 'totalAmount', title: '采购金额', render: (_: any, r: typeof filteredOrders[0]) => <span className="font-medium">¥{r.totalAmount.toLocaleString()}</span> },
    { key: 'status', title: '状态', render: (_: any, r: typeof filteredOrders[0]) => <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{r.status}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/report')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">采购报表</h1>
          <p className="text-gray-600 mt-1">查看采购数据统计和分析</p>
        </div>
      </div>

      <Card className="p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['今日', '本周', '本月', '本季度', '本年'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateRange === range ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-[38px] rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
            <Button className="h-[38px] rounded-lg bg-primary-600">
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">采购总额</div>
          <div className="text-2xl font-semibold">¥{stats.totalAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">订单数量</div>
          <div className="text-2xl font-semibold">{stats.totalOrders} 笔</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">平均金额</div>
          <div className="text-2xl font-semibold">¥{stats.avgOrderAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">已付金额</div>
          <div className="text-2xl font-semibold text-green-600">¥{stats.paidAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">未付金额</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.unpaidAmount.toLocaleString()}</div>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">采购趋势</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '采购额']} />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="采购额" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">商品采购TOP10</h2>
        <div className="h-80">
          {productStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '采购额']} />
                <Bar dataKey="amount" fill="#3b82f6" name="采购额" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
          )}
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">采购明细</h2>
        </div>
        {paginatedOrders.length === 0 ? (
          <p className="text-center py-8 text-gray-500">暂无数据</p>
        ) : (
          <>
            <Table columns={columns} data={paginatedOrders} />
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-gray-600">共 {filteredOrders.length} 条记录</span>
              <Pagination current={currentPage} total={filteredOrders.length} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default PurchaseReport




