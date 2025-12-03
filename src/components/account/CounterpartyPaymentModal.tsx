import { useState, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { X, Wallet, Users, CheckSquare, Square } from 'lucide-react'

interface CounterpartyPaymentModalProps {
  counterpartyId: string
  counterpartyName: string
  type: 'customer' | 'supplier'
  onSelect: (account: {
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  }) => void
  onBatchSelect: (accounts: Array<{
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  }>) => void
  onClose: () => void
}

function CounterpartyPaymentModal({
  counterpartyId,
  counterpartyName,
  type,
  onSelect,
  onBatchSelect,
  onClose,
}: CounterpartyPaymentModalProps) {
  const { receivables, payables } = useAccountStore()
  const isCustomer = type === 'customer'
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 获取该单位的未结清账款列表
  const unpaidAccounts = useMemo(() => {
    if (isCustomer) {
      return receivables
        .filter((r) => r.customerId === counterpartyId && r.status === '未结清' && r.unpaidAmount > 0)
        .map((r) => ({
          id: r.id,
          accountNumber: r.salesOrderNumber,
          accountDate: r.accountDate,
          totalAmount: r.receivableAmount,
          paidAmount: r.receivedAmount,
          unpaidAmount: r.unpaidAmount,
        }))
    } else {
      return payables
        .filter((p) => p.supplierId === counterpartyId && p.status === '未结清' && p.unpaidAmount > 0)
        .map((p) => ({
          id: p.id,
          accountNumber: p.purchaseOrderNumber,
          accountDate: p.accountDate,
          totalAmount: p.payableAmount,
          paidAmount: p.paidAmount,
          unpaidAmount: p.unpaidAmount,
        }))
    }
  }, [counterpartyId, isCustomer, receivables, payables])

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === unpaidAccounts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(unpaidAccounts.map(a => a.id)))
    }
  }

  // 切换单个选择
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 获取选中的账款
  const selectedAccounts = useMemo(() => {
    return unpaidAccounts.filter(a => selectedIds.has(a.id))
  }, [unpaidAccounts, selectedIds])

  // 计算选中账款的总额
  const selectedTotalAmount = useMemo(() => {
    return selectedAccounts.reduce((sum, a) => sum + a.unpaidAmount, 0)
  }, [selectedAccounts])

  const columns = [
    {
      key: 'select',
      title: (
        <div className="flex items-center">
          <button
            onClick={handleSelectAll}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {selectedIds.size === unpaidAccounts.length && unpaidAccounts.length > 0 ? (
              <CheckSquare className="w-5 h-5 text-primary-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      ),
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedIds.has(record.id)}
            onChange={() => handleToggleSelect(record.id)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </div>
      ),
    },
    {
      key: 'accountNumber',
      title: '单据号',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <span className="text-gray-900 font-medium">{record.accountNumber}</span>
      ),
    },
    {
      key: 'accountDate',
      title: '单据日期',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <span className="text-gray-600 text-sm">{record.accountDate}</span>
      ),
    },
    {
      key: 'totalAmount',
      title: isCustomer ? '应收金额' : '应付金额',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <span className="text-gray-900 font-medium">¥{record.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'paidAmount',
      title: isCustomer ? '已收金额' : '已付金额',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <span className="text-success-600 font-medium">¥{record.paidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: isCustomer ? '未收金额' : '未付金额',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <span className="text-danger-600 font-medium">¥{record.unpaidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof unpaidAccounts[0]) => (
        <Button
          onClick={() => {
            onSelect({
              id: record.id,
              accountNumber: record.accountNumber,
              counterpartyName,
              type: isCustomer ? 'receivable' : 'payable',
              unpaidAmount: record.unpaidAmount,
            })
            onClose()
          }}
          className={`px-4 py-1 text-sm ${
            isCustomer
              ? 'bg-success-600 hover:bg-success-700'
              : 'bg-warning-600 hover:bg-warning-700'
          }`}
        >
          {isCustomer ? '收款' : '付款'}
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCustomer ? 'bg-success-100' : 'bg-warning-100'
            }`}>
              {isCustomer ? (
                <Users className="w-5 h-5 text-success-600" />
              ) : (
                <Wallet className="w-5 h-5 text-warning-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isCustomer ? '收款登记' : '付款登记'}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {isCustomer ? '客户' : '供应商'}：{counterpartyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {unpaidAccounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">该单位暂无未结清的账款记录</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  共 {unpaidAccounts.length} 笔未结清账款，请选择要{isCustomer ? '收款' : '付款'}的单据：
                </p>
              </div>
              <Table columns={columns} data={unpaidAccounts} />
            </>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedIds.size > 0 && (
              <span>
                已选择 <span className="font-medium text-gray-900">{selectedIds.size}</span> 笔，
                合计金额：<span className="font-medium text-danger-600">¥{selectedTotalAmount.toLocaleString()}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <Button
                onClick={() => {
                  const accounts = selectedAccounts.map(a => ({
                    id: a.id,
                    accountNumber: a.accountNumber,
                    counterpartyName,
                    type: isCustomer ? 'receivable' as const : 'payable' as const,
                    unpaidAmount: a.unpaidAmount,
                  }))
                  onBatchSelect(accounts)
                  onClose()
                }}
                className={`px-6 ${
                  isCustomer
                    ? 'bg-success-600 hover:bg-success-700'
                    : 'bg-warning-600 hover:bg-warning-700'
                }`}
              >
                批量{isCustomer ? '收款' : '付款'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="px-6">
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CounterpartyPaymentModal

