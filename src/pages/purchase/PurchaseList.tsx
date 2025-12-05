import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePurchaseStore } from '@/store/purchaseStore'
import { PurchaseOrder, PurchaseOrderStatus } from '@/types/purchase'
import PurchaseDetail from '../../components/purchase/PurchaseDetail'
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
  Clock,
  Package,
  Download,
  Filter,
  CheckCircle,
  Search,
  Eye,
  Copy,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import DateRangePicker from '../../components/ui/DateRangePicker'

function PurchaseList() {
  const navigate = useNavigate()
  const { orders, deleteOrder } = usePurchaseStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)

  // 统计数据
  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    const todayOrders = orders.filter(
      (o) => o.purchaseDate === today
    )
    
    const completedOrders = orders.filter(
      (o) => o.status === '已入库'
    )
    
    const todayAmount = todayOrders
      .filter((o) => o.status === '已入库')
      .reduce((sum, o) => sum + o.totalAmount, 0)
    
    return {
      todayOrdersCount: todayOrders.length,
      completedCount: completedOrders.length,
      todayAmount,
    }
  }, [orders])

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders

    // 状态筛选
    if (statusFilter !== '全部') {
      if (statusFilter === '已完成') {
        result = result.filter((o) => o.status === '已入库')
      } else {
        result = result.filter((o) => o.status === statusFilter)
      }
    }

    // 日期筛选
    if (startDate || endDate) {
      result = result.filter((o) => {
        if (!o.purchaseDate) return false
        const orderDate = parseISO(o.purchaseDate)
        
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
          o.supplierName.toLowerCase().includes(keyword)
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


  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个进货单吗？')) {
      deleteOrder(id)
    }
  }

  const handleCopyOrder = (order: PurchaseOrder) => {
    // 复制进货单，导航到创建页面并传递复制参数
    navigate(`/purchase/create?copy=${order.id}`)
  }


  // 统计卡片 - 变化指标基于实际数据，数据为空时不显示变化
  const statCards = [
    {
      label: '今日进货单',
      value: stats.todayOrdersCount.toString(),
      change: null, // 暂时不显示变化，等有历史数据后再计算
      changeColor: 'text-green-600',
      icon: FileText,
      iconBg: 'bg-blue-100',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-gray-200',
    },
    {
      label: '已完成',
      value: stats.completedCount.toString(),
      change: null,
      changeColor: 'text-green-600',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      bgColor: 'bg-green-50/50',
      borderColor: 'border-gray-200',
    },
    {
      label: '今日进货额',
      value: `¥${stats.todayAmount.toLocaleString()}`,
      change: null,
      changeColor: 'text-green-600',
      icon: Package,
      iconBg: 'bg-purple-100',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-gray-200',
    },
  ]

  // 表格列定义
  const orderColumns = [
    {
      key: 'orderNumber',
      title: '进货单号',
      width: '236px',
      render: (_: any, record: PurchaseOrder) => (
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
      key: 'supplier',
      title: '供应商',
      width: '199px',
      render: (_: any, record: PurchaseOrder) => (
        <span className="text-sm text-gray-900">{record.supplierName}</span>
      ),
    },
    {
      key: 'date',
      title: '进货日期',
      width: '155px',
      render: (_: any, record: PurchaseOrder) => (
        <span className="text-sm text-gray-600">{record.purchaseDate}</span>
      ),
    },
    {
      key: 'items',
      title: '商品数量',
      width: '130px',
      render: (_: any, record: PurchaseOrder) => (
        <span className="text-sm text-gray-900">{record.items.length} 项</span>
      ),
    },
    {
      key: 'amount',
      title: '进货金额',
      width: '136px',
      render: (_: any, record: PurchaseOrder) => (
        <span className="text-sm text-gray-900">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '155px',
      render: (_: any, record: PurchaseOrder) => {
        const isCompleted = record.status === '已入库'
        const isDraft = record.status === '草稿'
        return (
          <div className="flex items-center gap-2">
            {isCompleted && (
              <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            )}
            {isDraft && (
              <FileText className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
            )}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {isCompleted ? '已完成' : record.status}
            </span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '224px',
      render: (_: any, record: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewingOrder(record)
              setIsDetailModalOpen(true)
            }}
            title="查看"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate(`/purchase/${record.id}/edit`)
            }}
            title="编辑"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyOrder(record)}
            title="复制"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Copy className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            title="删除"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">进货管理</h1>
        <p className="text-sm text-gray-600">
          管理商品采购入库流程，支持进货单创建和入库操作
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={`p-4 border ${card.borderColor} ${card.bgColor} rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-gray-700" />
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
                placeholder="搜索进货单号、供应商..."
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
              {/* 新建进货单按钮 */}
              <Link to="/purchase/create">
                <Button className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新建进货单
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

      {/* 进货单列表表格 */}
      <Card className="rounded-2xl border-gray-200 overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {searchKeyword || statusFilter !== '全部'
                ? '未找到匹配的进货单'
                : '暂无进货单，请创建进货单'}
            </p>
            {orders.length === 0 && !searchKeyword && statusFilter === '全部' && (
              <p className="text-xs text-gray-400 mt-2">
                提示：如需清空旧数据，请前往 <Link to="/settings/clear-data" className="text-blue-600 hover:underline">系统设置 → 清空数据</Link>
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 h-[53px]">
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
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors h-[61px]"
                    >
                      {orderColumns.map((column) => {
                        return (
                          <td
                            key={column.key}
                            className="px-6 py-4 text-sm"
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 h-8 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                {Array.from({ length: Math.ceil(filteredOrders.length / pageSize) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'min-w-[30px] h-8 rounded-xl text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(filteredOrders.length / pageSize)}
                  className="px-4 h-8 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
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
            <PurchaseDetail
              order={viewingOrder}
              onEdit={() => {
                setIsDetailModalOpen(false)
                navigate(`/purchase/${viewingOrder.id}/edit`)
              }}
              onPrint={() => {
                import('@/utils/printDocument').then(({ printOrder }) => {
                  printOrder('进货单', viewingOrder)
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

export default PurchaseList
