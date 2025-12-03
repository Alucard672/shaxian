import { useMemo } from 'react'
import { SalesOrder } from '@/types/sales'
import { useContactStore } from '@/store/contactStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { printOrder } from '@/utils/printDocument'
import { FileText, Calendar, User, Package, Printer, Edit, X, CheckCircle2 } from 'lucide-react'

interface SalesDetailProps {
  order: SalesOrder
  onEdit?: () => void
  onPrint?: () => void
  onClose: () => void
}

function SalesDetail({ order, onEdit, onPrint, onClose }: SalesDetailProps) {
  const { getCustomer } = useContactStore()

  // 获取客户信息
  const customer = useMemo(() => {
    return getCustomer(order.customerId)
  }, [order.customerId, getCustomer])

  // 计算商品种类数量（去重）
  const productTypeCount = useMemo(() => {
    const productIds = new Set(order.items.map((item) => item.productId))
    return productIds.size
  }, [order.items])

  // 计算商品总数量
  const totalQuantity = useMemo(() => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0)
  }, [order.items])

  // 获取单位（假设所有商品使用相同单位）
  const unit = order.items[0]?.unit || 'kg'

  // 判断是否已完成出库
  const isCompleted = order.status === '已出库'

  return (
    <div className="bg-white rounded-2xl shadow-xl w-[1152px] max-h-[90vh] flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">销售单详情</h2>
            <p className="text-sm text-gray-600 mt-1">单号：{order.orderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (onPrint) {
                onPrint()
              } else {
                printOrder('销售单', order)
              }
            }}
            className="h-9 px-4 border-gray-300 rounded-lg text-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            打印
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              className="h-9 px-4 border-gray-300 rounded-lg text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          )}
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
        {/* 基本信息 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">基本信息</h3>
          </div>
          
          <div className="grid grid-cols-4 gap-x-8 gap-y-4 mb-4">
            {/* 客户名称 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">客户名称</div>
              <div className="text-base text-gray-900">{order.customerName}</div>
            </div>
            
            {/* 联系人 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">联系人</div>
              <div className="text-base text-gray-900">{customer?.contactPerson || '-'}</div>
            </div>
            
            {/* 联系电话 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">联系电话</div>
              <div className="text-base text-gray-900">{customer?.phone || '-'}</div>
            </div>
            
            {/* 单据状态 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">单据状态</div>
              <Badge
                variant={isCompleted ? 'success' : 'gray'}
                className={isCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-900'
                }
              >
                {isCompleted ? '已完成' : order.status}
              </Badge>
            </div>
            
            {/* 销售日期 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">销售日期</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-base text-gray-900">
                  {order.salesDate}
                </span>
              </div>
            </div>
            
            {/* 交货日期 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">交货日期</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-base text-gray-900">
                  {order.expectedDate || '-'}
                </span>
              </div>
            </div>
            
            {/* 经办人 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">经办人</div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-base text-gray-900">{order.operator}</span>
              </div>
            </div>
            
            {/* 商品种类 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">商品种类</div>
              <div className="text-base text-gray-900">{productTypeCount} 种</div>
            </div>
          </div>
          
          {/* 备注 */}
          {order.remark && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 mb-1">备注</div>
              <div className="text-base text-gray-900">{order.remark}</div>
            </div>
          )}
        </div>

        {/* 商品明细 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">商品明细</h3>
          </div>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">序号</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">商品名称</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">色号</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">缸号</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">数量</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">单价</th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">金额</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-5 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-4 py-5 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-4 py-5 text-sm">
                      <div>
                        <div className="text-gray-900">{item.colorCode}</div>
                        <div className="text-gray-600 text-xs">{item.colorName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="inline-block px-2 py-1 bg-gray-50 rounded text-sm text-gray-900">
                        {item.batchCode}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right text-base text-gray-900">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-4 py-5 text-right text-base text-gray-900">
                      ¥{item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-5 text-right text-base text-gray-900">
                      ¥{item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 汇总信息 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">商品总数量：</span>
                <span className="text-base text-gray-900 font-medium">
                  {totalQuantity.toLocaleString()} {unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">商品种类：</span>
                <span className="text-base text-gray-900 font-medium">
                  {productTypeCount} 种
                </span>
              </div>
            </div>
            <div className="space-y-3 border-l border-gray-200 pl-6">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">订单总额：</span>
                <span className="text-base text-gray-900 font-medium">
                  ¥{order.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600">已收金额：</span>
                <span className="text-base text-green-600 font-medium">
                  ¥{order.receivedAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-300 pt-3">
                <span className="text-base text-gray-900 font-medium">欠款金额：</span>
                <span className="text-base text-green-600 font-medium">
                  ¥{order.unpaidAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-base font-medium text-green-800 mb-1">
                此销售单已完成出库
              </div>
              <div className="text-sm text-green-700">
                库存已更新，商品已按缸号出库，款项已全部收齐
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesDetail

