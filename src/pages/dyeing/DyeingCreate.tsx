import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDyeingStore } from '@/store/dyeingStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import { DyeingOrderFormData, DyeingOrderItem } from '@/types/dyeing'
import Button from '../../components/ui/Button'
import Tooltip from '../../components/ui/Tooltip'
import { X, Plus, Trash2, FileText, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface ColorItemForm extends Omit<DyeingOrderItem, 'id'> {
  tempId?: string
}

function DyeingCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addOrder, updateOrder, getOrder, loadOrders } = useDyeingStore()
  const { products, colors, batches, loadAll: loadProducts } = useProductStore()
  const { getSuppliers, loadAll: loadContacts } = useContactStore()

  const isEditMode = !!id
  const existingOrder = isEditMode ? getOrder(id!) : null
  
  // 加载数据
  useEffect(() => {
    loadProducts()
    loadContacts()
    if (isEditMode) {
      loadOrders()
    }
  }, [isEditMode, loadProducts, loadContacts, loadOrders])

  // 获取白坯纱线的批次
  // 白坯批次没有关联色号，colorId 为空字符串
  const whiteYarnBatches = useMemo(() => {
    const whiteProducts = products.filter((p) => p.isWhiteYarn === true)
    
    // 查找所有 colorId 为空字符串的批次（白坯批次）
    const whiteBatches = batches.filter((b) => !b.colorId || b.colorId === '')
    
    // 由于批次没有直接关联商品，我们需要通过其他方式识别
    // 这里我们返回所有白坯批次，让用户在选择时通过商品选择来确定
    return whiteBatches.map((batch) => {
      // 尝试通过批次的供应商或其他信息来推断商品
      // 但为了简化，我们先返回所有白坯批次
      return {
        batch,
        color: null,
        product: null, // 商品将通过表单选择
        displayText: `${batch.code} (库存: ${batch.stockQuantity} kg)`,
      }
    })
  }, [products, batches])

  // 获取所有色号选项（非白坯）
  const colorOptions = useMemo(() => {
    return colors
      .filter((c) => {
        const product = products.find((p) => p.id === c.productId)
        return product && product.isWhiteYarn !== true
      })
      .map((c) => {
        const product = products.find((p) => p.id === c.productId)
        return {
          value: c.id,
          label: `${c.code} - ${c.name}`,
          color: c,
          product,
        }
      })
  }, [colors, products])

  // 获取所有供应商（作为加工厂）
  const factoryOptions = useMemo(() => {
    return getSuppliers().map((s) => ({
      value: s.id,
      label: s.name,
      supplier: s,
    }))
  }, [getSuppliers])

  const [formData, setFormData] = useState<Omit<DyeingOrderFormData, 'items'>>({
    productId: '',
    productName: '',
    greyBatchId: '',
    greyBatchCode: '',
    factoryId: '',
    factoryName: '',
    factoryPhone: '',
    shipmentDate: format(new Date(), 'yyyy-MM-dd'),
    expectedCompletionDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    processingPrice: 0,
    remark: '',
  })

  const [colorItems, setColorItems] = useState<ColorItemForm[]>([])

  // 当前正在添加的色号表单
  const [currentColorForm, setCurrentColorForm] = useState<ColorItemForm>({
    targetColorId: '',
    targetColorCode: '',
    targetColorName: '',
    targetColorValue: '',
    quantity: 0,
  })

  // 加载编辑模式的数据
  useEffect(() => {
    if (existingOrder) {
      // 检查是否可以编辑（只能编辑待发货状态）
      if (existingOrder.status !== '待发货') {
        alert('只能编辑待发货状态的加工单')
        navigate('/dyeing')
        return
      }

      setFormData({
        productId: existingOrder.productId,
        productName: existingOrder.productName,
        greyBatchId: existingOrder.greyBatchId,
        greyBatchCode: existingOrder.greyBatchCode,
        factoryId: existingOrder.factoryId || '',
        factoryName: existingOrder.factoryName,
        factoryPhone: existingOrder.factoryPhone || '',
        shipmentDate: existingOrder.shipmentDate,
        expectedCompletionDate: existingOrder.expectedCompletionDate,
        processingPrice: existingOrder.processingPrice,
        remark: existingOrder.remark || '',
      })

      setColorItems(
        existingOrder.items.map((item) => ({
          ...item,
          tempId: item.id,
        }))
      )
    }
  }, [existingOrder, navigate])

  // 选择白坯批次
  const handleSelectBatch = (batchId: string) => {
    const batchOption = whiteYarnBatches.find((b) => b.batch.id === batchId)
    if (!batchOption || !batchOption.batch) return

    setFormData({
      ...formData,
      greyBatchId: batchOption.batch.id,
      greyBatchCode: batchOption.batch.code,
    })
  }

  // 添加目标色号
  const handleAddColorItem = () => {
    if (!currentColorForm.targetColorId || currentColorForm.quantity <= 0) {
      alert('请选择色号并填写染色重量')
      return
    }

    const selectedColorOption = colorOptions.find((opt) => opt.value === currentColorForm.targetColorId)
    if (!selectedColorOption) {
      alert('请选择有效的色号')
      return
    }

    const newItem: ColorItemForm = {
      targetColorId: selectedColorOption.color.id,
      targetColorCode: selectedColorOption.color.code,
      targetColorName: selectedColorOption.color.name,
      targetColorValue: selectedColorOption.color.colorValue,
      quantity: currentColorForm.quantity,
      tempId: Date.now().toString(),
    }

    setColorItems([...colorItems, newItem])
    setCurrentColorForm({
      targetColorId: '',
      targetColorCode: '',
      targetColorName: '',
      targetColorValue: '',
      quantity: 0,
    })
  }

  // 删除目标色号
  const handleRemoveColorItem = (tempId: string) => {
    setColorItems(colorItems.filter((item) => item.tempId !== tempId))
  }

  // 选择加工厂
  const handleSelectFactory = (factoryOption: typeof factoryOptions[0]) => {
    setFormData({
      ...formData,
      factoryId: factoryOption.supplier.id,
      factoryName: factoryOption.supplier.name,
      factoryPhone: factoryOption.supplier.phone || '',
    })
  }

  // 计算总金额
  const totalAmount = useMemo(() => {
    const totalQuantity = colorItems.reduce((sum, item) => sum + item.quantity, 0)
    return totalQuantity * formData.processingPrice
  }, [colorItems, formData.processingPrice])

  // 提交表单
  const handleSubmit = () => {
    // 验证
    if (!formData.greyBatchId || !formData.greyBatchCode) {
      alert('请选择白坯缸号')
      return
    }
    if (colorItems.length === 0) {
      alert('请至少添加一个目标色号')
      return
    }
    if (!formData.factoryId || !formData.factoryName) {
      alert('请选择加工厂')
      return
    }
    if (!formData.shipmentDate || !formData.expectedCompletionDate) {
      alert('请填写发货日期和预计完成日期')
      return
    }
    if (formData.processingPrice <= 0) {
      alert('请输入加工单价')
      return
    }

    // 创建或更新加工单
    const orderData: DyeingOrderFormData = {
      ...formData,
      items: colorItems.map((item) => ({
        targetColorId: item.targetColorId,
        targetColorCode: item.targetColorCode,
        targetColorName: item.targetColorName,
        targetColorValue: item.targetColorValue,
        quantity: item.quantity,
      })),
    }

    if (isEditMode && existingOrder) {
      updateOrder(existingOrder.id, orderData)
    } else {
      addOrder(orderData)
    }
    navigate('/dyeing')
  }

  const selectedBatch = whiteYarnBatches.find((b) => b.batch.id === formData.greyBatchId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => navigate('/dyeing')}
      />

      {/* 表单内容 */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[1200px] h-[calc(100vh-48px)] mx-auto my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 min-h-[61px]">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? '编辑加工单' : '新建加工单'}
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dyeing')}
              className="h-9 border-gray-300 rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isEditMode ? '保存修改' : '创建加工单'}
            </Button>
            <button
              onClick={() => navigate('/dyeing')}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 白坯信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">白坯信息</h3>
              <Tooltip
                content={
                  <div>
                    <div className="font-medium mb-1">提示：</div>
                    <div>
                      染色加工只能选择白坯纱线。可以将一批白坯纱线分染成多个不同的色号，例如100kg白坯可以染成红色50kg、绿色50kg。
                    </div>
                  </div>
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  白坯缸号 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.greyBatchId}
                  onChange={(e) => {
                    handleSelectBatch(e.target.value)
                  }}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择白坯缸号</option>
                  {whiteYarnBatches.map((batchOption) => (
                    <option key={batchOption.batch.id} value={batchOption.batch.id}>
                      {batchOption.displayText}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  type="text"
                  value={formData.productName}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                  placeholder="选择白坯缸号后自动填充"
                />
              </div>
            </div>
          </div>

          {/* 目标色号 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">目标色号</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddColorItem}
                disabled={!currentColorForm.targetColorId || currentColorForm.quantity <= 0}
                className="h-8 border-gray-300 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加色号
              </Button>
            </div>

            {/* 色号添加表单 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    色号 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentColorForm.targetColorId}
                    onChange={(e) => {
                      const selectedColorOption = colorOptions.find((opt) => opt.value === e.target.value)
                      if (selectedColorOption) {
                        setCurrentColorForm({
                          ...currentColorForm,
                          targetColorId: selectedColorOption.color.id,
                          targetColorCode: selectedColorOption.color.code,
                          targetColorName: selectedColorOption.color.name,
                          targetColorValue: selectedColorOption.color.colorValue || '',
                        })
                      }
                    }}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择色号</option>
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">色号名称</label>
                  <input
                    type="text"
                    value={currentColorForm.targetColorName}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                    placeholder="选择色号后自动填充"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    染色重量 (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentColorForm.quantity || ''}
                    onChange={(e) => setCurrentColorForm({ ...currentColorForm, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="请输入重量"
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 已添加的色号列表 */}
            {colorItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-bold text-gray-700">色号</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">色号名称</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">染色重量</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colorItems.map((item) => (
                      <tr key={item.tempId} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.targetColorValue && (
                              <div
                                className="w-3 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: item.targetColorValue }}
                              />
                            )}
                            <span className="text-gray-900">{item.targetColorCode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">{item.targetColorName}</td>
                        <td className="px-4 py-3 text-gray-900">{item.quantity} kg</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveColorItem(item.tempId!)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 加工厂信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">加工厂信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加工厂 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.factoryId}
                  onChange={(e) => {
                    const selected = factoryOptions.find((f) => f.value === e.target.value)
                    if (selected) {
                      handleSelectFactory(selected)
                    }
                  }}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择加工厂</option>
                  {factoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
                <input
                  type="text"
                  value={formData.factoryPhone}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                  placeholder="选择加工厂后自动填充"
                />
              </div>
            </div>
          </div>

          {/* 时间安排 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">时间安排</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发货日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.shipmentDate}
                    onChange={(e) => setFormData({ ...formData, shipmentDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预计完成日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 费用信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">费用信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加工单价 (元/kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.processingPrice || ''}
                  onChange={(e) => setFormData({ ...formData, processingPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="请输入加工单价"
                  step="0.01"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">总金额</label>
                <input
                  type="text"
                  value={`¥${totalAmount.toFixed(2)}`}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">备注</h3>
            <textarea
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="请输入备注信息（选填）"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default DyeingCreate

