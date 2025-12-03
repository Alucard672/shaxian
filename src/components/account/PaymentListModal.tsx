import { useState, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { X, Search, Wallet } from 'lucide-react'

interface PaymentListModalProps {
  type: 'receivable' | 'payable' | 'all'
  onSelect: (account: {
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  }) => void
  onClose: () => void
}

function PaymentListModal({ type, onSelect, onClose }: PaymentListModalProps) {
  const { receivables, payables } = useAccountStore()
  const [searchKeyword, setSearchKeyword] = useState('')

  // 获取未结清的账款列表
  const availableAccounts = useMemo(() => {
    const accounts: Array<{
      id: string
      accountNumber: string
      counterpartyName: string
      accountDate: string
      unpaidAmount: number
      type: 'receivable' | 'payable'
    }> = []

    if (type === 'receivable' || type === 'all') {
      receivables
        .filter((r) => r.status === '未结清' && r.unpaidAmount > 0)
        .forEach((r) => {
          accounts.push({
            id: r.id,
            accountNumber: r.salesOrderNumber,
            counterpartyName: r.customerName,
            accountDate: r.accountDate,
            unpaidAmount: r.unpaidAmount,
            type: 'receivable',
          })
        })
    }

    if (type === 'payable' || type === 'all') {
      payables
        .filter((p) => p.status === '未结清' && p.unpaidAmount > 0)
        .forEach((p) => {
          accounts.push({
            id: p.id,
            accountNumber: p.purchaseOrderNumber,
            counterpartyName: p.supplierName,
            accountDate: p.accountDate,
            unpaidAmount: p.unpaidAmount,
            type: 'payable',
          })
        })
    }

    return accounts
  }, [receivables, payables, type])

  // 筛选
  const filteredAccounts = useMemo(() => {
    if (!searchKeyword) return availableAccounts

    const keyword = searchKeyword.toLowerCase()
    return availableAccounts.filter(
      (a) =>
        a.counterpartyName.toLowerCase().includes(keyword) ||
        a.accountNumber.toLowerCase().includes(keyword)
    )
  }, [availableAccounts, searchKeyword])

  const columns = [
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            record.type === 'receivable'
              ? 'bg-success-100 text-success-700'
              : 'bg-warning-100 text-warning-700'
          }`}
        >
          {record.type === 'receivable' ? '应收' : '应付'}
        </span>
      ),
    },
    {
      key: 'counterpartyName',
      title: '往来单位',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <span className="text-gray-900">{record.counterpartyName}</span>
      ),
    },
    {
      key: 'accountNumber',
      title: '单据号',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <span className="text-gray-600 text-sm">{record.accountNumber}</span>
      ),
    },
    {
      key: 'accountDate',
      title: '单据日期',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <span className="text-gray-600 text-sm">{record.accountDate}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '未收/未付金额',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <span className="text-danger-600 font-medium">¥{record.unpaidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof filteredAccounts[0]) => (
        <Button
          onClick={() => {
            onSelect({
              id: record.id,
              accountNumber: record.accountNumber,
              counterpartyName: record.counterpartyName,
              type: record.type,
              unpaidAmount: record.unpaidAmount,
            })
            onClose()
          }}
          className={`px-4 py-1 text-sm ${
            record.type === 'receivable'
              ? 'bg-success-600 hover:bg-success-700'
              : 'bg-warning-600 hover:bg-warning-700'
          }`}
        >
          {record.type === 'receivable' ? '收款' : '付款'}
        </Button>
      ),
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">收付款登记</h2>
              <p className="text-sm text-gray-600 mt-0.5">选择要登记收付款的账款</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索往来单位、单据号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 h-9 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchKeyword ? '未找到匹配的账款记录' : '暂无未结清的账款记录'}
              </p>
            </div>
          ) : (
            <Table columns={columns} data={filteredAccounts} />
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentListModal

