import { useState, useMemo, useEffect } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { useContactStore } from '@/store/contactStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import DateRangePicker from '../../components/ui/DateRangePicker'
import {
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Search,
  Wallet,
  FileText,
  List,
  Users,
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import AccountStatement from '../../components/account/AccountStatement'
import PaymentModal from '../../components/account/PaymentModal'
import PaymentListModal from '../../components/account/PaymentListModal'
import CounterpartyPaymentModal from '../../components/account/CounterpartyPaymentModal'
import BatchPaymentModal from '../../components/account/BatchPaymentModal'

type AccountType = '全部' | '应收账款' | '应付账款' | '逾期账款'
type ViewType = '流水' | '汇总'

function AccountManagement() {
  const {
    receivables,
    payables,
    receipts,
    payments,
    loading,
    error,
    loadAll,
  } = useAccountStore()
  const { customers, suppliers, loadAll: loadContacts } = useContactStore()
  
  // 加载数据
  useEffect(() => {
    loadAll()
    loadContacts()
  }, [loadAll, loadContacts])

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tabType, setTabType] = useState<AccountType>('全部')
  const [viewType, setViewType] = useState<ViewType>('流水')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [currentPage, setCurrentPage] = useState(1)
  const [showStatement, setShowStatement] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentList, setShowPaymentList] = useState(false)
  const [showCounterpartyPayment, setShowCounterpartyPayment] = useState(false)
  const [showBatchPayment, setShowBatchPayment] = useState(false)
  const [selectedCounterparty, setSelectedCounterparty] = useState<{
    id: string
    name: string
    type: 'customer' | 'supplier'
  } | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<{
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  } | null>(null)
  const [selectedBatchAccounts, setSelectedBatchAccounts] = useState<Array<{
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  }>>([])
  const pageSize = 10

  // 统计数据（防御：接口返回 null 时按空数组处理）
  const stats = useMemo(() => {
    const r = receivables ?? []
    const p = payables ?? []
    const rpts = receipts ?? []
    const pmts = payments ?? []
    const totalReceivable = r
      .filter((x) => x.status === '未结清')
      .reduce((sum, x) => sum + x.unpaidAmount, 0)
    
    const totalPayable = p
      .filter((x) => x.status === '未结清')
      .reduce((sum, x) => sum + x.unpaidAmount, 0)
    
    const today = new Date()
    const overdueReceivables = r.filter((x) => {
      if (x.status === '已结清') return false
      const daysDiff = differenceInDays(today, new Date(x.accountDate))
      return daysDiff > 15
    })
    const overduePayables = p.filter((x) => {
      if (x.status === '已结清') return false
      const daysDiff = differenceInDays(today, new Date(x.accountDate))
      return daysDiff > 15
    })
    const totalOverdue = overdueReceivables.reduce((sum, x) => sum + x.unpaidAmount, 0) +
      overduePayables.reduce((sum, x) => sum + x.unpaidAmount, 0)
    
    const thisMonthReceipts = rpts.reduce((sum, x) => sum + x.amount, 0)
    const thisMonthPayments = pmts.reduce((sum, x) => sum + x.amount, 0)
    const thisMonthTotal = thisMonthReceipts + thisMonthPayments
    
    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      thisMonthTotal,
      overdueCount: overdueReceivables.length + overduePayables.length,
    }
  }, [receivables, payables, receipts, payments])

  // 流水视图：合并应收和应付账款数据（防御 null）
  const allAccounts = useMemo(() => {
    const r = receivables ?? []
    const p = payables ?? []
    const receivableAccounts = r.map((x) => ({
      id: x.id,
      type: '应收' as const,
      counterpartyId: x.customerId,
      counterpartyName: x.customerName,
      relatedDocument: x.salesOrderNumber,
      documentDate: x.accountDate,
      totalAmount: x.receivableAmount,
      paidAmount: x.receivedAmount,
      unpaidAmount: x.unpaidAmount,
      dueDate: x.accountDate,
      status: x.status,
      account: x,
    }))
    
    const payableAccounts = p.map((x) => ({
      id: x.id,
      type: '应付' as const,
      counterpartyId: x.supplierId,
      counterpartyName: x.supplierName,
      relatedDocument: x.purchaseOrderNumber,
      documentDate: x.accountDate,
      totalAmount: x.payableAmount,
      paidAmount: x.paidAmount,
      unpaidAmount: x.unpaidAmount,
      dueDate: x.accountDate,
      status: x.status,
      account: x,
    }))
    
    return [...receivableAccounts, ...payableAccounts]
  }, [receivables, payables])

  // 汇总视图：按单位汇总（防御 null）
  const summaryData = useMemo(() => {
    const cust = customers ?? []
    const r = receivables ?? []
    const p = payables ?? []
    // 客户汇总
    const customerSummary = cust.map((customer) => {
      const customerReceivables = r.filter((x) => x.customerId === customer.id)
      const totalAmount = customerReceivables.reduce((sum, x) => sum + x.receivableAmount, 0)
      const paidAmount = customerReceivables.reduce((sum, x) => sum + x.receivedAmount, 0)
      const unpaidAmount = customerReceivables.reduce((sum, x) => sum + x.unpaidAmount, 0)
      const orderCount = customerReceivables.length
      const unpaidCount = customerReceivables.filter((x) => x.status === '未结清').length

      return {
        id: customer.id,
        name: customer.name,
        code: customer.code,
        type: 'customer' as const,
        totalAmount,
        paidAmount,
        unpaidAmount,
        orderCount,
        unpaidCount,
        lastOrderDate: customerReceivables.length > 0
          ? customerReceivables.sort((a, b) => new Date(b.accountDate).getTime() - new Date(a.accountDate).getTime())[0].accountDate
          : '-',
      }
    }).filter((c) => c.totalAmount > 0)

    // 供应商汇总
    const supplierSummary = (suppliers ?? []).map((supplier) => {
      const supplierPayables = p.filter((x) => x.supplierId === supplier.id)
      const totalAmount = supplierPayables.reduce((sum, x) => sum + x.payableAmount, 0)
      const paidAmount = supplierPayables.reduce((sum, x) => sum + x.paidAmount, 0)
      const unpaidAmount = supplierPayables.reduce((sum, x) => sum + x.unpaidAmount, 0)
      const orderCount = supplierPayables.length
      const unpaidCount = supplierPayables.filter((x) => x.status === '未结清').length

      return {
        id: supplier.id,
        name: supplier.name,
        code: supplier.code,
        type: 'supplier' as const,
        totalAmount,
        paidAmount,
        unpaidAmount,
        orderCount,
        unpaidCount,
        lastOrderDate: supplierPayables.length > 0
          ? supplierPayables.sort((a, b) => new Date(b.accountDate).getTime() - new Date(a.accountDate).getTime())[0].accountDate
          : '-',
      }
    }).filter((s) => s.totalAmount > 0)

    return [...customerSummary, ...supplierSummary]
  }, [customers, suppliers, receivables, payables])

  // 筛选流水数据
  const filteredAccounts = useMemo(() => {
    let result = allAccounts

    if (tabType === '应收账款') {
      result = result.filter((a) => a.type === '应收')
    } else if (tabType === '应付账款') {
      result = result.filter((a) => a.type === '应付')
    } else if (tabType === '逾期账款') {
      const today = new Date()
      result = result.filter((a) => {
        if (a.status === '已结清') return false
        const daysDiff = differenceInDays(today, new Date(a.dueDate))
        return daysDiff > 15
      })
    }

    // 日期范围筛选
    if (startDate || endDate) {
      result = result.filter((a) => {
        const accountDate = new Date(a.documentDate)
        if (startDate && accountDate < new Date(startDate)) return false
        if (endDate && accountDate > new Date(endDate)) return false
        return true
      })
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter((a) => {
        return (
          String(a.counterpartyName ?? '').toLowerCase().includes(keyword) ||
          String(a.relatedDocument ?? '').toLowerCase().includes(keyword)
        )
      })
    }

    return result.sort(
      (a, b) => new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    )
  }, [allAccounts, tabType, searchKeyword, startDate, endDate])

  // 筛选汇总数据
  const filteredSummary = useMemo(() => {
    let result = summaryData

    if (tabType === '应收账款') {
      result = result.filter((s) => s.type === 'customer')
    } else if (tabType === '应付账款') {
      result = result.filter((s) => s.type === 'supplier')
    } else if (tabType === '逾期账款') {
      result = result.filter((s) => s.unpaidCount > 0)
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter((s) => {
        return (
          String(s.name ?? '').toLowerCase().includes(keyword) ||
          String(s.code ?? '').toLowerCase().includes(keyword)
        )
      })
    }

    return result.sort((a, b) => b.unpaidAmount - a.unpaidAmount)
  }, [summaryData, tabType, searchKeyword])

  // 分页数据
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAccounts.slice(start, start + pageSize)
  }, [filteredAccounts, currentPage])

  const paginatedSummary = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSummary.slice(start, start + pageSize)
  }, [filteredSummary, currentPage])

  // 统计卡片 - 变化指标基于实际数据，数据为空时不显示变化
  const statCards = [
    {
      label: '应收账款',
      value: `¥${stats.totalReceivable.toLocaleString()}`,
      change: null, // 暂时不显示变化，等有历史数据后再计算
      icon: TrendingUp,
      iconBg: 'bg-success-100',
      bgColor: 'bg-success-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '应付账款',
      value: `¥${stats.totalPayable.toLocaleString()}`,
      change: null,
      icon: TrendingDown,
      iconBg: 'bg-warning-100',
      bgColor: 'bg-warning-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-danger-600',
    },
    {
      label: '逾期账款',
      value: `¥${stats.totalOverdue.toLocaleString()}`,
      change: null, // 逾期数量已经在value中显示，不需要单独的变化指标
      icon: AlertCircle,
      iconBg: 'bg-danger-100',
      bgColor: 'bg-danger-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '本月已收付',
      value: `¥${stats.thisMonthTotal.toLocaleString()}`,
      change: null,
      icon: CheckCircle,
      iconBg: 'bg-primary-100',
      bgColor: 'bg-primary-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
  ]

  // 标签页
  const tabs = [
    { key: '全部', label: '全部' },
    { key: '应收账款', label: '应收账款' },
    { key: '应付账款', label: '应付账款' },
    { key: '逾期账款', label: '逾期账款' },
  ]

  // 流水视图表格列
  const accountColumns = [
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: typeof allAccounts[0]) => (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className={`text-sm font-medium ${record.type === '应收' ? 'text-success-600' : 'text-warning-600'}`}>
            {record.type}
          </span>
        </div>
      ),
    },
    {
      key: 'counterparty',
      title: '往来单位',
      dataIndex: 'counterpartyName' as keyof typeof allAccounts[0],
    },
    {
      key: 'relatedDocument',
      title: '关联单据',
      render: (_: any, record: typeof allAccounts[0]) => (
        <span className="text-gray-600 text-sm">{record.relatedDocument}</span>
      ),
    },
    {
      key: 'documentDate',
      title: '单据日期',
      render: (_: any, record: typeof allAccounts[0]) => (
        <span className="text-gray-600 text-sm">{record.documentDate}</span>
      ),
    },
    {
      key: 'totalAmount',
      title: '应收/应付',
      render: (_: any, record: typeof allAccounts[0]) => (
        <span className="text-gray-900 font-medium text-base">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paidAmount',
      title: '已收/已付',
      render: (_: any, record: typeof allAccounts[0]) => (
        <span className="text-success-600 font-medium text-base">
          ¥{record.paidAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '未收/未付',
      render: (_: any, record: typeof allAccounts[0]) => {
        const isOverdue = record.status === '未结清' && differenceInDays(new Date(), new Date(record.dueDate)) > 15
        return (
          <span className={`font-medium text-base ${isOverdue ? 'text-danger-600' : 'text-gray-900'}`}>
            ¥{record.unpaidAmount.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: typeof allAccounts[0]) => {
        let statusLabel = ''
        let bgColor = ''
        let textColor = ''
        
        if (record.status === '已结清') {
          statusLabel = '已结清'
          bgColor = 'bg-success-100'
          textColor = 'text-success-700'
        } else if (record.paidAmount > 0 && record.unpaidAmount > 0) {
          statusLabel = '部分付款'
          bgColor = 'bg-warning-100'
          textColor = 'text-warning-700'
        } else {
          statusLabel = '未付款'
          bgColor = 'bg-gray-100'
          textColor = 'text-gray-900'
        }
        
        return (
          <span className={`px-2.5 py-1 ${bgColor} ${textColor} text-sm font-medium rounded-full`}>
            {statusLabel}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof allAccounts[0]) => (
        <div className="flex items-center gap-2">
          {record.type === '应收' && record.unpaidAmount > 0 && (
            <button
              onClick={() => {
                setSelectedAccount({
                  id: record.id,
                  accountNumber: record.relatedDocument,
                  counterpartyName: record.counterpartyName,
                  type: 'receivable',
                  unpaidAmount: record.unpaidAmount,
                })
                setShowPaymentModal(true)
              }}
              className="px-3 py-1 bg-success-50 text-success-600 text-sm font-medium rounded-xl hover:bg-success-100"
            >
              收款
            </button>
          )}
          {record.type === '应付' && record.unpaidAmount > 0 && (
            <button
              onClick={() => {
                setSelectedAccount({
                  id: record.id,
                  accountNumber: record.relatedDocument,
                  counterpartyName: record.counterpartyName,
                  type: 'payable',
                  unpaidAmount: record.unpaidAmount,
                })
                setShowPaymentModal(true)
              }}
              className="px-3 py-1 bg-warning-50 text-warning-600 text-sm font-medium rounded-xl hover:bg-warning-100"
            >
              付款
            </button>
          )}
          <button
            onClick={() => {
              setSelectedCounterparty({
                id: record.counterpartyId,
                name: record.counterpartyName,
                type: record.type === '应收' ? 'customer' : 'supplier',
              })
              setShowStatement(true)
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200"
          >
            对账单
          </button>
        </div>
      ),
    },
  ]

  // 汇总视图表格列
  const summaryColumns = [
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: typeof summaryData[0]) => (
        <div className="flex items-center gap-2">
          {record.type === 'customer' ? (
            <Users className="w-4 h-4 text-success-600" />
          ) : (
            <Users className="w-4 h-4 text-warning-600" />
          )}
          <span className={`text-sm font-medium ${record.type === 'customer' ? 'text-success-600' : 'text-warning-600'}`}>
            {record.type === 'customer' ? '客户' : '供应商'}
          </span>
        </div>
      ),
    },
    {
      key: 'code',
      title: '单位编码',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-gray-600 text-sm">{record.code ?? '-'}</span>
      ),
    },
    {
      key: 'name',
      title: '单位名称',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-gray-900 font-medium">{record.name}</span>
      ),
    },
    {
      key: 'orderCount',
      title: '单据数量',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-gray-600">{record.orderCount} 笔</span>
      ),
    },
    {
      key: 'totalAmount',
      title: '应收/应付总额',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-gray-900 font-medium">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paidAmount',
      title: '已收/已付',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-success-600 font-medium">¥{record.paidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '未收/未付',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className={`font-medium ${record.unpaidAmount > 0 ? 'text-danger-600' : 'text-gray-900'}`}>
          ¥{record.unpaidAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'unpaidCount',
      title: '未结清笔数',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className={record.unpaidCount > 0 ? 'text-danger-600' : 'text-gray-600'}>
          {record.unpaidCount} 笔
        </span>
      ),
    },
    {
      key: 'lastOrderDate',
      title: '最后交易',
      render: (_: any, record: typeof summaryData[0]) => (
        <span className="text-gray-600 text-sm">{record.lastOrderDate}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof summaryData[0]) => {
        return (
          <div className="flex items-center gap-2">
            {record.type === 'customer' && record.unpaidAmount > 0 && (
              <button
                onClick={() => {
                  setSelectedCounterparty({
                    id: record.id,
                    name: record.name,
                    type: record.type,
                  })
                  setShowCounterpartyPayment(true)
                }}
                className="px-3 py-1 bg-success-50 text-success-600 text-sm font-medium rounded-xl hover:bg-success-100"
              >
                收款
              </button>
            )}
            {record.type === 'supplier' && record.unpaidAmount > 0 && (
              <button
                onClick={() => {
                  setSelectedCounterparty({
                    id: record.id,
                    name: record.name,
                    type: record.type,
                  })
                  setShowCounterpartyPayment(true)
                }}
                className="px-3 py-1 bg-warning-50 text-warning-600 text-sm font-medium rounded-xl hover:bg-warning-100"
              >
                付款
              </button>
            )}
            <button
              onClick={() => {
                setSelectedCounterparty({
                  id: record.id,
                  name: record.name,
                  type: record.type,
                })
                setShowStatement(true)
              }}
              className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-xl hover:bg-primary-100"
            >
              <FileText className="w-4 h-4 inline mr-1" />
              对账单
            </button>
          </div>
        )
      },
    },
  ]

  const currentData = viewType === '流水' ? filteredAccounts : filteredSummary
  const currentColumns = viewType === '流水' ? accountColumns : summaryColumns
  const currentPaginatedData = viewType === '流水' ? paginatedAccounts : paginatedSummary

  // 类型兼容性处理
  const tableColumns = currentColumns as any[]
  const tableData = currentPaginatedData as any[]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">账款管理</h1>
        <p className="text-gray-600">
          管理应收应付账款,支持收付款登记和账款对账
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={`p-4 border ${card.borderColor} ${card.bgColor} rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">{card.label}</div>
                  <div className="text-lg font-semibold text-gray-900">{card.value}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {card.change !== null && (
                    <div className={`px-1.5 py-0.5 ${
                      String(card.change).startsWith('-') ? 'bg-danger-100' : 'bg-success-100'
                    } ${card.changeColor} text-xs font-medium rounded`}>
                      {card.change}
                    </div>
                  )}
                  <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 筛选和操作栏 */}
      <Card className="p-4 rounded-xl">
        <div className="space-y-4">
          {/* 第一行：视图切换 + 日期范围 + 筛选按钮 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <button
                onClick={() => {
                  setViewType('流水')
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewType === '流水'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4 inline mr-2" />
                流水
              </button>
              <button
                onClick={() => {
                  setViewType('汇总')
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  viewType === '汇总'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                汇总
              </button>
            </div>
            <div className="flex-1 max-w-[320px]">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                placeholder="选择日期范围"
                inputClassName="input-underline w-full px-0 py-2 text-sm border-0 rounded-none"
              />
            </div>
            <Button variant="outline" className="h-[39px] rounded-xl border-gray-200">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-none border-0 border-b border-blue-300 bg-transparent text-blue-600 text-sm"
              onClick={() => loadAll()}
            >
              查询
            </Button>
          </div>

          {/* 第二行：搜索框 + 导出 + 收付款登记 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={viewType === '流水' ? '搜索客户、供应商、单号...' : '搜索单位名称、编码...'}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-0 py-2 h-[39px] input-underline text-sm focus:outline-none"
              />
            </div>
            <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button
              onClick={() => setShowPaymentList(true)}
              className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Wallet className="w-4 h-4 mr-2" />
              收付款登记
            </Button>
          </div>

          {/* 第三行：状态标签页 */}
          <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setTabType(tab.key as AccountType)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tabType === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 账款列表表格 */}
      <Card className="rounded-xl overflow-hidden">
        {currentPaginatedData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || tabType !== '全部'
              ? '未找到匹配的记录'
              : '暂无记录'}
          </p>
        ) : (
          <>
            <Table columns={tableColumns} data={tableData} />
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">共 {currentData.length} 条记录</span>
              <Pagination
                current={currentPage}
                total={currentData.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* 对账单弹窗 */}
      {showStatement && selectedCounterparty && (
        <AccountStatement
          counterpartyId={selectedCounterparty.id}
          counterpartyName={selectedCounterparty.name}
          type={selectedCounterparty.type}
          onClose={() => {
            setShowStatement(false)
            setSelectedCounterparty(null)
          }}
        />
      )}

      {/* 收付款登记弹窗 */}
      {showPaymentList && (
        <PaymentListModal
          type="all"
          onSelect={(account) => {
            setSelectedAccount(account)
            setShowPaymentModal(true)
          }}
          onClose={() => setShowPaymentList(false)}
        />
      )}

      {/* 汇总视图中选择单位未结清账款弹窗 */}
      {showCounterpartyPayment && selectedCounterparty && (
        <CounterpartyPaymentModal
          counterpartyId={selectedCounterparty.id}
          counterpartyName={selectedCounterparty.name}
          type={selectedCounterparty.type}
          onSelect={(account) => {
            setSelectedAccount(account)
            setShowPaymentModal(true)
          }}
          onBatchSelect={(accounts) => {
            setSelectedBatchAccounts(accounts)
            setShowBatchPayment(true)
          }}
          onClose={() => {
            setShowCounterpartyPayment(false)
            setSelectedCounterparty(null)
          }}
        />
      )}

      {/* 批量付款/收款弹窗 */}
      {showBatchPayment && selectedBatchAccounts.length > 0 && (
        <BatchPaymentModal
          accounts={selectedBatchAccounts}
          onClose={() => {
            setShowBatchPayment(false)
            setSelectedBatchAccounts([])
          }}
          onSuccess={async () => {
            await loadAll()
          }}
        />
      )}

      {/* 付款/收款弹窗 */}
      {showPaymentModal && selectedAccount && (
        <PaymentModal
          accountId={selectedAccount.id}
          accountNumber={selectedAccount.accountNumber}
          counterpartyName={selectedAccount.counterpartyName}
          type={selectedAccount.type}
          unpaidAmount={selectedAccount.unpaidAmount}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedAccount(null)
          }}
          onSuccess={() => {
            // 刷新页面数据
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

export default AccountManagement
