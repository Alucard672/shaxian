import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { useContactStore } from '@/store/contactStore'
import { usePrintStore } from '@/store/printStore'
import { useSettingsStore } from '@/store/settingsStore'
import { SalesOrder, SalesOrderStatus } from '@/types/sales'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import DateRangePicker from '@/components/ui/DateRangePicker'
import VisibleColumnsConfigModal from '@/components/ui/VisibleColumnsConfigModal'
import { templateApi } from '@/api/client'
import { generatePrintContent, openPrintDialog } from '@/utils/printService'
import { Plus, Edit, Trash2, Eye, Search, ShoppingCart, Printer, LayoutList, Copy } from 'lucide-react'
import { formatAmount } from '@/utils/formatNumber'
import { getCustomerOrderNumberMap } from '@/utils/customerOrderNumber'
import { parseISO, startOfDay, endOfDay } from 'date-fns'

const SALES_DOC_KEY = 'sales-list'
const SALES_COLUMN_OPTIONS = [
  { id: 'orderNumber', label: '销售单号' },
  { id: 'customerOrderNumber', label: '客户单号' },
  { id: 'customerName', label: '客户' },
  { id: 'salesDate', label: '销售日期' },
  { id: 'totalAmount', label: '总金额' },
  { id: 'paidAmount', label: '已收金额' },
  { id: 'unpaidAmount', label: '欠款金额' },
  { id: 'status', label: '状态' },
  { id: 'operator', label: '经办人' },
]
const SALES_DEFAULT_VISIBLE = SALES_COLUMN_OPTIONS.map((c) => c.id)

// 状态显示：已入库/草稿 统一显示为 已完成
const displayStatus = (s: string) => (s === '已入库' || s === '草稿' ? '已完成' : s)

function SalesList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orders, loading, loadOrders, deleteOrder } = useSalesStore()
  const { customers } = useContactStore()
  const { addPrintRecord } = usePrintStore()
  const { getDocumentVisibleColumns } = useSettingsStore()
  const [showColumnsModal, setShowColumnsModal] = useState(false)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部状态')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    // 从创建页跳转而来时跳过重载，避免 API 返回的已收金额覆盖本地正确值
    if (!(location.state as any)?.fromCreate) {
      loadOrders()
    }
    useContactStore.getState().loadAll()
  }, [loadOrders])

  // 统计数据（防御：接口返回 null 时按空数组处理）
  const stats = useMemo(() => {
    const list = orders ?? []
    const allCount = list.length
    const pending = list.filter((o) => o.status === '待审核').length
    const completed = list.filter((o) => o.status === '已完成' || o.status === '草稿').length

    return {
      allCount,
      pending,
      completed,
    }
  }, [orders])

  const customerOrderNumberMap = useMemo(
    () => getCustomerOrderNumberMap(orders ?? []),
    [orders]
  )

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders ?? []

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

    // 关键词搜索（含客户单号）
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter((o) => {
        const custNo = customerOrderNumberMap.get(o.id)
        return (
          String(o.orderNumber ?? '').toLowerCase().includes(keyword) ||
          String(o.customerName ?? '').toLowerCase().includes(keyword) ||
          String(o.operator ?? '').toLowerCase().includes(keyword) ||
          (custNo != null && String(custNo).toLowerCase().includes(keyword))
        )
      })
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [orders, statusFilter, searchKeyword, startDate, endDate, customerOrderNumberMap])

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
        return 'bg-green-100 text-green-700'
      case '待审核':
        return 'bg-yellow-100 text-yellow-700'
      case '已审核':
        return 'bg-blue-100 text-blue-700'
      case '已完成':
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

  const handlePrint = async (order: SalesOrder) => {
    try {
      // 获取所有销售单模板
      const templates = await templateApi.getAll()
      const salesTemplates = templates.filter((t: any) => t.documentType === '销售单')

      if (salesTemplates.length === 0) {
        alert('未找到销售单打印模板，请先创建模板')
        return
      }

      let selectedTemplate: any

      // 如果只有一个模板，直接使用
      if (salesTemplates.length === 1) {
        selectedTemplate = salesTemplates[0]
      } else {
        // 如果有多个模板，弹出选择框
        const templateNames = salesTemplates.map((t: any) => t.name)
        const defaultIndex = salesTemplates.findIndex((t: any) => t.isDefault || false)
        const selectedIndex = defaultIndex >= 0 ? defaultIndex : 0
        
        const selectedName = prompt(
          `请选择打印模板：\n${templateNames.map((name: string, index: number) => `${index + 1}. ${name}`).join('\n')}\n\n请输入模板序号（1-${templateNames.length}）：`,
          String(selectedIndex + 1)
        )

        if (!selectedName) {
          return // 用户取消
        }

        const index = parseInt(selectedName) - 1
        if (isNaN(index) || index < 0 || index >= salesTemplates.length) {
          alert('无效的模板序号')
          return
        }

        selectedTemplate = salesTemplates[index]
      }

      // 获取客户信息
      const customer = customers.find((c) => c.name === order.customerName)

      // 生成打印内容
      const printData = {
        template: selectedTemplate,
        order: order,
        documentType: '销售单',
        customer: customer,
        customerOrderNumber: customerOrderNumberMap.get(order.id),
      }

      const htmlContent = generatePrintContent(printData as any)
      
      // 记录打印
      addPrintRecord('销售单', order.id, order.orderNumber)
      
      // 打开打印对话框
      openPrintDialog(htmlContent)
    } catch (error: any) {
      console.error('打印失败:', error)
      alert('打印失败：' + (error.message || '未知错误'))
    }
  }

  const visibleColumnKeys = getDocumentVisibleColumns(SALES_DOC_KEY, SALES_DEFAULT_VISIBLE)
  const allColumns = [
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
      key: 'customerOrderNumber',
      title: '客户单号',
      render: (_: any, record: SalesOrder) => {
        const n = customerOrderNumberMap.get(record.id)
        return <span className="text-sm text-gray-600">{n != null ? n : '-'}</span>
      },
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
          {formatAmount(record.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      title: '已收金额',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-gray-600">{formatAmount(record.paidAmount ?? 0)}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '欠款金额',
      render: (_: any, record: SalesOrder) => (
        <span className="text-sm text-red-600">
          {formatAmount(Math.max(0, Number(record.totalAmount ?? 0) - Number(record.paidAmount ?? 0)))}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: SalesOrder) => (
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
          {displayStatus(record.status)}
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
            onClick={() => handlePrint(record)}
            className="p-1.5 hover:bg-blue-50 rounded-xl"
            title="打印"
          >
            <Printer className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/sales/edit/${record.id}`)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
            title="编辑详情"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sales/create', { state: { copyFromId: record.id } })}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
            title="复制"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="p-1.5 hover:bg-red-50 rounded-xl"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]
  const columns = allColumns.filter((c) => c.key === 'actions' || visibleColumnKeys.includes(c.key))

  return (
    <div className="space-y-6 p-8">
      <VisibleColumnsConfigModal
        open={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        docKey={SALES_DOC_KEY}
        title="销售单列表"
        columns={SALES_COLUMN_OPTIONS}
        defaultVisible={SALES_DEFAULT_VISIBLE}
      />
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">销售管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理销售出货单</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnsModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="自定义列显示"
          >
            <LayoutList className="w-5 h-5" />
          </button>
          <Button
            onClick={() => navigate('/sales/create')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建销售单
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">全部销售单</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.allCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">待审核</div>
          <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">已完成</div>
          <div className="text-2xl font-semibold text-green-600">{stats.completed}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="搜索销售单号、客户单号、客户、经办人..."
                className="flex-1 input-underline px-0 py-2 text-sm focus:outline-none"
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
              className="w-full input-underline px-0 py-2 text-sm bg-transparent focus:outline-none"
            >
              <option value="全部状态">全部状态</option>
              <option value="待审核">待审核</option>
              <option value="已审核">已审核</option>
              <option value="已完成">已完成</option>
              <option value="已作废">已作废</option>
            </select>
          </div>
          <div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(value) => {
                setStartDate(value)
                setCurrentPage(1)
              }}
              onEndDateChange={(value) => {
                setEndDate(value)
                setCurrentPage(1)
              }}
              inputClassName="input-underline w-full px-0 py-2 text-sm border-0 rounded-none"
            />
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders()}
              className="w-full h-9 rounded-none border-0 border-b border-blue-300 bg-transparent text-blue-600 text-sm"
            >
              查询
            </Button>
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
