import { useState, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { PaymentMethod } from '@/types/account'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Table from '../ui/Table'
import { X, Save, Wallet } from 'lucide-react'
import { format } from 'date-fns'

interface BatchPaymentModalProps {
  accounts: Array<{
    id: string
    accountNumber: string
    counterpartyName: string
    type: 'receivable' | 'payable'
    unpaidAmount: number
  }>
  onClose: () => void
  onSuccess?: () => void
}

function BatchPaymentModal({ accounts, onClose, onSuccess }: BatchPaymentModalProps) {
  const { addReceipt, addPayment } = useAccountStore()
  const isReceivable = accounts[0]?.type === 'receivable'

  // 为每笔账款设置独立的付款金额
  const [accountAmounts, setAccountAmounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    accounts.forEach(a => {
      initial[a.id] = a.unpaidAmount.toString()
    })
    return initial
  })

  const [formData, setFormData] = useState({
    paymentMethod: '转账' as PaymentMethod,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    operator: '管理员',
    remark: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 计算总金额
  const totalAmount = useMemo(() => {
    return accounts.reduce((sum, a) => {
      const amount = parseFloat(accountAmounts[a.id] || '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }, [accounts, accountAmounts])

  const handleSubmit = () => {
    const errors: Record<string, string> = {}

    // 验证每笔账款的金额
    accounts.forEach(account => {
      const amountStr = accountAmounts[account.id]
      const amount = parseFloat(amountStr || '0')

      if (!amountStr || isNaN(amount) || amount <= 0) {
        errors[`amount_${account.id}`] = '请输入有效的金额'
      } else if (amount > account.unpaidAmount) {
        errors[`amount_${account.id}`] = `金额不能超过未${isReceivable ? '收' : '付'}金额`
      }
    })

    if (!formData.paymentDate) {
      errors.paymentDate = '请选择日期'
    }

    if (!formData.operator) {
      errors.operator = '请输入经办人'
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    // 批量保存付款/收款记录
    accounts.forEach(account => {
      const amount = parseFloat(accountAmounts[account.id])
      if (amount > 0) {
        if (isReceivable) {
          addReceipt({
            accountReceivableId: account.id,
            amount,
            paymentMethod: formData.paymentMethod,
            receiptDate: formData.paymentDate,
            operator: formData.operator,
            remark: formData.remark || undefined,
          })
        } else {
          addPayment({
            accountPayableId: account.id,
            amount,
            paymentMethod: formData.paymentMethod,
            paymentDate: formData.paymentDate,
            operator: formData.operator,
            remark: formData.remark || undefined,
          })
        }
      }
    })

    onSuccess?.()
    onClose()
  }

  const columns = [
    {
      key: 'accountNumber',
      title: '单据号',
      render: (_: any, record: typeof accounts[0]) => (
        <span className="text-gray-900 font-medium">{record.accountNumber}</span>
      ),
    },
    {
      key: 'unpaidAmount',
      title: '未收/未付金额',
      render: (_: any, record: typeof accounts[0]) => (
        <span className="text-gray-600">¥{record.unpaidAmount.toLocaleString()}</span>
      ),
    },
    {
      key: 'amount',
      title: `${isReceivable ? '收款' : '付款'}金额`,
      render: (_: any, record: typeof accounts[0]) => (
        <div className="w-32">
          <Input
            type="number"
            step="0.01"
            value={accountAmounts[record.id] || ''}
            onChange={(e) => {
              setAccountAmounts({
                ...accountAmounts,
                [record.id]: e.target.value,
              })
              if (errors[`amount_${record.id}`]) {
                const newErrors = { ...errors }
                delete newErrors[`amount_${record.id}`]
                setErrors(newErrors)
              }
            }}
            error={errors[`amount_${record.id}`]}
            className="w-full"
          />
        </div>
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
              isReceivable ? 'bg-success-100' : 'bg-warning-100'
            }`}>
              <Wallet className={`w-5 h-5 ${isReceivable ? 'text-success-600' : 'text-warning-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                批量{isReceivable ? '收款' : '付款'}登记
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {accounts[0]?.counterpartyName} - 共 {accounts.length} 笔账款
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

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 账款列表 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">账款明细</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <Table columns={columns} data={accounts} />
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="text-sm text-gray-600">
                合计金额：<span className="text-lg font-semibold text-gray-900">¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 付款信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">付款信息</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isReceivable ? '收款' : '付款'}方式 *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as PaymentMethod,
                  })
                }
                className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="现金">现金</option>
                <option value="转账">转账</option>
                <option value="支票">支票</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <Input
              label={`${isReceivable ? '收款' : '付款'}日期 *`}
              type="date"
              value={formData.paymentDate}
              onChange={(e) => {
                setFormData({ ...formData, paymentDate: e.target.value })
                if (errors.paymentDate) setErrors({ ...errors, paymentDate: '' })
              }}
              error={errors.paymentDate}
            />

            <Input
              label="经办人 *"
              value={formData.operator}
              onChange={(e) => {
                setFormData({ ...formData, operator: e.target.value })
                if (errors.operator) setErrors({ ...errors, operator: '' })
              }}
              error={errors.operator}
            />

            <Textarea
              label="备注"
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            className={`px-6 ${isReceivable ? 'bg-success-600 hover:bg-success-700' : 'bg-warning-600 hover:bg-warning-700'}`}
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BatchPaymentModal







