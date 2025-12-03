import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReportStore } from '@/store/reportStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  Users,
  Warehouse,
  CreditCard,
} from 'lucide-react'
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

type DateRange = '今日' | '本周' | '本月' | '本季度' | '本年' | '自定义'

function ReportManagement() {
  const navigate = useNavigate()
  const {
    getThisMonthSales,
    getThisMonthPurchases,
    getGrossProfit,
    getProfitRate,
    getSalesTrend,
    getProductSalesRanking,
    getCustomerSalesRanking,
  } = useReportStore()

  const [dateRange, setDateRange] = useState<DateRange>('本月')
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // 统计数据
  const stats = useMemo(() => {
    const sales = getThisMonthSales()
    const purchases = getThisMonthPurchases()
    const profit = getGrossProfit()
    const profitRate = getProfitRate()

    return {
      sales,
      purchases,
      profit,
      profitRate,
    }
  }, [])

  // 销售趋势数据
  const salesTrendData = useMemo(() => {
    return getSalesTrend(30)
  }, [])

  // 商品销售排行
  const productRanking = useMemo(() => {
    return getProductSalesRanking(5)
  }, [])

  // 客户销售排行
  const customerRanking = useMemo(() => {
    return getCustomerSalesRanking(5)
  }, [])

  // 统计卡片
  const statCards = [
    {
      label: '本月销售额',
      value: `¥${stats.sales.toLocaleString()}`,
      change: '+18.5%',
      icon: DollarSign,
      iconBg: 'bg-success-100',
      bgColor: 'bg-success-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '本月采购额',
      value: `¥${stats.purchases.toLocaleString()}`,
      change: '+12.3%',
      icon: Package,
      iconBg: 'bg-primary-100',
      bgColor: 'bg-primary-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '毛利润',
      value: `¥${stats.profit.toLocaleString()}`,
      change: '+22.8%',
      icon: TrendingUp,
      iconBg: 'bg-warning-100',
      bgColor: 'bg-warning-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '利润率',
      value: `${stats.profitRate.toFixed(1)}%`,
      change: '+3.2%',
      icon: RefreshCw,
      iconBg: 'bg-purple-100',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
  ]

  // 报表链接卡片
  const reportCards = [
    { label: '销售报表', icon: DollarSign, link: '/report/sales', iconBg: 'bg-success-100', borderColor: 'border-[#E5E5E5]', textColor: 'text-success-600', isActive: true },
    { label: '采购报表', icon: Package, link: '/report/purchase', iconBg: 'bg-primary-100', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
    { label: '库存报表', icon: Warehouse, link: '/report/inventory', iconBg: 'bg-purple-100', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
    { label: '利润报表', icon: TrendingUp, link: '/report/profit', iconBg: 'bg-warning-100', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
    { label: '客户报表', icon: Users, link: '/report/customer', iconBg: 'bg-gray-100', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
    { label: '资金报表', icon: CreditCard, link: '/report/fund', iconBg: 'bg-gray-100', borderColor: 'border-gray-200', textColor: 'text-gray-900' },
  ]

  // 日期范围按钮
  const dateRangeButtons: DateRange[] = ['今日', '本周', '本月', '本季度', '本年', '自定义']

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">统计报表</h1>
        <p className="text-gray-600">
          多维度数据统计与分析,支持报表导出和可视化展示
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const changeBgColor = 'bg-success-100'
          return (
            <Card key={index} className={`p-5 border ${card.borderColor} ${card.bgColor} rounded-2xl`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-600">{card.label}</div>
                  <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 ${changeBgColor} ${card.changeColor} text-xs font-medium rounded-lg flex items-center gap-1`}>
                    <TrendingUp className="w-3 h-3" />
                    {card.change}
                  </div>
                  <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 报表链接卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportCards.map((report, index) => {
          const Icon = report.icon
          return (
            <div
              key={index}
              className={`bg-white border-2 ${report.borderColor} rounded-2xl p-6 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                navigate(report.link)
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`w-12 h-12 ${report.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <span className={`text-sm font-medium ${report.textColor}`}>{report.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 日期筛选和操作 */}
      <Card className="p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dateRangeButtons.map((range) => (
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

      {/* 销售趋势分析 */}
      <Card className="p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">销售趋势分析</h2>
            <p className="text-sm text-gray-600">展示过去30天的销售额变化趋势</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'line'
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="折线图"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-primary-50 text-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="柱状图"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="h-80">
          {salesTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split('-').slice(1).join('-')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '销售额']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="销售额"
                  />
                </LineChart>
              ) : (
                <BarChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split('-').slice(1).join('-')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '销售额']}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name="销售额" />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50/20 rounded-xl border border-gray-200">
              <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 mb-1">图表展示区域</p>
              <p className="text-sm text-gray-400">这里将展示可视化的数据图表</p>
            </div>
          )}
        </div>
      </Card>

      {/* 排行榜 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 商品销售排行 */}
        <Card className="rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">商品销售排行</h2>
              <p className="text-sm text-gray-600">按销售额排序</p>
            </div>
            <span className="px-2.5 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
              TOP 5
            </span>
          </div>
          {productRanking.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无数据</p>
          ) : (
            <div className="p-6 space-y-4">
              {productRanking.map((item, index) => {
                const isPositive = item.change > 0
                const rankBg = index === 0 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                  : index === 1 
                  ? 'bg-gradient-to-b from-gray-400 to-gray-500'
                  : index === 2
                  ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                  : 'bg-gray-100'
                const rankText = index < 3 ? 'text-white' : 'text-gray-600'
                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-8 h-8 ${rankBg} ${rankText} rounded-xl flex items-center justify-center font-medium text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{item.productName}</div>
                        <div className="text-sm text-gray-500">
                          销量: {item.salesVolume.toLocaleString()} kg
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 text-sm">
                        ¥{item.salesAmount.toLocaleString()}
                      </div>
                      <div className={`text-xs flex items-center justify-end gap-1 ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                        {Math.abs(item.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 客户销售排行 */}
        <Card className="rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">客户销售排行</h2>
              <p className="text-sm text-gray-600">按交易额排序</p>
            </div>
            <span className="px-2.5 py-1 bg-gray-900 text-white text-sm font-medium rounded-full">
              TOP 5
            </span>
          </div>
          {customerRanking.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无数据</p>
          ) : (
            <div className="p-6 space-y-4">
              {customerRanking.map((item, index) => {
                const isPositive = item.change > 0
                const rankBg = index === 0 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                  : index === 1 
                  ? 'bg-gradient-to-b from-gray-400 to-gray-500'
                  : index === 2
                  ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                  : 'bg-gray-100'
                const rankText = index < 3 ? 'text-white' : 'text-gray-600'
                return (
                  <div
                    key={item.customerId}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-8 h-8 ${rankBg} ${rankText} rounded-xl flex items-center justify-center font-medium text-sm`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{item.customerName}</div>
                        <div className="text-sm text-gray-500">
                          订单数: {item.orderCount}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 text-sm">
                        ¥{item.totalAmount.toLocaleString()}
                      </div>
                      <div className={`text-xs flex items-center justify-end gap-1 ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
                        {Math.abs(item.change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ReportManagement
