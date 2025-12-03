import { useMemo } from 'react'
import { Customer, Supplier } from '@/types/contact'
import { useSalesStore } from '@/store/salesStore'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useAccountStore } from '@/store/accountStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Users, Building2, Phone, Mail, Edit, X, MapPin, FileText, DollarSign, AlertCircle } from 'lucide-react'

interface ContactDetailProps {
  contact: Customer | Supplier
  type: 'customer' | 'supplier'
  onEdit?: () => void
  onClose: () => void
}

function ContactDetail({ contact, type, onEdit, onClose }: ContactDetailProps) {
  const { orders: salesOrders } = useSalesStore()
  const { orders: purchaseOrders } = usePurchaseStore()
  const { receivables, payables } = useAccountStore()
  
  const isCustomer = type === 'customer'
  const customer = isCustomer ? (contact as Customer) : null
  const supplier = !isCustomer ? (contact as Supplier) : null

  // 获取交易统计
  const transactionStats = useMemo(() => {
    if (isCustomer) {
      const customerOrders = salesOrders.filter((o) => o.customerId === contact.id)
      const customerReceivables = receivables.filter((r) => r.customerId === contact.id)
      const totalAmount = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      const unpaidAmount = customerReceivables
        .filter((r) => r.status === '未结清')
        .reduce((sum, r) => sum + r.unpaidAmount, 0)

      return {
        transactionCount: customerOrders.length,
        totalAmount,
        unpaidAmount,
        creditLimit: customer?.creditLimit || 0,
      }
    } else {
      const supplierOrders = purchaseOrders.filter((o) => o.supplierId === contact.id)
      const supplierPayables = payables.filter((p) => p.supplierId === contact.id)
      const totalAmount = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      const unpaidAmount = supplierPayables
        .filter((p) => p.status === '未结清')
        .reduce((sum, p) => sum + p.unpaidAmount, 0)

      return {
        transactionCount: supplierOrders.length,
        totalAmount,
        unpaidAmount,
        creditLimit: 0,
      }
    }
  }, [contact.id, isCustomer, salesOrders, purchaseOrders, receivables, payables, customer])

  // 生成标签
  const tags = useMemo(() => {
    const tagList: string[] = []
    if (isCustomer && customer) {
      if (customer.status === '正常') {
        if (transactionStats.transactionCount > 50) {
          tagList.push('VIP客户')
        }
        if (transactionStats.transactionCount > 20) {
          tagList.push('长期合作')
        }
      }
    } else if (supplier) {
      if (supplier.status === '合作中') {
        tagList.push('核心供应商')
        tagList.push('质量稳定')
      }
    }
    return tagList
  }, [isCustomer, customer, supplier, transactionStats.transactionCount])

  return (
    <div className="bg-white rounded-2xl shadow-xl w-[768px] max-h-[90vh] flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isCustomer ? 'bg-primary-100' : 'bg-purple-100'
          }`}>
            {isCustomer ? (
              <Users className="w-5 h-5 text-primary-600" />
            ) : (
              <Building2 className="w-5 h-5 text-purple-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">查看详情</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {isCustomer ? '客户' : '供应商'} - {contact.code}
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
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
          
          <div className="space-y-4">
            {/* 第一行：单位编号、单位名称 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">单位编号</label>
                <div className="w-full px-3 py-2 h-[36px] bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                  {contact.code}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单位名称 <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2 h-[36px] border border-gray-200 rounded-xl text-sm text-gray-900">
                  {contact.name}
                </div>
              </div>
            </div>

            {/* 第二行：联系人、联系电话 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系人 <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-3 py-2 h-[36px] border border-gray-200 rounded-xl text-sm text-gray-900">
                  {contact.contactPerson || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <div className="w-full pl-10 pr-3 py-2 h-[36px] border border-gray-200 rounded-xl text-sm text-gray-900">
                    {contact.phone || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 第三行：状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <div className="w-fit">
                <Badge
                  variant={contact.status === '正常' || contact.status === '合作中' ? 'success' : 'gray'}
                  className={
                    contact.status === '正常' || contact.status === '合作中'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-900'
                  }
                >
                  {contact.status}
                </Badge>
              </div>
            </div>

            {/* 详细地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">详细地址</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <div className="w-full pl-10 pr-3 py-2 min-h-[60px] border border-gray-200 rounded-xl text-sm text-gray-900">
                  {contact.address || '请输入详细地址'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">标签</h3>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-900 text-xs font-medium rounded-full flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-gray-900 rounded-full" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 交易统计 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">交易统计</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* 交易次数 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">交易次数</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {transactionStats.transactionCount}
              </div>
              <div className="text-xs text-gray-500">累计订单数</div>
            </div>

            {/* 交易总额 */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">交易总额</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                ¥{transactionStats.totalAmount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">累计交易金额</div>
            </div>

            {/* 未付金额 */}
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-600">未付金额</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                ¥{transactionStats.unpaidAmount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">待收/待付款</div>
            </div>

            {/* 信用额度（仅客户） */}
            {isCustomer && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">信用额度</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 mb-1">
                  ¥{transactionStats.creditLimit.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">最高授信额度</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
          className="px-4 py-2 h-[38px] border-gray-300 rounded-lg text-sm"
        >
          关闭
        </Button>
        {onEdit && (
          <Button
            onClick={onEdit}
            className="px-4 py-2 h-[36px] bg-primary-600 hover:bg-primary-700 rounded-lg text-sm text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
        )}
      </div>
    </div>
  )
}

export default ContactDetail
