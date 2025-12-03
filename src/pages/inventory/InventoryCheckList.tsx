import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventoryCheckStore } from '@/store/inventoryCheckStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import {
  ClipboardList,
  Download,
  Search,
  Plus,
  Eye,
  Edit,
} from 'lucide-react'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { InventoryCheckStatus } from '@/types/inventoryCheck'
import DateRangePicker from '../../components/ui/DateRangePicker'

function InventoryCheckList() {
  const navigate = useNavigate()
  const { orders } = useInventoryCheckStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    '全部状态' | '计划中' | '盘点中' | '已完成' | '已取消'
  >('全部状态')
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
        if (!order.planDate) return false
        const orderDate = parseISO(order.planDate)
        
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
          order.name.toLowerCase().includes(keyword) ||
          order.warehouse.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.planDate).getTime() - new Date(a.planDate).getTime()
    )
  }, [orders, statusFilter, searchKeyword, startDate, endDate])

  // 分页数据
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredOrders.slice(start, end)
  }, [filteredOrders, currentPage])

  // 状态颜色映射
  const getStatusColor = (status: InventoryCheckStatus) => {
    switch (status) {
      case '已完成':
        return 'bg-success-100 text-success-700'
      case '盘点中':
        return 'bg-warning-100 text-warning-700'
      case '计划中':
        return 'bg-gray-100 text-gray-700'
      case '已取消':
        return 'bg-gray-100 text-gray-500'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 计算进度百分比
  const getProgressPercentage = (order: typeof orders[0]) => {
    if (order.progress.total === 0) return 0
    return Math.round((order.progress.completed / order.progress.total) * 100)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">库存盘点</h1>
          <p className="text-gray-600">创建盘点计划，执行实物盘点，生成盘盈盘亏调整单</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/inventory/check')}
            className="h-[38px] rounded-lg border-gray-300"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            盘点记录
          </Button>
          <Button
            onClick={() => navigate('/inventory/check/create')}
            className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建盘点
          </Button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="p-4 rounded-xl">
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
              placeholder="搜索盘点单号、盘点名称、仓库..."
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
            <option value="计划中">计划中</option>
            <option value="盘点中">盘点中</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
          </select>
          {/* 导出按钮 */}
          <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </Card>

      {/* 盘点单表格 */}
      <Card className="rounded-xl overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || statusFilter !== '全部状态'
              ? '未找到匹配的盘点单'
              : '暂无盘点单记录'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">盘点单号</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">盘点名称</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">仓库</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">计划日期</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">创建人</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">盘点进度</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">盘盈</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">盘亏</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">状态</th>
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
                        <span className="text-base text-gray-900">{order.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base text-gray-600">{order.warehouse}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base text-gray-600">
                          {format(new Date(order.planDate), 'yyyy-MM-dd')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base text-gray-900">{order.operator}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900">
                            {order.progress.completed}/{order.progress.total}
                          </span>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${getProgressPercentage(order)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-medium text-success-600">
                          {order.surplus > 0 ? `+${order.surplus}` : '0'} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-base font-medium text-danger-600">
                          {order.deficit > 0 ? `-${order.deficit}` : '0'} kg
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/inventory/check/${order.id}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-xl"
                            title="查看"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                          {order.status === '计划中' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/inventory/check/${order.id}/edit`)}
                              className="p-1.5 hover:bg-gray-100 rounded-xl"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredOrders.length > pageSize && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">共 {filteredOrders.length} 条记录</span>
                <Pagination
                  current={currentPage}
                  total={filteredOrders.length}
                  pageSize={pageSize}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default InventoryCheckList

