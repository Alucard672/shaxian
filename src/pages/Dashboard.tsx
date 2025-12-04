import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Table from '../components/ui/Table'
import {
  Home,
  ShoppingCart,
  DollarSign,
  Warehouse,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Bell,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

function Dashboard() {
  const { getStats, getRecentOrders, getAlerts } = useDashboardStore()
  const stats = useMemo(() => getStats(), [])
  const recentOrders = useMemo(() => getRecentOrders(), [])
  const alerts = useMemo(() => getAlerts(), [])

  const today = format(new Date(), 'yyyy年MM月dd日 EEEE')

  // 关键指标卡片
  const statCards = [
    {
      label: '今日销售额',
      value: `¥${stats.todaySales.toLocaleString()}`,
      change: stats.todaySalesChange,
      icon: DollarSign,
      iconColor: 'text-success-500',
      bgColor: 'bg-success-50',
    },
    {
      label: '今日进货额',
      value: `¥${stats.todayPurchases.toLocaleString()}`,
      change: stats.todayPurchasesChange,
      icon: ShoppingCart,
      iconColor: 'text-primary-500',
      bgColor: 'bg-primary-50',
    },
    {
      label: '库存总值',
      value: `¥${stats.totalInventoryValue.toLocaleString()}`,
      change: stats.totalInventoryValueChange,
      icon: Warehouse,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: '待收账款',
      value: `¥${stats.accountsReceivable.toLocaleString()}`,
      change: stats.accountsReceivableChange,
      icon: BarChart3,
      iconColor: 'text-warning-500',
      bgColor: 'bg-warning-50',
    },
  ]

  // 快捷操作
  const quickActions = [
    {
      label: '新建进货单',
      icon: ShoppingCart,
      color: 'bg-primary-500 hover:bg-primary-600',
      link: '/purchase/create',
    },
    {
      label: '新建销售单',
      icon: DollarSign,
      color: 'bg-success-500 hover:bg-success-600',
      link: '/sales/create',
    },
    {
      label: '库存查询',
      icon: Warehouse,
      color: 'bg-purple-500 hover:bg-purple-600',
      link: '/inventory',
    },
    {
      label: '销售报表',
      icon: BarChart3,
      color: 'bg-warning-500 hover:bg-warning-600',
      link: '/report',
    },
  ]

  // 最近单据表格列
  const orderColumns = [
    {
      key: 'orderNumber',
      title: '单据编号',
      dataIndex: 'orderNumber' as const,
    },
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: any) => (
        <span className="text-primary-600">{record.type}</span>
      ),
    },
    {
      key: 'counterparty',
      title: '往来单位',
      dataIndex: 'counterparty' as const,
    },
    {
      key: 'amount',
      title: '金额',
      render: (_: any, record: any) => (
        <span className="font-medium">¥{record.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: any) => {
        const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'gray' }> = {
          '待审核': { label: '待审核', variant: 'warning' },
          '已审核': { label: '已审核', variant: 'success' },
          '已出库': { label: '已出库', variant: 'success' },
          '已入库': { label: '已入库', variant: 'success' },
          '已作废': { label: '已作废', variant: 'gray' },
        }
        const status = statusMap[record.status] || { label: record.status, variant: 'gray' as const }
        return <Badge variant={status.variant}>{status.label}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="w-4 h-4" />
        <span>/</span>
        <span className="text-gray-900">工作台</span>
      </div>

      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">欢迎回来,管理员!</h1>
            <p className="text-primary-100">今天是个美好的一天,让我们开始高效的工作吧</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium">{today}</div>
          </div>
        </div>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const hasChange = card.change !== 0
          const isPositive = card.change > 0
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                {hasChange && (
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{isPositive ? '+' : ''}{card.change}%</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">{card.label}</div>
              <div className="text-lg font-semibold text-gray-900">{card.value}</div>
            </Card>
          )
        })}
      </div>

      {/* 快捷操作 */}
      <Card title="快捷操作">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 重要提醒 */}
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span>重要提醒</span>
              {alerts.length > 0 && (
                <Badge variant="danger" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </div>
          }
        >
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无提醒</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                let bgColor = ''
                let Icon = Bell
                if (alert.type === 'warning') {
                  bgColor = 'bg-warning-50 border-warning-200'
                  Icon = AlertTriangle
                } else if (alert.type === 'error') {
                  bgColor = 'bg-danger-50 border-danger-200'
                  Icon = AlertCircle
                } else {
                  bgColor = 'bg-primary-50 border-primary-200'
                  Icon = Bell
                }

                return (
                  <div
                    key={index}
                    className={`${bgColor} border-l-4 rounded-lg p-4 flex items-start gap-3`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      alert.type === 'warning' ? 'text-warning-600' :
                      alert.type === 'error' ? 'text-danger-600' :
                      'text-primary-600'
                    }`} />
                    <p className="text-sm text-gray-700 flex-1">{alert.message}</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* 最近单据 */}
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span>最近单据</span>
              <Link
                to="/purchase"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无单据</p>
          ) : (
            <Table columns={orderColumns} data={recentOrders} />
          )}
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
