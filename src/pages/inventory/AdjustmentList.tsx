import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdjustmentStore } from '@/store/adjustmentStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import {
  Settings,
  Download,
  Search,
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { AdjustmentType, AdjustmentStatus } from '@/types/adjustment'
import DateRangePicker from '../../components/ui/DateRangePicker'

function AdjustmentList() {
  const navigate = useNavigate()
  const { orders, deleteOrder, completeOrder } = useAdjustmentStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'全部状态' | '草稿' | '已完成'>('全部状态')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders

    // 按状态筛选
    if (statusFilter !== '全部状态') {
      result = result.filter((order) => order.status === statusFilter)
    }

    // 日期筛选
    if (startDate || endDate) {
      result = result.filter((order) => {
        if (!order.adjustmentDate) return false
        const orderDate = parseISO(order.adjustmentDate)
        
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
        (order) =>
          order.orderNumber.toLowerCase().includes(keyword) ||
          order.operator.toLowerCase().includes(keyword) ||
          order.remark?.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.adjustmentDate).getTime() - new Date(a.adjustmentDate).getTime()
    )
  }, [orders, statusFilter, searchKeyword, startDate, endDate])

  // 分页数据
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredOrders.slice(start, end)
  }, [filteredOrders, currentPage])

  // 调整类型颜色映射
  const getTypeColor = (type: AdjustmentType) => {
    switch (type) {
      case '盘亏':
      case '报损':
        return 'bg-danger-100 text-danger-700'
      case '盘盈':
      case '调增':
        return 'bg-success-100 text-success-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此调整单吗？')) {
      deleteOrder(id)
    }
  }

  const handleComplete = (id: string) => {
    if (confirm('确定要完成此调整单吗？完成后将更新库存。')) {
      completeOrder(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">库存调整</h1>
          <p className="text-gray-600">管理库存调整、盘点盘盈盘亏、报损等记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/adjustment')}
            className="h-[38px] rounded-lg border-gray-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            调整记录
          </Button>
          <Button
            onClick={() => navigate('/inventory/adjustment/create')}
            className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建调整单
          </Button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="p-4 rounded-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
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
            <div className="relative flex-1 max-w-3xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索单据号、操作人、备注..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 h-[39px] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {/* 状态下拉 */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setCurrentPage(1)
              }}
              className="px-4 py-2 h-[39px] border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="全部状态">全部状态</option>
              <option value="草稿">草稿</option>
              <option value="已完成">已完成</option>
            </select>
            {/* 导出按钮 */}
            <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        </div>
      </Card>

      {/* 调整单表格 */}
      <Card className="rounded-xl overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || statusFilter !== '全部状态'
              ? '未找到匹配的调整单'
              : '暂无调整单记录'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">单据号</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">调整类型</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">日期</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">操作人</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">明细项数</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">调整总量</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">备注</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-base font-medium text-gray-900">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTypeColor(order.type)}>{order.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base text-gray-600">
                        {format(new Date(order.adjustmentDate), 'yyyy-MM-dd')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base text-gray-900">{order.operator}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-base text-gray-900">{order.items.length}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-base font-medium ${
                          order.totalQuantity < 0 ? 'text-danger-600' : 'text-gray-900'
                        }`}
                      >
                        {order.totalQuantity > 0 ? '+' : ''}
                        {order.totalQuantity} kg
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={
                          order.status === '已完成'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base text-gray-600">{order.remark || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === '草稿' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComplete(order.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl"
                              title="完成"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/inventory/adjustment/${order.id}/edit`)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </Button>
                          </>
                        )}
                        {order.status === '已完成' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/inventory/adjustment/${order.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-xl"
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AdjustmentList

