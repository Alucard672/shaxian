import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { SalesOrder, SalesOrderStatus } from '@/types/sales'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { Plus, Edit, Trash2, Eye, Search, ShoppingCart } from 'lucide-react'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

function SalesList() {
  const navigate = useNavigate()
  const { orders, loading, loadOrders, deleteOrder } = useSalesStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部状态')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 统计数据
  const stats = useMemo(() => {
    const allCount = orders.length
    const draft = orders.filter((o) => o.status === '草稿').length
    const pending = orders.filter((o) => o.status === '待审核').length
    const completed = orders.filter((o) => o.status === '已出库').length

    return {
      allCount,
      draft,
      pending,
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

    // 日期筛选
    if (startDate || endDate) {
      result = result.filter((o) => {
        if (!o.salesDate) return false
        const orderDate = parseISO(o.salesDate)

        if (startDate && endDate) {
          const start = startOfDay(parseISO(startDate))
          const end = endOfDay(parseISO(endDate))
          return orderDate >= start && orderDate <= end
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
          o.customerName.toLowerCase().includes(keyword) ||
          o.operator.toLowerCase().includes(keyword)
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

  // 状态颜色映射
  const getStatusColor = (status: SalesOrderStatus) => {
    switch (status) {
      case '草稿':
        return 'bg-gray-100 text-gray-700'
      case '待审核':
        return 'bg-yellow-100 text-yellow-700'
      case '已审核':
        return 'bg-blue-100 text-blue-700'
      case '已出库':
        return 'bg-green-100 text-green-700'
      case '已作废':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个销售单吗？')) {
      return
    }

    try {
      await deleteOrder(id)
      alert('销售单已删除')
    } catch (error: any) {
      alert('删除失败：' + (error.message || '未知错误'))
    }
  }

  const columns = [
    {
      key: 'orderNumber',
      title: '销售单号',
      render: (_: any, record: SalesOrder) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">{record.orderNumber}</span>
        </div>
      ),
    },
    {
      key: 'customerName',
      title: '客户',
      dataIndex: 'customerName' as const,
    },
    {
      key: 'salesDate',
      title: '销售日期',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-gray-600">
          {record.salesDate ? new Date(record.salesDate).toLocaleDateString('zh-CN') : '-'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: '总金额',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm font-medium text-gray-900">
          ¥{record.totalAmount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      title: '已收金额',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-gray-600">¥{record.paidAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '欠款金额',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-red-600">¥{record.unpaidAmount.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: SalesOrder) => (
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
          {record.status}
        </span>
      ),
    },
    {
      key: 'operator',
      title: '经办人',
      dataIndex: 'operator' as const,
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: SalesOrder) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales/${record.id}`)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales/edit/${record.id}`)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="p-1.5 hover:bg-red-50 rounded-xl"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">销售管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理销售出货单</p>
        </div>
        <Button
          onClick={() => navigate('/sales/create')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建销售单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">全部销售单</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.allCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">草稿</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.draft}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">待审核</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">已出库</div>
          <div className="text-2xl font-semibold text-green-600">{stats.completed}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="搜索销售单号、客户、经办人..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部状态">全部状态</option>
              <option value="草稿">草稿</option>
              <option value="待审核">待审核</option>
              <option value="已审核">已审核</option>
              <option value="已出库">已出库</option>
              <option value="已作废">已作废</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="开始日期"
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="结束日期"
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 销售单列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无销售单，点击"新建销售单"创建第一个销售单</p>
          </div>
        ) : (
          <>
            <Table columns={columns} data={paginatedOrders} rowKey={(record) => record.id} />
            {filteredOrders.length > pageSize && (
              <div className="p-4 border-t border-gray-200 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-gray-600">
                    第 {currentPage} 页，共 {Math.ceil(filteredOrders.length / pageSize)} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(Math.ceil(filteredOrders.length / pageSize), p + 1)
                      )
                    }
                    disabled={currentPage >= Math.ceil(filteredOrders.length / pageSize)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SalesList
