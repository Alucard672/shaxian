import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { SalesOrder, SalesOrderStatus } from '@/types/sales'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  AlertCircle,
  Download,
  Filter,
  CheckCircle,
  Search,
  Eye,
} from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import SalesDetail from '../../components/sales/SalesDetail'
import DateRangePicker from '../../components/ui/DateRangePicker'

function SalesList() {
  const navigate = useNavigate()
  const { orders, deleteOrder } = useSalesStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null)
  const pageSize = 10

  // 统计数据
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    const todayOrders = orders.filter(
      (o) => o.salesDate === today
    )
    
    const completedOrders = orders.filter(
      (o) => o.status === '已出库'
    )
    
    const todayAmount = todayOrders
      .filter((o) => o.status === '已出库')
      .reduce((sum, o) => sum + o.totalAmount, 0)
    
    const pendingCollection = orders
      .filter((o) => o.status === '已出库' && o.unpaidAmount > 0)
      .reduce((sum, o) => sum + o.unpaidAmount, 0)
    
    return {
      todayOrdersCount: todayOrders.length,
      completedCount: completedOrders.length,
      todayAmount,
      pendingCollection,
    }
  }, [orders])

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders

    // 状态筛选
    if (statusFilter !== '全部') {
      if (statusFilter === '已完成') {
        result = result.filter((o) => o.status === '已出库')
      } else {
        result = result.filter((o) => o.status === statusFilter)
      }
    }

    // 日期筛选
    if (startDate || endDate) {
      result = result.filter((o) => {
        if (!o.salesDate) return false
        const orderDate = parseISO(o.salesDate)
        
        if (startDate && endDate) {
          const start = startOfDay(parseISO(startDate))
          const end = endOfDay(parseISO(endDate))
          return (orderDate >= start && orderDate <= end)
        } else if (startDate) {
          const start = startOfDay(parseISO(startDate))
          return orderDate >= start
        } else if (endDate) {
          const end = endOfDay(parseISO(endDate))
          return orderDate <= end
        }
        return true
      })
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(keyword) ||
          o.customerName.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [orders, statusFilter, searchKeyword, startDate, endDate])

  // 分页数据
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredOrders.slice(start, end)
  }, [filteredOrders, currentPage])

  // 操作处理
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个销售单吗？')) {
      deleteOrder(id)
    }
  }

  const handleCollect = (order: SalesOrder) => {
    // TODO: 打开收款弹窗
    window.location.href = `/account/receivable?orderId=${order.id}`
  }

  // 统计卡片 - 变化指标基于实际数据，数据为空时不显示变化
  const statCards = [
    {
      label: '今日销售单',
      value: stats.todayOrdersCount,
      change: null, // 暂时不显示变化，等有历史数据后再计算
      icon: FileText,
      iconBg: 'bg-green-100',
      bgColor: 'bg-green-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-green-600',
    },
    {
      label: '已完成',
      value: stats.completedCount,
      change: null,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      bgColor: 'bg-green-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-green-600',
    },
    {
      label: '今日销售额',
      value: `¥${stats.todayAmount.toLocaleString()}`,
      change: null,
      icon: DollarSign,
      iconBg: 'bg-purple-100',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-green-600',
    },
    {
      label: '待收款',
      value: `¥${stats.pendingCollection.toLocaleString()}`,
      change: null,
      icon: AlertCircle,
      iconBg: 'bg-orange-100',
      bgColor: 'bg-orange-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-red-600',
    },
  ]

  // 表格列定义
  const orderColumns = [
    {
      key: 'orderNumber',
      title: '销售单号',
      width: '194.86px',
      render: (_: any, record: SalesOrder) => (
        <div 
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => {
            setViewingOrder(record)
            setIsDetailModalOpen(true)
          }}
        >
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900 font-medium">{record.orderNumber}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      title: '客户',
      width: '164.26px',
      render: (_: any, record: SalesOrder) => (
        <span className="text-gray-900">{record.customerName}</span>
      ),
    },
    {
      key: 'date',
      title: '销售日期',
      width: '127.74px',
      render: (_: any, record: SalesOrder) => (
        <span className="text-gray-600">{record.salesDate}</span>
      ),
    },
    {
      key: 'items',
      title: '商品数量',
      width: '106.77px',
      render: (_: any, record: SalesOrder) => (
        <span className="text-gray-900">{record.items.length} 项</span>
      ),
    },
    {
      key: 'amount',
      title: '销售金额',
      width: '112.27px',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-gray-900">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'payment',
      title: '已付/未付',
      width: '112.27px',
      render: (_: any, record: SalesOrder) => {
        const paidAmount = record.receivedAmount || 0
        const unpaidAmount = record.unpaidAmount || 0
        
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-green-600 text-sm">
              ¥{paidAmount.toLocaleString()}
            </span>
            {unpaidAmount > 0 && (
              <span className="text-red-600 text-sm">
                ¥{unpaidAmount.toLocaleString()}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '127.3px',
      render: (_: any, record: SalesOrder) => {
        const isCompleted = record.status === '已出库'
        const isDraft = record.status === '草稿'
        return (
          <div className="flex items-center gap-2">
            {isCompleted && (
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            )}
            {isDraft && (
              <FileText className="w-3.5 h-3.5 text-gray-600" />
            )}
            <Badge
              variant={isCompleted ? 'success' : 'gray'}
              className={isCompleted 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-900'
              }
            >
              {isCompleted ? '已完成' : record.status}
            </Badge>
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '290px',
      render: (_: any, record: SalesOrder) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewingOrder(record)
              setIsDetailModalOpen(true)
            }}
            title="查看"
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate(`/sales/${record.id}/edit`)
            }}
            title="编辑"
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            title="删除"
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </Button>
          {record.status === '已出库' && record.unpaidAmount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCollect(record)}
              className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-sm font-medium"
            >
              收款
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">销售管理</h1>
        <p className="text-gray-600">
          管理商品销售出库流程,支持销售单创建、库存校验和出库操作
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={`p-4 border ${card.borderColor} ${card.bgColor} rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                {card.change && (
                  <div className={`px-1.5 py-0.5 bg-green-100 ${card.changeColor} text-xs font-medium rounded`}>
                    {card.change}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">{card.label}</div>
              <div className="text-base font-semibold text-gray-900">{card.value}</div>
            </Card>
          )
        })}
      </div>

      {/* 筛选和操作栏 */}
      <Card className="p-4 rounded-2xl border-gray-200">
        <div className="space-y-4">
          {/* 第一行：日期筛选、搜索框、筛选、导出、新建 */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* 日期范围选择器 */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date)
                setCurrentPage(1)
              }}
              onEndDateChange={(date) => {
                setEndDate(date)
                setCurrentPage(1)
              }}
              className="w-full max-w-[320px]"
            />
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索销售单号、客户..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* 右侧操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 筛选按钮 */}
              <Button variant="outline" className="h-9 rounded-xl border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
              {/* 导出按钮 */}
              <Button variant="outline" className="h-9 rounded-lg border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
              {/* 新建销售单按钮 */}
              <Link to="/sales/create">
                <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新建销售单
                </Button>
              </Link>
            </div>
          </div>

          {/* 第二行：状态筛选按钮组 */}
          <div className="flex items-center gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={() => setStatusFilter('全部')}
              className={`px-4 h-8 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === '全部'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter('草稿')}
              className={`px-4 h-8 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === '草稿'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              草稿
            </button>
            <button
              onClick={() => setStatusFilter('已完成')}
              className={`px-4 h-8 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === '已完成'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              已完成
            </button>
          </div>
        </div>
      </Card>

      {/* 销售单列表表格 */}
      <Card className="rounded-2xl border-gray-200 overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || statusFilter !== '全部'
              ? '未找到匹配的销售单'
              : '暂无销售单，请创建销售单'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {orderColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-4 text-left text-sm font-bold text-gray-700"
                        style={{ width: column.width }}
                      >
                        {column.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {orderColumns.map((column) => {
                        return (
                          <td
                            key={column.key}
                            className="px-6 py-5 text-sm"
                            style={{ width: column.width }}
                          >
                            {column.render
                              ? (column.render as any)(null, record, index)
                              : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">共 {filteredOrders.length} 条记录</span>
              <Pagination
                current={currentPage}
                total={filteredOrders.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showTotal={false}
                totalText={`共 ${filteredOrders.length} 条记录`}
              />
            </div>
          </>
        )}
      </Card>

      {/* 详情模态框 */}
      {isDetailModalOpen && viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsDetailModalOpen(false)
              setViewingOrder(null)
            }}
          />
          {/* 详情内容 */}
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <SalesDetail
              order={viewingOrder}
              onEdit={() => {
                setIsDetailModalOpen(false)
                navigate(`/sales/${viewingOrder.id}/edit`)
              }}
              onPrint={() => {
                import('@/utils/printDocument').then(({ printOrder }) => {
                  printOrder('销售单', viewingOrder)
                })
              }}
              onClose={() => {
                setIsDetailModalOpen(false)
                setViewingOrder(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesList
