import { useMemo } from 'react'
import { X, FileText, Package, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import Button from '../ui/Button'

interface InventoryCheckPreviewProps {
  name: string
  warehouse: string
  planDate: string
  remark?: string
  items: Array<{
    batchId: string
    productName: string
    colorName: string
    batchCode: string
    systemQuantity: number
    actualQuantity?: number
    unit: string
  }>
  isOpen: boolean
  onClose: () => void
}

function InventoryCheckPreview({
  name,
  warehouse,
  planDate,
  remark,
  items,
  isOpen,
  onClose,
}: InventoryCheckPreviewProps) {
  if (!isOpen) return null
  // 计算统计信息
  const stats = useMemo(() => {
    const totalItems = items.length
    const completedItems = items.filter((item) => item.actualQuantity !== undefined).length
    const surplus = items.reduce((sum, item) => {
      const diff = (item.actualQuantity || item.systemQuantity) - item.systemQuantity
      return sum + (diff > 0 ? diff : 0)
    }, 0)
    const deficit = items.reduce((sum, item) => {
      const diff = (item.actualQuantity || item.systemQuantity) - item.systemQuantity
      return sum + (diff < 0 ? Math.abs(diff) : 0)
    }, 0)

    return {
      totalItems,
      completedItems,
      surplus,
      deficit,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    }
  }, [items])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-[1152px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">盘点单预览</h2>
              <p className="text-sm text-gray-600 mt-1">盘点名称：{name || '未填写'}</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">基本信息</h3>
            </div>

            <div className="grid grid-cols-4 gap-x-8 gap-y-4">
              {/* 盘点名称 */}
              <div>
                <div className="text-sm text-gray-600 mb-1">盘点名称</div>
                <div className="text-base text-gray-900">{name || '-'}</div>
              </div>

              {/* 盘点仓库 */}
              <div>
                <div className="text-sm text-gray-600 mb-1">盘点仓库</div>
                <div className="text-base text-gray-900">{warehouse || '-'}</div>
              </div>

              {/* 计划日期 */}
              <div>
                <div className="text-sm text-gray-600 mb-1">计划日期</div>
                <div className="text-base text-gray-900">
                  {planDate ? format(new Date(planDate), 'yyyy-MM-dd') : '-'}
                </div>
              </div>

              {/* 盘点进度 */}
              <div>
                <div className="text-sm text-gray-600 mb-1">盘点进度</div>
                <div className="text-base text-gray-900">
                  {stats.completedItems}/{stats.totalItems} ({stats.progress}%)
                </div>
              </div>

              {/* 备注说明 */}
              {remark && (
                <div className="col-span-4">
                  <div className="text-sm text-gray-600 mb-1">备注说明</div>
                  <div className="text-base text-gray-900">{remark}</div>
                </div>
              )}
            </div>
          </div>

          {/* 盘点统计 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-blue-600 mb-1">盘点项数</div>
                  <div className="text-2xl font-semibold text-blue-900">{stats.totalItems}</div>
                </div>
              </div>
            </div>

            <div className="bg-success-50 border border-success-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <div className="text-sm text-success-600 mb-1">盘盈总量</div>
                  <div className="text-2xl font-semibold text-success-900">
                    +{stats.surplus.toFixed(2)} kg
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-danger-600" />
                </div>
                <div>
                  <div className="text-sm text-danger-600 mb-1">盘亏总量</div>
                  <div className="text-2xl font-semibold text-danger-900">
                    -{stats.deficit.toFixed(2)} kg
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 盘点明细 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">盘点明细</h3>
                <span className="text-sm text-gray-600">（共 {items.length} 项）</span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">暂无盘点明细</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                        商品信息
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">色号</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">缸号</th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                        系统库存
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                        实际盘点
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">差异</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const difference =
                        (item.actualQuantity || item.systemQuantity) - item.systemQuantity
                      return (
                        <tr
                          key={item.batchId}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        >
                          <td className="px-6 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900">{item.colorName}</td>
                          <td className="px-6 py-3 text-sm text-gray-900">{item.batchCode}</td>
                          <td className="px-6 py-3 text-right text-sm text-gray-600">
                            {item.systemQuantity.toFixed(2)} {item.unit}
                          </td>
                          <td className="px-6 py-3 text-right text-sm text-gray-900">
                            {(item.actualQuantity || item.systemQuantity).toFixed(2)} {item.unit}
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-medium">
                            <span
                              className={cn({
                                'text-success-600': difference > 0,
                                'text-danger-600': difference < 0,
                                'text-gray-600': difference === 0,
                              })}
                            >
                              {difference > 0 ? '+' : ''}
                              {difference.toFixed(2)} {item.unit}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end bg-gray-50">
          <Button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InventoryCheckPreview

