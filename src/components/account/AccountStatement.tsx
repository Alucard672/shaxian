import { useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { X, Download, Printer } from 'lucide-react'

interface AccountStatementProps {
  counterpartyId: string
  counterpartyName: string
  type: 'customer' | 'supplier'
  onClose: () => void
}

function AccountStatement({ counterpartyId, counterpartyName, type, onClose }: AccountStatementProps) {
  const { receivables, payables, receipts, payments } = useAccountStore()

  const isCustomer = type === 'customer'

  // 获取该单位的账款记录
  const accountRecords = useMemo(() => {
    if (isCustomer) {
      return receivables
        .filter((r) => r.customerId === counterpartyId)
        .map((r) => ({
          id: r.id,
          documentNumber: r.salesOrderNumber,
          documentDate: r.accountDate,
          amount: r.receivableAmount,
          paidAmount: r.receivedAmount,
          unpaidAmount: r.unpaidAmount,
          status: r.status,
          type: '应收' as const,
        }))
    } else {
      return payables
        .filter((p) => p.supplierId === counterpartyId)
        .map((p) => ({
          id: p.id,
          documentNumber: p.purchaseOrderNumber,
          documentDate: p.accountDate,
          amount: p.payableAmount,
          paidAmount: p.paidAmount,
          unpaidAmount: p.unpaidAmount,
          status: p.status,
          type: '应付' as const,
        }))
    }
  }, [isCustomer, counterpartyId, receivables, payables])

  // 获取收付款记录
  const paymentRecords = useMemo(() => {
    if (isCustomer) {
      const accountIds = accountRecords.map((r) => r.id)
      return receipts
        .filter((r) => accountIds.includes(r.accountReceivableId))
        .map((r) => ({
          id: r.id,
          date: r.receiptDate,
          amount: r.amount,
          method: r.paymentMethod,
          operator: r.operator,
          remark: r.remark,
          type: '收款' as const,
          accountId: r.accountReceivableId,
        }))
    } else {
      const accountIds = accountRecords.map((r) => r.id)
      return payments
        .filter((p) => accountIds.includes(p.accountPayableId))
        .map((p) => ({
          id: p.id,
          date: p.paymentDate,
          amount: p.amount,
          method: p.paymentMethod,
          operator: p.operator,
          remark: p.remark,
          type: '付款' as const,
          accountId: p.accountPayableId,
        }))
    }
  }, [isCustomer, accountRecords, receipts, payments])

  // 合并所有记录并按日期排序
  const allRecords = useMemo(() => {
    const records = [
      ...accountRecords.map((r) => ({
        ...r,
        recordType: '账款' as const,
        date: r.documentDate,
      })),
      ...paymentRecords.map((r) => ({
        ...r,
        recordType: '收付款' as const,
        documentNumber: '-',
        documentDate: r.date,
      })),
    ]

    return records.sort(
      (a, b) => new Date(b.date || b.documentDate).getTime() - new Date(a.date || a.documentDate).getTime()
    )
  }, [accountRecords, paymentRecords])

  // 统计数据
  const stats = useMemo(() => {
    const totalAmount = accountRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalPaid = accountRecords.reduce((sum, r) => sum + r.paidAmount, 0)
    const totalUnpaid = accountRecords.reduce((sum, r) => sum + r.unpaidAmount, 0)
    const totalPayments = paymentRecords.reduce((sum, r) => sum + r.amount, 0)

    return { totalAmount, totalPaid, totalUnpaid, totalPayments }
  }, [accountRecords, paymentRecords])

  // 表格列
  const columns = [
    {
      key: 'date',
      title: '日期',
      render: (_: any, record: typeof allRecords[0]) => (
        <span className="text-gray-600 text-sm">{record.date || record.documentDate}</span>
      ),
    },
    {
      key: 'recordType',
      title: '类型',
      render: (_: any, record: typeof allRecords[0]) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          record.recordType === '账款' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {record.recordType}
        </span>
      ),
    },
    {
      key: 'documentNumber',
      title: '单据号',
      render: (_: any, record: typeof allRecords[0]) => (
        <span className="text-gray-900 text-sm">{record.documentNumber || '-'}</span>
      ),
    },
    {
      key: 'amount',
      title: isCustomer ? '应收金额' : '应付金额',
      render: (_: any, record: typeof allRecords[0]) => {
        if (record.recordType === '收付款') {
          return (
            <span className="text-green-600 font-medium">
              {isCustomer ? '+' : '-'}¥{record.amount.toLocaleString()}
            </span>
          )
        }
        return (
          <span className="text-gray-900 font-medium">¥{record.amount.toLocaleString()}</span>
        )
      },
    },
    {
      key: 'paidAmount',
      title: isCustomer ? '已收金额' : '已付金额',
      render: (_: any, record: typeof allRecords[0]) => {
        if (record.recordType === '收付款') {
          return <span className="text-gray-400">-</span>
        }
        return (
          <span className="text-success-600 font-medium">¥{record.paidAmount.toLocaleString()}</span>
        )
      },
    },
    {
      key: 'unpaidAmount',
      title: isCustomer ? '未收金额' : '未付金额',
      render: (_: any, record: typeof allRecords[0]) => {
        if (record.recordType === '收付款') {
          return <span className="text-gray-400">-</span>
        }
        return (
          <span className={`font-medium ${record.unpaidAmount > 0 ? 'text-danger-600' : 'text-gray-600'}`}>
            ¥{record.unpaidAmount.toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'method',
      title: '付款方式',
      render: (_: any, record: typeof allRecords[0]) => {
        if (record.recordType === '收付款' && 'method' in record) {
          return <span className="text-gray-600 text-sm">{record.method}</span>
        }
        return <span className="text-gray-400">-</span>
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: typeof allRecords[0]) => {
        if (record.recordType === '收付款') {
          return <span className="text-gray-400">-</span>
        }
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            record.status === '已结清' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {record.status}
          </span>
        )
      },
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">对账单</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isCustomer ? '客户' : '供应商'}：{counterpartyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 border-gray-300 rounded-lg text-sm">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button variant="outline" className="h-9 px-4 border-gray-300 rounded-lg text-sm">
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">{isCustomer ? '应收总额' : '应付总额'}</div>
              <div className="text-xl font-semibold text-gray-900">¥{stats.totalAmount.toLocaleString()}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">{isCustomer ? '已收总额' : '已付总额'}</div>
              <div className="text-xl font-semibold text-success-600">¥{stats.totalPaid.toLocaleString()}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">{isCustomer ? '未收总额' : '未付总额'}</div>
              <div className="text-xl font-semibold text-danger-600">¥{stats.totalUnpaid.toLocaleString()}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">收付款总额</div>
              <div className="text-xl font-semibold text-blue-600">¥{stats.totalPayments.toLocaleString()}</div>
            </Card>
          </div>

          {/* 对账单明细 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">对账明细</h3>
            <Card className="rounded-xl overflow-hidden">
              {allRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无对账记录</p>
              ) : (
                <Table columns={columns} data={allRecords} />
              )}
            </Card>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountStatement

