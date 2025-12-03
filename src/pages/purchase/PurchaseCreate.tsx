import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useContactStore } from '@/store/contactStore'
import { useProductStore } from '@/store/productStore'
import { useAccountStore } from '@/store/accountStore'
import { PurchaseOrderFormData, PurchaseOrderItem } from '@/types/purchase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { X, Plus, Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface PurchaseOrderItemForm extends Omit<PurchaseOrderItem, 'id' | 'amount'> {
  amount: number
}

function PurchaseCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { generateOrderNumber, addOrder, updateOrder, getOrder } = usePurchaseStore()
  const { suppliers, getSuppliers } = useContactStore()
  const { products, colors, getColorsByProduct } = useProductStore()

  const isEditMode = !!id
  const existingOrder = isEditMode ? getOrder(id!) : null

  const orderNumber = useMemo(() => {
    if (existingOrder) {
      return existingOrder.orderNumber
    }
    return generateOrderNumber()
  }, [existingOrder, generateOrderNumber])

  const [formData, setFormData] = useState<Omit<PurchaseOrderFormData, 'items'>>({
    supplierId: '',
    supplierName: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    remark: '',
    paidAmount: 0,
  })

  const [itemForm, setItemForm] = useState({
    productId: '',
    colorId: '',
    batchCode: '',
    quantity: 0,
    price: 0,
  })

  const [items, setItems] = useState<PurchaseOrderItemForm[]>([])

  // 加载订单数据（编辑模式）
  useEffect(() => {
    if (existingOrder) {
      // 检查是否可以编辑（只能编辑草稿状态）
      if (existingOrder.status !== '草稿') {
        alert('只能编辑草稿状态的进货单')
        navigate('/purchase')
        return
      }

      setFormData({
        supplierId: existingOrder.supplierId,
        supplierName: existingOrder.supplierName,
        purchaseDate: existingOrder.purchaseDate,
        expectedDate: existingOrder.expectedDate,
        remark: existingOrder.remark || '',
        paidAmount: existingOrder.paidAmount || 0,
      })

      setItems(
        existingOrder.items.map((item) => ({
          ...item,
          amount: item.amount,
        }))
      )
    }
  }, [existingOrder, navigate])

  // 获取所有供应商选项
  const supplierOptions = useMemo(() => {
    return getSuppliers().map((s) => ({
      value: s.id,
      label: s.name,
    }))
  }, [suppliers])

  // 获取所有商品选项
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: `${p.name} ${p.specification || ''}`.trim(),
    }))
  }, [products])

  // 获取当前商品对应的色号选项
  const colorOptions = useMemo(() => {
    if (!itemForm.productId) return []
    return getColorsByProduct(itemForm.productId).map((c) => ({
      value: c.id,
      label: `${c.code} - ${c.name}`,
    }))
  }, [itemForm.productId, colors])

  // 计算金额
  const itemAmount = useMemo(() => {
    return itemForm.quantity * itemForm.price
  }, [itemForm.quantity, itemForm.price])

  // 获取当前选中的商品和色号信息
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === itemForm.productId)
  }, [itemForm.productId, products])

  const selectedColor = useMemo(() => {
    return colors.find((c) => c.id === itemForm.colorId)
  }, [itemForm.colorId, colors])

  // 添加商品到清单
  const handleAddItem = () => {
    if (!itemForm.productId || !itemForm.colorId || !itemForm.batchCode || itemForm.quantity <= 0 || itemForm.price <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    if (!selectedProduct || !selectedColor) {
      alert('请选择有效的商品和色号')
      return
    }

    const newItem: PurchaseOrderItemForm = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      colorCode: selectedColor.code,
      batchCode: itemForm.batchCode,
      quantity: itemForm.quantity,
      unit: selectedProduct.unit || 'kg',
      price: itemForm.price,
      amount: itemAmount,
    }

    setItems([...items, newItem])
    // 重置表单
    setItemForm({
      productId: '',
      colorId: '',
      batchCode: '',
      quantity: 0,
      price: 0,
    })
  }

  // 删除清单项
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // 处理供应商选择
  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    setFormData({
      ...formData,
      supplierId: supplierId,
      supplierName: supplier?.name || '',
    })
  }

  // 保存草稿
  const handleSaveDraft = () => {
    if (!formData.supplierId) {
      alert('请选择供应商')
      return
    }

    const orderData: PurchaseOrderFormData = {
      ...formData,
      items: items.map(({ amount, ...item }) => item),
    }

    if (isEditMode && existingOrder) {
      updateOrder(existingOrder.id, orderData)
    } else {
      addOrder(orderData, '草稿')
    }
    navigate('/purchase')
  }

  // 保存并入库
  const handleSaveAndSubmit = () => {
    if (!formData.supplierId) {
      alert('请选择供应商')
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品')
      return
    }

    const orderData: PurchaseOrderFormData = {
      ...formData,
      items: items.map(({ amount, ...item }) => item),
    }

    if (isEditMode && existingOrder) {
      // 编辑模式下，先更新订单数据
      updateOrder(existingOrder.id, orderData)
      
      // 如果订单是草稿状态，将其改为已入库状态并执行入库操作
      if (existingOrder.status === '草稿') {
        // 先更新为已入库状态，然后执行入库逻辑
        const updatedOrder = { ...existingOrder, ...orderData, status: '已入库' as const }
        // 执行入库逻辑（创建批次、生成应付账款等）
        const { addBatch } = useProductStore.getState()
        const { addAccountPayable } = useAccountStore.getState()
        
        // 为每个明细创建缸号并增加库存
        updatedOrder.items.forEach((item) => {
          const products = useProductStore.getState().products
          const colors = useProductStore.getState().colors
          const product = products.find((p) => p.id === item.productId)
          const color = colors.find((c) => c.id === item.colorId)
          
          if (product && color) {
            addBatch(color.id, {
              code: item.batchCode,
              productionDate: item.productionDate || new Date().toISOString().split('T')[0],
              supplierId: updatedOrder.supplierId,
              purchasePrice: item.price,
              initialQuantity: item.quantity,
              stockLocation: item.stockLocation,
              remark: item.remark,
            })
          }
        })
        
        // 如果有欠款，生成应付账款
        const unpaidAmount = updatedOrder.totalAmount - (updatedOrder.paidAmount || 0)
        if (unpaidAmount > 0) {
          addAccountPayable({
            supplierId: updatedOrder.supplierId,
            supplierName: updatedOrder.supplierName,
            purchaseOrderId: updatedOrder.id,
            purchaseOrderNumber: updatedOrder.orderNumber,
            payableAmount: updatedOrder.totalAmount,
            paidAmount: updatedOrder.paidAmount || 0,
            accountDate: updatedOrder.purchaseDate,
          })
        }
        
        // 更新状态为已入库
        updateOrder(existingOrder.id, { status: '已入库' } as any)
      } else {
        alert('只能对草稿状态的订单进行保存并入库操作')
        return
      }
    } else {
      // 直接创建为已入库状态（会自动执行入库逻辑）
      addOrder(orderData, '已入库')
    }
    navigate('/purchase')
  }

  // 取消
  const handleCancel = () => {
    if (confirm('确定要取消吗？未保存的数据将丢失。')) {
      navigate('/purchase')
    }
  }

  // 计算总金额
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.amount, 0)
  }, [items])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
      />
      
      {/* 表单内容 */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[1152px] max-h-[90vh] mx-auto my-6 flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? '编辑进货单' : '新建进货单'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? '修改进货单信息' : '填写进货单信息，选择供应商和商品'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基础信息 */}
          <Card className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基础信息</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* 进货单号 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">进货单号</label>
                <input
                  type="text"
                  value={orderNumber}
                  readOnly
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                />
              </div>

              {/* 预计到货日期（编辑模式时显示） */}
              {isEditMode && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">预计到货日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.expectedDate || ''}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 供应商 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  供应商
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">点击选择供应商</option>
                  {supplierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 进货日期 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">进货日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 备注 */}
              <div className="col-span-3">
                <label className="block text-sm text-gray-600 mb-2">备注</label>
                <textarea
                  value={formData.remark || ''}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  placeholder="填写备注信息..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* 添加商品 */}
          <Card className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">添加商品</h3>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              {/* 选择商品 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">选择商品</label>
                <select
                  value={itemForm.productId}
                  onChange={(e) => {
                    setItemForm({ ...itemForm, productId: e.target.value, colorId: '' })
                  }}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择</option>
                  {productOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 选择色号 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">选择色号</label>
                <select
                  value={itemForm.colorId}
                  onChange={(e) => setItemForm({ ...itemForm, colorId: e.target.value })}
                  disabled={!itemForm.productId}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">请选择</option>
                  {colorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 缸号 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">缸号</label>
                <input
                  type="text"
                  value={itemForm.batchCode}
                  onChange={(e) => setItemForm({ ...itemForm, batchCode: e.target.value })}
                  placeholder="自动生成或手动输入"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 数量 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">数量(kg)</label>
                <input
                  type="number"
                  value={itemForm.quantity || ''}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* 单价 */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">单价(元)</label>
                <input
                  type="number"
                  value={itemForm.price || ''}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 金额 */}
      <div>
                <label className="block text-sm text-gray-600 mb-2">金额(元)</label>
                <input
                  type="text"
                  value={itemAmount.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-600"
                />
      </div>
      
              {/* 添加到清单按钮 */}
              <div className="col-span-2 flex items-end">
                <Button
                  onClick={handleAddItem}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加到清单
                </Button>
              </div>
            </div>
          </Card>

          {/* 商品清单 */}
          {items.length > 0 && (
            <Card className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">商品名称</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">色号</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">缸号</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">数量</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">单价</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">金额</th>
                      <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{item.productName}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{item.colorCode}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{item.batchCode}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{item.quantity} {item.unit}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">¥{item.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">¥{item.amount.toFixed(2)}</td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        合计：
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        ¥{totalAmount.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
      </Card>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="h-9 border-gray-300 rounded-lg"
          >
            取消
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="h-9 border-gray-300 rounded-lg"
          >
            保存草稿
          </Button>
          <Button
            onClick={handleSaveAndSubmit}
            className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Package className="w-4 h-4 mr-2" />
            保存并入库
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PurchaseCreate
