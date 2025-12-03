import { useState, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { useContactStore } from '@/store/contactStore'
import { AccountReceivable, AccountPayable } from '@/types/account'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
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
import { format, differenceInDays } from 'date-fns'
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
  } = useAccountStore()
  const { customers, suppliers } = useContactStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tabType, setTabType] = useState<AccountType>('全部')
  const [viewType, setViewType] = useState<ViewType>('流水')
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

  // 统计数据
  const stats = useMemo(() => {
    const totalReceivable = receivables
      .filter((r) => r.status === '未结清')
      .reduce((sum, r) => sum + r.unpaidAmount, 0)
    
    const totalPayable = payables
      .filter((p) => p.status === '未结清')
      .reduce((sum, p) => sum + p.unpaidAmount, 0)
    
    const today = new Date()
    const overdueReceivables = receivables.filter((r) => {
      if (r.status === '已结清') return false
      const daysDiff = differenceInDays(today, new Date(r.accountDate))
      return daysDiff > 15
    })
    const overduePayables = payables.filter((p) => {
      if (p.status === '已结清') return false
      const daysDiff = differenceInDays(today, new Date(p.accountDate))
      return daysDiff > 15
    })
    const totalOverdue = overdueReceivables.reduce((sum, r) => sum + r.unpaidAmount, 0) +
      overduePayables.reduce((sum, p) => sum + p.unpaidAmount, 0)
    
    const thisMonthReceipts = receipts.reduce((sum, r) => sum + r.amount, 0)
    const thisMonthPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const thisMonthTotal = thisMonthReceipts + thisMonthPayments
    
    return {
      totalReceivable,
      totalPayable,
      totalOverdue,
      thisMonthTotal,
      overdueCount: overdueReceivables.length + overduePayables.length,
    }
  }, [receivables, payables, receipts, payments])

  // 流水视图：合并应收和应付账款数据
  const allAccounts = useMemo(() => {
    const receivableAccounts = receivables.map((r) => ({
      id: r.id,
      type: '应收' as const,
      counterpartyId: r.customerId,
      counterpartyName: r.customerName,
      relatedDocument: r.salesOrderNumber,
      documentDate: r.accountDate,
      totalAmount: r.receivableAmount,
      paidAmount: r.receivedAmount,
      unpaidAmount: r.unpaidAmount,
      dueDate: r.accountDate,
      status: r.status,
      account: r,
    }))
    
    const payableAccounts = payables.map((p) => ({
      id: p.id,
      type: '应付' as const,
      counterpartyId: p.supplierId,
      counterpartyName: p.supplierName,
      relatedDocument: p.purchaseOrderNumber,
      documentDate: p.accountDate,
      totalAmount: p.payableAmount,
      paidAmount: p.paidAmount,
      unpaidAmount: p.unpaidAmount,
      dueDate: p.accountDate,
      status: p.status,
      account: p,
    }))
    
    return [...receivableAccounts, ...payableAccounts]
  }, [receivables, payables])

  // 汇总视图：按单位汇总
  const summaryData = useMemo(() => {
    // 客户汇总
    const customerSummary = customers.map((customer) => {
      const customerReceivables = receivables.filter((r) => r.customerId === customer.id)
      const totalAmount = customerReceivables.reduce((sum, r) => sum + r.receivableAmount, 0)
      const paidAmount = customerReceivables.reduce((sum, r) => sum + r.receivedAmount, 0)
      const unpaidAmount = customerReceivables.reduce((sum, r) => sum + r.unpaidAmount, 0)
      const orderCount = customerReceivables.length
      const unpaidCount = customerReceivables.filter((r) => r.status === '未结清').length

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
    const supplierSummary = suppliers.map((supplier) => {
      const supplierPayables = payables.filter((p) => p.supplierId === supplier.id)
      const totalAmount = supplierPayables.reduce((sum, p) => sum + p.payableAmount, 0)
      const paidAmount = supplierPayables.reduce((sum, p) => sum + p.paidAmount, 0)
      const unpaidAmount = supplierPayables.reduce((sum, p) => sum + p.unpaidAmount, 0)
      const orderCount = supplierPayables.length
      const unpaidCount = supplierPayables.filter((p) => p.status === '未结清').length

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

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (a) =>
          a.counterpartyName.toLowerCase().includes(keyword) ||
          a.relatedDocument.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    )
  }, [allAccounts, tabType, searchKeyword])

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
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          s.code.toLowerCase().includes(keyword)
      )
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

  // 统计卡片
  const statCards = [
    {
      label: '应收账款',
      value: `¥${stats.totalReceivable.toLocaleString()}`,
      change: '+5.2%',
      icon: TrendingUp,
      iconBg: 'bg-success-100',
      bgColor: 'bg-success-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '应付账款',
      value: `¥${stats.totalPayable.toLocaleString()}`,
      change: '-8.3%',
      icon: TrendingDown,
      iconBg: 'bg-warning-100',
      bgColor: 'bg-warning-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-danger-600',
    },
    {
      label: '逾期账款',
      value: `¥${stats.totalOverdue.toLocaleString()}`,
      change: `+${stats.overdueCount}`,
      icon: AlertCircle,
      iconBg: 'bg-danger-100',
      bgColor: 'bg-danger-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '本月已收付',
      value: `¥${stats.thisMonthTotal.toLocaleString()}`,
      change: '+18%',
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
        <span className="text-gray-600 text-sm">{record.code}</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const changeBgColor = card.change.startsWith('-') ? 'bg-danger-100' : 'bg-success-100'
          return (
            <Card key={index} className={`p-5 border ${card.borderColor} ${card.bgColor} rounded-2xl`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-600">{card.label}</div>
                  <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 ${changeBgColor} ${card.changeColor} text-xs font-medium rounded-lg`}>
                    {card.change}
                  </div>
                  <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-gray-700" />
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
            <div className="relative flex-1 max-w-[274px]">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="选择日期范围"
                className="w-full pl-10 pr-4 py-2 h-[38px] border border-gray-200 rounded-xl text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <Button variant="outline" className="h-[39px] rounded-xl border-gray-200">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>

          {/* 第二行：搜索框 + 导出 + 收付款登记 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={viewType === '流水' ? '搜索客户、供应商、单号...' : '搜索单位名称、编码...'}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 h-[39px] border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <Table columns={currentColumns} data={currentPaginatedData} />
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
          onSuccess={() => {
            window.location.reload()
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
