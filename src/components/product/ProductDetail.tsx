import { useMemo } from 'react'
import { Product } from '@/types/product'
import { useProductStore } from '@/store/productStore'
import Badge from '../ui/Badge'
import { Package, Palette, Layers, Edit, Trash2, X } from 'lucide-react'
import Button from '../ui/Button'

interface ProductDetailProps {
  product: Product
  onEdit?: () => void
  onDelete?: () => void
  onClose: () => void
}

function ProductDetail({ product, onEdit, onDelete, onClose }: ProductDetailProps) {
  const { colors, batches, getBatchesByColor } = useProductStore()

  // 获取商品关联的色号
  const productColors = useMemo(() => {
    return colors.filter((c) => c.productId === product.id)
  }, [colors, product.id])

  // 获取总库存
  const totalStock = useMemo(() => {
    const colorIds = productColors.map((c) => c.id)
    const productBatches = batches.filter((b) => colorIds.includes(b.colorId))
    return productBatches.reduce((sum, b) => sum + b.stockQuantity, 0)
  }, [productColors, batches])

  // 获取色号数量
  const colorCount = productColors.length

  // 获取缸号数量
  const batchCount = useMemo(() => {
    const colorIds = productColors.map((c) => c.id)
    return batches.filter((b) => colorIds.includes(b.colorId)).length
  }, [productColors, batches])

  return (
    <div className="bg-white rounded-xl shadow-xl w-[681px] max-h-[90vh] flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 min-h-[101px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">商品详情</h2>
            <p className="text-sm text-gray-600">
              {product.code} - {product.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 border-gray-300 rounded-lg text-sm"
            >
              <Edit className="w-4 h-4 mr-1" />
              编辑
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 border-gray-300 rounded-lg text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              删除
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
        {/* 商品基础信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">商品基础信息</h3>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">商品编码</div>
              <div className="text-sm text-gray-900">{product.code}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">商品名称</div>
              <div className="text-sm text-gray-900">{product.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">规格</div>
              <div className="text-sm text-gray-900">{product.specification || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">成分</div>
              <div className="text-sm text-gray-900">{product.composition || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">支数</div>
              <div className="text-sm text-gray-900">{product.count || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">单位</div>
              <div className="text-sm text-gray-900">{product.unit || 'kg'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">分类</div>
              <div className="text-sm text-gray-900">{product.type || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">供应商</div>
              <div className="text-sm text-gray-900">-</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">状态</div>
              <Badge variant="success" className="bg-green-100 text-green-700">正常</Badge>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-4">
            <div className="text-sm text-gray-600 mb-1">备注</div>
            <div className="text-sm text-gray-700">
              {product.description || '高品质精梳棉纱，适用于高档面料'}
            </div>
          </div>
        </div>

        {/* 库存信息 */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">库存信息</h3>
          </div>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">总库存</div>
              <div className="text-sm font-medium text-green-600">
                {totalStock} {product.unit || 'kg'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">色号数量</div>
              <div className="text-sm text-gray-900">{colorCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">缸号数量</div>
              <div className="text-sm text-gray-900">{batchCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">库存预警</div>
              <div className="text-sm text-gray-900">500 - 10000 kg</div>
            </div>
          </div>
        </div>

        {/* 色号与缸号明细 */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-purple-50 border-b border-purple-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">色号与缸号明细</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {productColors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无色号数据</div>
            ) : (
              productColors.map((color) => {
                const colorBatches = getBatchesByColor(color.id)
                return (
                  <div
                    key={color.id}
                    className="border border-purple-200 rounded-xl overflow-hidden"
                  >
                    {/* 色号标题 */}
                    <div className="bg-purple-50 border-b border-purple-200 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Palette className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              色号: {color.code}
                            </span>
                            <span className="text-sm text-gray-600">- {color.name}</span>
                            {color.description && (
                              <span className="text-xs text-gray-500">
                                ({color.description})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="gray" className="inline-flex items-center gap-1 bg-gray-100 text-gray-900">
                            <Layers className="w-3 h-3" />
                            <span>{colorBatches.length} 缸</span>
                          </Badge>
                          <span className="text-sm text-gray-900">
                            {colorBatches.reduce((sum, b) => sum + b.stockQuantity, 0)}{' '}
                            {product.unit || 'kg'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* 缸号表格 */}
                    {colorBatches.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 h-8">
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                缸号
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                数量
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                单价
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                金额
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                生产日期
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">
                                仓位
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {colorBatches.map((batch) => {
                              const amount =
                                (batch.purchasePrice || 0) * batch.stockQuantity
                              return (
                                <tr
                                  key={batch.id}
                                  className="border-b border-gray-200 hover:bg-gray-50 h-10"
                                >
                                  <td className="px-4 py-2.5 text-xs text-gray-900">
                                    {batch.code}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-900">
                                    {batch.stockQuantity} {product.unit || 'kg'}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-900">
                                    {batch.purchasePrice ? `¥${batch.purchasePrice}` : '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-900">
                                    {amount > 0 ? `¥${amount.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-600">
                                    {batch.productionDate
                                      ? new Date(batch.productionDate).toLocaleDateString('zh-CN')
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-gray-600">
                                    {batch.stockLocation || '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 其他信息 */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">其他信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">创建时间</div>
              <div className="text-sm text-gray-900">
                {product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString('zh-CN')
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">更新时间</div>
              <div className="text-sm text-gray-900">
                {product.updatedAt
                  ? new Date(product.updatedAt).toLocaleDateString('zh-CN')
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          className="h-9 border-gray-300 rounded-lg"
        >
          关闭
        </Button>
      </div>
    </div>
  )
}

export default ProductDetail

