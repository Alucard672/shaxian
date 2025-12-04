import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDyeingStore } from '@/store/dyeingStore'
import { DyeingOrder, DyeingOrderStatus } from '@/types/dyeing'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import DyeingDetail from '../../components/dyeing/DyeingDetail'
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Clock,
  Loader,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { parseISO, startOfDay, endOfDay } from 'date-fns'
import DateRangePicker from '../../components/ui/DateRangePicker'

function DyeingList() {
  const navigate = useNavigate()
  const { orders, deleteOrder } = useDyeingStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部状态')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<DyeingOrder | null>(null)
  const pageSize = 10

  // 统计数据
  const stats = useMemo(() => {
    const allCount = orders.length
    const pendingShipment = orders.filter((o) => o.status === '待发货').length
    const inProgress = orders.filter((o) => o.status === '加工中').length
    const completed = orders.filter((o) => o.status === '已完成').length

    return {
      allCount,
      pendingShipment,
      inProgress,
      completed,
    }
  }, [orders])

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders

    // 状态筛选
    if (statusFilter !== '全部状态') {
      result = result.filter((o) => o.status === statusFilter)
    }

    // 日期筛选（使用发货日期）
    if (startDate || endDate) {
      result = result.filter((o) => {
        if (!o.shipmentDate) return false
        const orderDate = parseISO(o.shipmentDate)
        
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
          o.productName.toLowerCase().includes(keyword) ||
          o.greyBatchCode.toLowerCase().includes(keyword) ||
          o.factoryName.toLowerCase().includes(keyword)
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
    if (confirm('确定要删除这个加工单吗？')) {
      deleteOrder(id)
    }
  }

  const handleViewOrder = (order: DyeingOrder) => {
    setViewingOrder(order)
    setIsDetailModalOpen(true)
  }

  // 统计卡片
  const statCards = [
    {
      label: '全部加工单',
      value: stats.allCount,
      icon: FileText,
      iconBg: 'bg-gray-100',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      label: '待发货',
      value: stats.pendingShipment,
      icon: Clock,
      iconBg: 'bg-gray-100',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      label: '加工中',
      value: stats.inProgress,
      icon: Loader,
      iconBg: 'bg-blue-100',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
    {
      label: '已完成',
      value: stats.completed,
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      bgColor: 'bg-white',
      borderColor: 'border-gray-200',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">染色加工</h1>
        <p className="text-sm text-gray-600">
          管理纱线染色加工流程，支持白坯纱线分染成多个色号
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={`p-4 border ${card.borderColor} ${card.bgColor} rounded-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">{card.label}</div>
                  <div className="text-base font-semibold text-gray-900">{card.value}</div>
                </div>
                <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={cn('w-4 h-4', {
                    'text-gray-700': card.iconBg === 'bg-gray-100',
                    'text-blue-600': card.iconBg === 'bg-blue-100',
                    'text-green-600': card.iconBg === 'bg-green-100',
                  })} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 操作栏 */}
      <Card className="p-4 rounded-xl border-gray-200">
        <div className="space-y-4">
          {/* 第一行：日期筛选、搜索框、状态、新建 */}
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
                placeholder="搜索加工单号、商品、加工厂..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* 状态下拉选择器 */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-[140px] pl-3 pr-10 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option>全部状态</option>
                <option>待发货</option>
                <option>加工中</option>
                <option>已完成</option>
                <option>已入库</option>
                <option>已取消</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* 新建加工单按钮 */}
            <Link to="/dyeing/create">
              <Button className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新建加工单
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* 加工单列表表格 */}
      <Card className="rounded-2xl border-gray-200 overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || statusFilter !== '全部状态'
              ? '未找到匹配的加工单'
              : '暂无加工单，请创建加工单'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '169px' }}>加工单号</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '100px' }}>商品名称</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '172px' }}>白坯缸号</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '100px' }}>目标色号</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '91px' }}>加工数量</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '94px' }}>加工厂</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '109px' }}>发货日期</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '110px' }}>预计完成</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '117px' }}>状态</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700" style={{ width: '136px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    // 获取第一个目标色号用于显示
                    const firstItem = order.items[0]
                    // 计算总加工数量
                    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
                    
                    return (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 text-sm">
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleViewOrder(order)}
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-blue-600">{order.orderNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-900">{order.productName}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{order.greyBatchCode}</td>
                        <td className="px-6 py-5 text-sm">
                          {firstItem && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: firstItem.targetColorValue || '#E5E7EB' }}
                              />
                              <span className="text-gray-700">{firstItem.targetColorName}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-900">{totalQuantity} kg</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{order.factoryName}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{order.shipmentDate}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">{order.expectedCompletionDate}</td>
                        <td className="px-6 py-5 text-sm">
                          <div className="flex items-center gap-2">
                            {order.status === '已完成' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {order.status === '加工中' && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
                            {order.status === '待发货' && <Clock className="w-4 h-4 text-gray-600" />}
                            <Badge
                              variant={order.status === '已完成' ? 'success' : 'gray'}
                              className={cn({
                                'bg-green-100 text-green-700': order.status === '已完成',
                                'bg-blue-100 text-blue-700': order.status === '加工中',
                                'bg-gray-100 text-gray-700': order.status === '待发货',
                              })}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl"
                              title="查看"
                            >
                              <FileText className="w-4 h-4 text-gray-600" />
                            </Button>
                            {order.status === '待发货' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigate(`/dyeing/${order.id}/edit`)
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-xl"
                                  title="编辑"
                                >
                                  <Edit className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(order.id)}
                                  className="p-1.5 hover:bg-red-100 rounded-xl"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
            <DyeingDetail
              order={viewingOrder}
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

export default DyeingList
