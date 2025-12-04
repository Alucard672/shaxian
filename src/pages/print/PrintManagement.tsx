import { useState, useMemo } from 'react'
import { usePrintStore } from '@/store/printStore'
import { useSalesStore } from '@/store/salesStore'
import { usePurchaseStore } from '@/store/purchaseStore'
import { PrintRecord, PrintDocumentType } from '@/types/print'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import Tabs from '../../components/ui/Tabs'
import TemplateManagement from '../../components/template/TemplateManagement'
import {
  Printer,
  Clock,
  FileText,
  Filter,
  Calendar,
  Settings,
  CheckSquare,
  History,
} from 'lucide-react'
import { format } from 'date-fns'

function PrintManagement() {
  const { getPrintRecords, getPrintRecordsByType, printDocument, getTodayPrintCount, getPendingPrintCount } = usePrintStore()
  const { orders: salesOrders } = useSalesStore()
  const { orders: purchaseOrders } = usePurchaseStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tabType, setTabType] = useState<'全部' | '销售单' | '进货单' | '待打印'>('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const [showTemplateManagement, setShowTemplateManagement] = useState(false)
  const pageSize = 10

  // 统计数据
  const stats = useMemo(() => {
    const todayPrintCount = getTodayPrintCount()
    const pendingPrintCount = getPendingPrintCount()
    const salesCount = salesOrders.length
    const purchaseCount = purchaseOrders.length

    return {
      todayPrintCount,
      pendingPrintCount,
      salesCount,
      purchaseCount,
    }
  }, [salesOrders, purchaseOrders])

  // 获取打印记录
  const allPrintRecords = useMemo(() => {
    return getPrintRecords()
  }, [salesOrders, purchaseOrders])

  // 筛选记录
  const filteredRecords = useMemo(() => {
    let result: PrintRecord[] = []

    if (tabType === '待打印') {
      result = allPrintRecords.filter((r) => r.status === '待打印')
    } else if (tabType === '全部') {
      result = allPrintRecords
    } else {
      result = getPrintRecordsByType(tabType as PrintDocumentType)
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (r) =>
          r.documentNumber.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [allPrintRecords, tabType, searchKeyword])

  // 分页数据
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredRecords.slice(start, end)
  }, [filteredRecords, currentPage])

  // 处理打印
  const handlePrint = (record: PrintRecord) => {
    // 更新打印记录
    printDocument(record.documentType, record.documentId, record.documentNumber)
    
    // 根据单据类型获取订单并打印
    if (record.documentType === '销售单') {
      const order = salesOrders.find((o) => o.id === record.documentId)
      if (order) {
        import('@/utils/printDocument').then(({ printOrder }) => {
          printOrder('销售单', order)
        })
      }
    } else if (record.documentType === '进货单') {
      const order = purchaseOrders.find((o) => o.id === record.documentId)
      if (order) {
        import('@/utils/printDocument').then(({ printOrder }) => {
          printOrder('进货单', order)
        })
      }
    }
  }

  // 统计卡片
  const statCards = [
    {
      label: '今日打印',
      value: stats.todayPrintCount,
      change: '+12',
      icon: Printer,
      iconColor: 'text-primary-500',
      bgColor: 'bg-primary-50',
    },
    {
      label: '待打印',
      value: stats.pendingPrintCount,
      change: '+3',
      icon: Clock,
      iconColor: 'text-warning-500',
      bgColor: 'bg-warning-50',
    },
    {
      label: '销售单',
      value: stats.salesCount,
      change: '+8',
      icon: FileText,
      iconColor: 'text-success-500',
      bgColor: 'bg-success-50',
    },
    {
      label: '进货单',
      value: stats.purchaseCount,
      change: '+5',
      icon: FileText,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ]

  // 快捷操作卡片
  const quickActionCards = [
    {
      label: '批量打印',
      icon: Printer,
      onClick: () => {
        // TODO: 批量打印功能
        console.log('批量打印')
      },
    },
    {
      label: '打印设置',
      icon: Settings,
      onClick: () => {
        // TODO: 打印设置
        console.log('打印设置')
      },
    },
    {
      label: '模板管理',
      icon: FileText,
      onClick: () => {
        setShowTemplateManagement(true)
      },
    },
    {
      label: '打印历史',
      icon: History,
      onClick: () => {
        // TODO: 打印历史
        console.log('打印历史')
      },
    },
  ]

  // 标签页
  const tabs = [
    { key: '全部', label: '全部' },
    { key: '销售单', label: '销售单' },
    { key: '进货单', label: '进货单' },
    { key: '待打印', label: '待打印' },
  ]

  // 获取单据详细信息
  const getDocumentInfo = (record: PrintRecord) => {
    if (record.documentType === '销售单') {
      const order = salesOrders.find((o) => o.id === record.documentId)
      return {
        counterparty: order?.customerName || '',
        date: order?.salesDate || '',
        itemCount: order?.items.length || 0,
        amount: order?.totalAmount || 0,
      }
    } else {
      const order = purchaseOrders.find((o) => o.id === record.documentId)
      return {
        counterparty: order?.supplierName || '',
        date: order?.purchaseDate || '',
        itemCount: order?.items.length || 0,
        amount: order?.totalAmount || 0,
      }
    }
  }

  // 表格列定义
  const recordColumns = [
    {
      key: 'documentType',
      title: '单据类型',
      render: (_: any, record: PrintRecord) => (
        <div className="flex items-center gap-2">
          <FileText className={`w-4 h-4 ${
            record.documentType === '销售单' ? 'text-success-500' : 'text-primary-500'
          }`} />
          <span>{record.documentType}</span>
        </div>
      ),
    },
    {
      key: 'documentNumber',
      title: '单据号',
      render: (_: any, record: PrintRecord) => (
        <span className="font-medium">{record.documentNumber}</span>
      ),
    },
    {
      key: 'counterparty',
      title: '往来单位',
      render: (_: any, record: PrintRecord) => {
        const info = getDocumentInfo(record)
        return <span>{info.counterparty}</span>
      },
    },
    {
      key: 'date',
      title: '单据日期',
      render: (_: any, record: PrintRecord) => {
        const info = getDocumentInfo(record)
        return <span>{info.date}</span>
      },
    },
    {
      key: 'itemCount',
      title: '商品数量',
      render: (_: any, record: PrintRecord) => {
        const info = getDocumentInfo(record)
        return <span>{info.itemCount}项</span>
      },
    },
    {
      key: 'amount',
      title: '金额',
      render: (_: any, record: PrintRecord) => {
        const info = getDocumentInfo(record)
        return <span className="font-medium">¥{info.amount.toLocaleString()}</span>
      },
    },
    {
      key: 'printCount',
      title: '打印次数',
      render: (_: any, record: PrintRecord) => (
        <span>{record.printCount}次</span>
      ),
    },
    {
      key: 'lastPrintTime',
      title: '最后打印时间',
      render: (_: any, record: PrintRecord) => (
        <span className="text-sm text-gray-600">
          {record.lastPrintTime
            ? format(new Date(record.lastPrintTime), 'yyyy-MM-dd HH:mm')
            : '未打印'}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: PrintRecord) => (
        <Badge variant={record.status === '已打印' ? 'success' : 'warning'}>
          {record.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: PrintRecord) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: 查看详情
              console.log('查看', record.documentId)
            }}
            title="查看"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePrint(record)}
            className="text-primary-600 hover:text-primary-700"
          >
            <Printer className="w-4 h-4 mr-1" />
            打印
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">打印管理</h1>
        <p className="text-gray-600">
          打印业务单据,支持自定义模板和批量打印
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <div className="text-xs text-success-500 font-medium">
                  {card.change}
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-1">{card.label}</div>
              <div className="text-lg font-semibold text-gray-900">{card.value}</div>
            </Card>
          )
        })}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActionCards.map((action, index) => {
          const Icon = action.icon
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={action.onClick}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 搜索和筛选栏 */}
      <Card>
        <div className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="选择日期范围"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>

          {/* 标签页和操作按钮 */}
          <div className="flex items-center justify-between">
            <Tabs
              items={tabs}
              activeKey={tabType}
              onChange={(key) => {
                setTabType(key as typeof tabType)
                setCurrentPage(1)
              }}
            />
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <CheckSquare className="w-4 h-4 mr-2" />
                批量选择
              </Button>
              <Button>
                <Printer className="w-4 h-4 mr-2" />
                批量打印
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 打印记录表格 */}
      <Card>
        {paginatedRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || tabType !== '全部'
              ? '未找到匹配的打印记录'
              : '暂无打印记录'}
          </p>
        ) : (
          <>
            <Table columns={recordColumns} data={paginatedRecords} />
            <div className="mt-4">
              <Pagination
                current={currentPage}
                total={filteredRecords.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                totalText={`共${filteredRecords.length}条记录`}
              />
            </div>
          </>
        )}
      </Card>

      {/* 模板管理模态窗口 */}
      <TemplateManagement
        isOpen={showTemplateManagement}
        onClose={() => setShowTemplateManagement(false)}
      />
    </div>
  )
}

export default PrintManagement
