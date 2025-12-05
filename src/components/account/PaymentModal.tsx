import { useState } from 'react'
import { useAccountStore } from '@/store/accountStore'
import { PaymentMethod } from '@/types/account'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import { X, Save, Wallet } from 'lucide-react'
import { format } from 'date-fns'

interface PaymentModalProps {
  accountId: string
  accountNumber: string
  counterpartyName: string
  type: 'receivable' | 'payable' // 应收或应付
  unpaidAmount: number
  onClose: () => void
  onSuccess?: () => void
}

function PaymentModal({
  accountId,
  accountNumber,
  counterpartyName,
  type,
  unpaidAmount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { addReceipt, addPayment } = useAccountStore()
  const isReceivable = type === 'receivable'

  const [formData, setFormData] = useState({
    amount: unpaidAmount.toString(),
    paymentMethod: '转账' as PaymentMethod,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    operator: '管理员',
    remark: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    const amount = parseFloat(formData.amount)

    if (!formData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = '请输入有效的金额'
    } else if (amount > unpaidAmount) {
      errors.amount = `金额不能超过未${isReceivable ? '收' : '付'}金额 ¥${unpaidAmount.toLocaleString()}`
    }

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

    try {
      if (isReceivable) {
        await addReceipt({
          accountReceivableId: accountId,
          amount,
          paymentMethod: formData.paymentMethod,
          receiptDate: formData.paymentDate,
          operator: formData.operator,
          remark: formData.remark || undefined,
        })
      } else {
        await addPayment({
          accountPayableId: accountId,
          amount,
          paymentMethod: formData.paymentMethod,
          paymentDate: formData.paymentDate,
          operator: formData.operator,
          remark: formData.remark || undefined,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
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
                {isReceivable ? '收款登记' : '付款登记'}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {counterpartyName} - {accountNumber}
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
        <div className="p-6 space-y-6">
          {/* 账款信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">往来单位</div>
                <div className="text-gray-900 font-medium">{counterpartyName}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">关联单据</div>
                <div className="text-gray-900 font-medium">{accountNumber}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-600 mb-1">未{isReceivable ? '收' : '付'}金额</div>
                <div className="text-lg font-semibold text-gray-900">¥{unpaidAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 收款/付款信息 */}
          <div className="space-y-4">
            <Input
              label={`${isReceivable ? '收款' : '付款'}金额 *`}
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value })
                if (errors.amount) setErrors({ ...errors, amount: '' })
              }}
              error={errors.amount}
            />

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

export default PaymentModal

