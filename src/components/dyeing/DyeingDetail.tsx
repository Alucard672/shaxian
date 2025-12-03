import { useState } from 'react'
import { DyeingOrder } from '@/types/dyeing'
import { useDyeingStore } from '@/store/dyeingStore'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { FileText, X, CheckCircle, Package } from 'lucide-react'
import { format } from 'date-fns'

interface DyeingDetailProps {
  order: DyeingOrder
  onClose: () => void
}

function DyeingDetail({ order, onClose }: DyeingDetailProps) {
  const { updateStatus, stockIn } = useDyeingStore()
  const [stockLocation, setStockLocation] = useState('')
  const [showStockInForm, setShowStockInForm] = useState(false)

  // 计算总加工数量
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleMarkAsCompleted = () => {
    if (confirm('确定要将此加工单标记为已完成吗？')) {
      updateStatus(order.id, '已完成')
      onClose()
    }
  }

  const handleStockIn = () => {
    if (!stockLocation.trim()) {
      alert('请输入仓库位置')
      return
    }
    if (confirm(`确定要将此加工单入库到 ${stockLocation} 吗？入库后将创建对应的批次。`)) {
      stockIn(order.id, stockLocation.trim())
      setShowStockInForm(false)
      setStockLocation('')
      onClose()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl w-[900px] max-h-[90vh] flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">加工单详情</h2>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">基本信息</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">加工单号</div>
              <div className="text-sm text-gray-900">{order.orderNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">状态</div>
              <Badge
                variant={order.status === '已完成' ? 'success' : order.status === '加工中' ? 'default' : 'default'}
                className={order.status === '已完成' 
                  ? 'bg-green-100 text-green-700' 
                  : order.status === '加工中'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
                }
              >
                {order.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">创建时间</div>
              <div className="text-sm text-gray-900">
                {order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">创建人</div>
              <div className="text-sm text-gray-900">{order.operator}</div>
            </div>
          </div>
        </div>

        {/* 商品信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">商品信息</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">商品名称</div>
              <div className="text-sm text-gray-900">{order.productName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">白坯缸号</div>
              <div className="text-sm text-gray-900">{order.greyBatchCode}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">加工数量</div>
              <div className="text-sm text-gray-900">{totalQuantity} kg</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">目标色号</div>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {item.targetColorValue && (
                      <div
                        className="w-3 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: item.targetColorValue }}
                      />
                    )}
                    <span className="text-sm text-gray-900">
                      {item.targetColorName} ({item.quantity} kg)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 加工厂信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">加工厂信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">加工厂名称</div>
              <div className="text-sm text-gray-900">{order.factoryName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">联系电话</div>
              <div className="text-sm text-gray-900">{order.factoryPhone || '-'}</div>
            </div>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">时间信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">发货日期</div>
              <div className="text-sm text-gray-900">{order.shipmentDate}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">预计完成日期</div>
              <div className="text-sm text-gray-900">{order.expectedCompletionDate}</div>
            </div>
          </div>
        </div>

        {/* 费用信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">费用信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">加工单价</div>
              <div className="text-sm text-gray-900">¥{order.processingPrice.toFixed(2)} / kg</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">总金额</div>
              <div className="text-sm text-gray-900">¥{order.totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 备注 */}
        {order.remark && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">备注</h3>
            <div className="text-sm text-gray-900">{order.remark}</div>
          </div>
        )}

        {/* 入库表单 */}
        {order.status === '已完成' && showStockInForm && (
          <div className="space-y-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-blue-200 pb-3">入库信息</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  仓库位置 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stockLocation}
                  onChange={(e) => setStockLocation(e.target.value)}
                  placeholder="例如：A区-01-01 或 1号仓库-A区-01"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">请输入仓库位置，例如：A区-01-01</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleStockIn}
                  disabled={!stockLocation.trim()}
                  className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  确认入库
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStockInForm(false)
                    setStockLocation('')
                  }}
                  className="h-9 border-gray-300 rounded-xl"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
        {order.status === '加工中' && (
          <Button
            onClick={handleMarkAsCompleted}
            className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            标记为已完成
          </Button>
        )}
        {order.status === '已完成' && !showStockInForm && (
          <Button
            onClick={() => setShowStockInForm(true)}
            className="h-9 rounded-xl bg-green-600 hover:bg-green-700"
          >
            <Package className="w-4 h-4 mr-2" />
            入库
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClose}
          className="h-9 border-gray-300 rounded-xl"
        >
          关闭
        </Button>
      </div>
    </div>
  )
}

export default DyeingDetail

