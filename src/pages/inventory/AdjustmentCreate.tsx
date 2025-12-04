import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdjustmentStore } from '@/store/adjustmentStore'
import { useProductStore } from '@/store/productStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { AdjustmentOrderFormData, AdjustmentType } from '@/types/adjustment'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { X, Plus, FileText, Trash2, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface AdjustmentItemForm {
  batchId: string
  batchCode: string
  productId: string
  productName: string
  colorId: string
  colorName: string
  colorCode: string
  quantity: number
  unit: string
  remark?: string
}

function AdjustmentCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addOrder, updateOrder, getOrder, completeOrder } = useAdjustmentStore()
  const { products, colors, batches } = useProductStore()
  const { getInventoryDetails } = useInventoryStore()

  const isEditMode = !!id
  const existingOrder = isEditMode ? getOrder(id!) : null

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>(
    existingOrder?.type || '调增'
  )
  const [adjustmentDate, setAdjustmentDate] = useState(
    existingOrder?.adjustmentDate || format(new Date(), 'yyyy-MM-dd')
  )
  const [remark, setRemark] = useState(existingOrder?.remark || '')
  const [items, setItems] = useState<AdjustmentItemForm[]>(
    existingOrder?.items.map(item => ({
      batchId: item.batchId,
      batchCode: item.batchCode,
      productId: item.productId,
      productName: item.productName,
      colorId: item.colorId,
      colorName: item.colorName,
      colorCode: item.colorCode,
      quantity: item.quantity,
      unit: item.unit,
      remark: item.remark,
    })) || []
  )

  // 当前正在添加的明细表单
  const [currentItemForm, setCurrentItemForm] = useState({
    productId: '',
    colorId: '',
    batchId: '',
    quantity: 0,
    remark: '',
  })

  // 所有库存明细，用于选择
  const inventoryDetails = useMemo(() => getInventoryDetails(), [products, colors, batches])

  // 根据选择的商品获取可用的色号
  const availableColors = useMemo(() => {
    if (!currentItemForm.productId) return []
    return colors.filter(c => c.productId === currentItemForm.productId)
  }, [currentItemForm.productId, colors])

  // 根据选择的色号获取可用的缸号
  const availableBatches = useMemo(() => {
    if (!currentItemForm.colorId) return []
    return batches
      .filter(b => b.colorId === currentItemForm.colorId && b.stockQuantity > 0)
      .map(batch => {
        const inventoryItem = inventoryDetails.find(item => item.batch.id === batch.id)
        return {
          batch,
          inventoryItem,
        }
      })
  }, [currentItemForm.colorId, batches, inventoryDetails])

  // 加载编辑模式数据
  useEffect(() => {
    if (isEditMode && existingOrder) {
      if (existingOrder.status !== '草稿') {
        alert('只能编辑草稿状态的调整单')
        navigate('/inventory/adjustment')
        return
      }
      setAdjustmentType(existingOrder.type)
      setAdjustmentDate(existingOrder.adjustmentDate)
      setRemark(existingOrder.remark || '')
      setItems(
        existingOrder.items.map(item => ({
          batchId: item.batchId,
          batchCode: item.batchCode,
          productId: item.productId,
          productName: item.productName,
          colorId: item.colorId,
          colorName: item.colorName,
          colorCode: item.colorCode,
          quantity: item.quantity,
          unit: item.unit,
          remark: item.remark,
        }))
      )
    }
  }, [isEditMode, existingOrder, navigate])

  // 添加明细
  const handleAddItem = () => {
    if (!currentItemForm.productId || !currentItemForm.colorId || !currentItemForm.batchId || currentItemForm.quantity === 0) {
      alert('请选择商品、色号、缸号并输入调整数量')
      return
    }

    const inventoryItem = inventoryDetails.find(
      (item) => item.batch.id === currentItemForm.batchId
    )
    if (!inventoryItem) {
      alert('未找到对应的库存信息')
      return
    }

    // 根据调整类型确定数量的正负
    let quantity = Math.abs(currentItemForm.quantity)
    if (adjustmentType === '调减' || adjustmentType === '盘亏' || adjustmentType === '报损') {
      quantity = -quantity
    }

    // 检查是否已存在相同批次，如果存在则更新数量
    const existingItemIndex = items.findIndex(item => item.batchId === currentItemForm.batchId)
    if (existingItemIndex > -1) {
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += quantity
      setItems(updatedItems)
    } else {
      setItems([
        ...items,
        {
          batchId: inventoryItem.batch.id,
          batchCode: inventoryItem.batch.code,
          productId: inventoryItem.productId,
          productName: inventoryItem.productName,
          colorId: inventoryItem.colorId,
          colorName: inventoryItem.colorName,
          colorCode: inventoryItem.colorCode,
          quantity,
          unit: products.find(p => p.id === inventoryItem.productId)?.unit || 'kg',
          remark: currentItemForm.remark,
        },
      ])
    }

    setCurrentItemForm({
      productId: '',
      colorId: '',
      batchId: '',
      quantity: 0,
      remark: '',
    })
  }

  // 删除明细
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // 提交表单
  const handleSubmit = (status: '草稿' | '已完成' = '草稿') => {
    if (!adjustmentType) {
      alert('请选择调整类型')
      return
    }
    if (!adjustmentDate) {
      alert('请选择调整日期')
      return
    }
    if (items.length === 0) {
      alert('请至少添加一条调整明细')
      return
    }

    const orderData: AdjustmentOrderFormData = {
      type: adjustmentType,
      adjustmentDate,
      items: items.map((item) => {
        const inventoryItem = inventoryDetails.find((inv) => inv.batch.id === item.batchId)
        if (!inventoryItem) {
          throw new Error(`未找到批次 ${item.batchId} 的库存信息`)
        }
        return {
          batchId: item.batchId,
          batchCode: item.batchCode,
          productId: item.productId,
          productName: item.productName,
          colorId: item.colorId,
          colorName: item.colorName,
          colorCode: item.colorCode,
          quantity: item.quantity,
          unit: item.unit,
          remark: item.remark || '',
        }
      }),
      remark,
    }

    if (isEditMode && existingOrder) {
      updateOrder(existingOrder.id, orderData)
      if (status === '已完成') {
        completeOrder(existingOrder.id)
      }
    } else {
      const newOrder = addOrder(orderData, status)
      if (status === '已完成') {
        completeOrder(newOrder.id)
      }
    }
    navigate('/inventory/adjustment')
  }

  // 调整类型配置
  const adjustmentTypeOptions: Array<{
    type: AdjustmentType
    label: string
    icon: any
    iconColor: string
  }> = [
    {
      type: '调增',
      label: '调增',
      icon: TrendingUp,
      iconColor: 'text-green-600',
    },
    {
      type: '调减',
      label: '调减',
      icon: TrendingDown,
      iconColor: 'text-orange-600',
    },
    {
      type: '盘盈',
      label: '盘盈',
      icon: Package,
      iconColor: 'text-gray-600',
    },
    {
      type: '盘亏',
      label: '盘亏',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    {
      type: '报损',
      label: '报损',
      icon: X,
      iconColor: 'text-red-600',
    },
    {
      type: '其他',
      label: '其他',
      icon: FileText,
      iconColor: 'text-gray-600',
    },
  ]


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => navigate('/inventory/adjustment')}
      />

      {/* 表单内容 */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[1200px] h-[calc(100vh-48px)] mx-auto my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 min-h-[61px]">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? '编辑库存调整单' : '新建库存调整单'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">填写调整信息并添加调整明细</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/adjustment')}
              className="h-9 border-gray-300 rounded-lg"
            >
              取消
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit('草稿')}
              className="h-9 border-gray-300 rounded-lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              保存草稿
            </Button>
            <Button
              onClick={() => handleSubmit('已完成')}
              className="h-9 rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              提交完成
            </Button>
            <button
              onClick={() => navigate('/inventory/adjustment')}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 调整类型 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                调整类型 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {adjustmentTypeOptions.map(({ type, label, icon: Icon, iconColor }) => {
                  const isSelected = adjustmentType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentType(type)}
                      className={cn(
                        'h-[68px] flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-colors',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          isSelected ? 'text-primary-600' : iconColor
                        )}
                      />
                      <span className="text-xs font-medium text-gray-900">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 调整日期 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                调整日期 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                className="h-[39px]"
              />
            </div>

            {/* 备注说明 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">备注说明</label>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="填写调整原因..."
                className="min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          {/* 调整明细 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">调整明细</h3>
              <Button
                onClick={handleAddItem}
                className="h-8 rounded-lg bg-primary-600 hover:bg-primary-700"
                disabled={!currentItemForm.productId || !currentItemForm.colorId || !currentItemForm.batchId || currentItemForm.quantity === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加明细
              </Button>
            </div>

            {/* 添加明细表单 */}
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择款号 *</label>
                  <select
                    value={currentItemForm.productId}
                    onChange={(e) => {
                      setCurrentItemForm({
                        productId: e.target.value,
                        colorId: '',
                        batchId: '',
                        quantity: currentItemForm.quantity,
                        remark: currentItemForm.remark,
                      })
                    }}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">请选择款号</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择色号 *</label>
                  <select
                    value={currentItemForm.colorId}
                    onChange={(e) => {
                      setCurrentItemForm({
                        ...currentItemForm,
                        colorId: e.target.value,
                        batchId: '',
                      })
                    }}
                    disabled={!currentItemForm.productId}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择色号</option>
                    {availableColors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name} ({color.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择缸号 *</label>
                  <select
                    value={currentItemForm.batchId}
                    onChange={(e) =>
                      setCurrentItemForm({ ...currentItemForm, batchId: e.target.value })
                    }
                    disabled={!currentItemForm.colorId}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">请选择缸号</option>
                    {availableBatches.map(({ batch, inventoryItem }) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.code} (库存: {batch.stockQuantity} {products.find(p => p.id === inventoryItem?.productId)?.unit || 'kg'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">调整数量 *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItemForm.quantity || ''}
                    onChange={(e) =>
                      setCurrentItemForm({
                        ...currentItemForm,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="请输入数量"
                    disabled={!currentItemForm.batchId}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                  <input
                    type="text"
                    value={currentItemForm.remark}
                    onChange={(e) =>
                      setCurrentItemForm({ ...currentItemForm, remark: e.target.value })
                    }
                    placeholder="明细备注"
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>

            {/* 明细列表 */}
            {items.length === 0 ? (
              <Card className="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">暂无调整明细</p>
                <Button
                  onClick={handleAddItem}
                  className="h-8 rounded-lg bg-primary-600 hover:bg-primary-700"
                  disabled={!currentItemForm.productId || !currentItemForm.colorId || !currentItemForm.batchId || currentItemForm.quantity === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一条明细
                </Button>
              </Card>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">商品信息</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">色号</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">缸号</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">调整数量</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">备注</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.colorName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.batchCode}</td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span
                            className={cn(
                              'font-medium',
                              item.quantity > 0 ? 'text-success-600' : 'text-danger-600'
                            )}
                          >
                            {item.quantity > 0 ? '+' : ''}
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.remark || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            title="删除"
                            className="p-1.5 hover:bg-red-100 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdjustmentCreate
