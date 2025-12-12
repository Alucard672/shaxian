import { useState, useMemo } from 'react'
import { useSalesStore } from '@/store/salesStore'
import { usePurchaseStore } from '@/store/purchaseStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { TrendingUp, Download, Filter, ArrowLeft } from 'lucide-react'
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

function ProfitReport() {
  const navigate = useNavigate()
  const { orders: salesOrders } = useSalesStore()
  const { orders: purchaseOrders } = usePurchaseStore()

  const [dateRange, setDateRange] = useState<DateRange>('本月')

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

  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange
    return salesOrders.filter((order) => {
      const orderDate = new Date(order.salesDate)
      return orderDate >= start && orderDate <= end && (order.status === '已出库' || order.status === '已审核')
    })
  }, [salesOrders, getDateRange])

  const filteredPurchases = useMemo(() => {
    const { start, end } = getDateRange
    return purchaseOrders.filter((order) => {
      const orderDate = new Date(order.purchaseDate)
      return orderDate >= start && orderDate <= end && (order.status === '已入库' || order.status === '已审核')
    })
  }, [purchaseOrders, getDateRange])

  const stats = useMemo(() => {
    const salesAmount = filteredSales.reduce((sum, o) => sum + o.totalAmount, 0)
    const purchaseAmount = filteredPurchases.reduce((sum, o) => sum + o.totalAmount, 0)
    const grossProfit = salesAmount - purchaseAmount
    const profitRate = salesAmount > 0 ? (grossProfit / salesAmount) * 100 : 0

    return { salesAmount, purchaseAmount, grossProfit, profitRate }
  }, [filteredSales, filteredPurchases])

  const trendData = useMemo(() => {
    const days = dateRange === '今日' ? 1 : dateRange === '本周' ? 7 : dateRange === '本月' ? 30 : dateRange === '本季度' ? 90 : 365
    const dailyMap: Record<string, { sales: number; purchase: number; profit: number }> = {}

    filteredSales.forEach((order) => {
      const date = format(new Date(order.salesDate), 'yyyy-MM-dd')
      if (!dailyMap[date]) dailyMap[date] = { sales: 0, purchase: 0, profit: 0 }
      dailyMap[date].sales += order.totalAmount
    })

    filteredPurchases.forEach((order) => {
      const date = format(new Date(order.purchaseDate), 'yyyy-MM-dd')
      if (!dailyMap[date]) dailyMap[date] = { sales: 0, purchase: 0, profit: 0 }
      dailyMap[date].purchase += order.totalAmount
    })

    const result = []
    for (let i = 0; i < days; i++) {
      const date = format(subDays(endOfDay(getDateRange.end), days - 1 - i), 'yyyy-MM-dd')
      const data = dailyMap[date] || { sales: 0, purchase: 0, profit: 0 }
      result.push({
        date: format(new Date(date), 'MM-dd'),
        sales: data.sales,
        purchase: data.purchase,
        profit: data.sales - data.purchase,
      })
    }

    return result
  }, [filteredSales, filteredPurchases, dateRange, getDateRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/report')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">利润报表</h1>
          <p className="text-gray-600 mt-1">查看利润数据统计和分析</p>
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
            <Button variant="outline" className="h-[38px]">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
            <Button className="h-[38px] bg-primary-600">
              <Download className="w-4 h-4 mr-2" />
              导出报表
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">销售收入</div>
          <div className="text-2xl font-semibold text-green-600">¥{stats.salesAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">采购成本</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.purchaseAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">毛利润</div>
          <div className="text-2xl font-semibold text-blue-600">¥{stats.grossProfit.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">利润率</div>
          <div className="text-2xl font-semibold">{stats.profitRate.toFixed(2)}%</div>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">利润趋势分析</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="销售收入" />
              <Line type="monotone" dataKey="purchase" stroke="#ef4444" strokeWidth={2} name="采购成本" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="毛利润" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default ProfitReport







