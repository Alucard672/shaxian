import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { useContactStore } from '@/store/contactStore'
import { useProductStore } from '@/store/productStore'
import { SalesOrderFormData, SalesOrderItem } from '@/types/sales'
import Button from '../../components/ui/Button'
import { X, Plus, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface SalesOrderItemForm extends Omit<SalesOrderItem, 'id' | 'amount'> {
  amount: number
}

function SalesCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { generateOrderNumber, addOrder, updateOrder, getOrder, checkStock, loadOrders } = useSalesStore()
  const { getCustomers, loadAll: loadContacts } = useContactStore()
  const { products, colors, batches, getColorsByProduct, getBatchesByColor, loadAll: loadProducts } = useProductStore()

  // 检查是否是复制模式
  const copyId = new URLSearchParams(window.location.search).get('copy')
  const isCopyMode = !!copyId
  const copyOrder = isCopyMode ? getOrder(copyId) : null

  const isEditMode = !!id
  const existingOrder = isEditMode ? getOrder(id!) : null
  
  // 加载数据
  useEffect(() => {
    loadContacts()
    loadProducts()
    if (isEditMode) {
      loadOrders()
    }
  }, [isEditMode, loadContacts, loadProducts, loadOrders])

  const orderNumber = useMemo(() => {
    if (isEditMode && existingOrder) {
      return existingOrder.orderNumber
    }
    return generateOrderNumber()
  }, [isEditMode, existingOrder, generateOrderNumber])

  const [formData, setFormData] = useState<Omit<SalesOrderFormData, 'items'>>({
    customerId: '',
    customerName: '',
    salesDate: format(new Date(), 'yyyy-MM-dd'),
    expectedDate: '',
    remark: '',
    receivedAmount: 0,
  })

  const [itemForm, setItemForm] = useState({
    productId: '',
    colorId: '',
    batchId: '',
    quantity: 0,
    price: 0,
  })

  const [items, setItems] = useState<SalesOrderItemForm[]>([])

  // 加载订单数据（编辑模式或复制模式）
  useEffect(() => {
    const orderToLoad = isCopyMode ? copyOrder : existingOrder
    if (orderToLoad) {
      // 编辑模式：检查是否可以编辑（只能编辑草稿状态）
      if (isEditMode && orderToLoad.status !== '草稿') {
        alert('只能编辑草稿状态的销售单')
        navigate('/sales')
        return
      }

      setFormData({
        customerId: orderToLoad.customerId,
        customerName: orderToLoad.customerName,
        salesDate: isCopyMode ? format(new Date(), 'yyyy-MM-dd') : orderToLoad.salesDate,
        expectedDate: orderToLoad.expectedDate || '',
        remark: orderToLoad.remark || '',
        receivedAmount: isCopyMode ? 0 : (orderToLoad.receivedAmount || 0),
      })
      // 加载订单明细
      const loadedItems: SalesOrderItemForm[] = orderToLoad.items.map((item) => ({
        ...item,
        amount: item.amount,
      }))
      setItems(loadedItems)
    }
  }, [isEditMode, isCopyMode, existingOrder, copyOrder, navigate])

  // 获取所有客户选项
  const customerOptions = useMemo(() => {
    return getCustomers().map((c) => ({
      value: c.id,
      label: `${c.name} - ${c.contactPerson || ''} (${c.phone || ''})`,
    }))
  }, [getCustomers])

  // 获取所有商品选项
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: `${p.name}${p.specification ? ' ' + p.specification : ''}`,
    }))
  }, [products])

  // 获取当前商品对应的色号选项
  const colorOptions = useMemo(() => {
    if (!itemForm.productId) return []
    return getColorsByProduct(itemForm.productId).map((c) => ({
      value: c.id,
      label: `${c.code} - ${c.name}`,
    }))
  }, [itemForm.productId, getColorsByProduct])

  // 获取当前色号对应的缸号（批次）选项（只显示有库存的）
  const batchOptions = useMemo(() => {
    if (!itemForm.colorId) return []
    const selectedColorObj = colors.find(c => c.id === itemForm.colorId)
    const selectedProductObj = selectedColorObj ? products.find(p => p.id === selectedColorObj.productId) : null
    const unit = selectedProductObj?.unit || 'kg'
    
    const availableBatches = getBatchesByColor(itemForm.colorId).filter(
      (b) => b.stockQuantity > 0
    )
    return availableBatches.map((b) => ({
      value: b.id,
      label: `${b.code} (库存: ${b.stockQuantity} ${unit})`,
      batch: b,
    }))
  }, [itemForm.colorId, getBatchesByColor, products, colors])

  // 计算金额
  const itemAmount = useMemo(() => {
    return itemForm.quantity * itemForm.price
  }, [itemForm.quantity, itemForm.price])

  // 获取当前选中的商品、色号和缸号信息
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === itemForm.productId)
  }, [itemForm.productId, products])

  const selectedColor = useMemo(() => {
    return colors.find((c) => c.id === itemForm.colorId)
  }, [itemForm.colorId, colors])

  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === itemForm.batchId)
  }, [itemForm.batchId, batches])

  // 添加商品到清单
  const handleAddItem = () => {
    if (!itemForm.productId || !itemForm.colorId || !itemForm.batchId || itemForm.quantity <= 0 || itemForm.price <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    if (!selectedProduct || !selectedColor || !selectedBatch) {
      alert('请选择有效的商品、色号和缸号')
      return
    }

    // 检查库存
    if (!checkStock(itemForm.batchId, itemForm.quantity)) {
      alert(`库存不足！当前库存：${selectedBatch.stockQuantity} ${selectedProduct.unit || 'kg'}`)
      return
    }

    const newItem: SalesOrderItemForm = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productCode: selectedProduct.code,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      colorCode: selectedColor.code,
      batchId: selectedBatch.id,
      batchCode: selectedBatch.code,
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
      batchId: '',
      quantity: 0,
      price: 0,
    })
  }

  // 删除清单项
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // 处理客户选择
  const handleCustomerChange = (customerId: string) => {
    const customer = getCustomers().find((c) => c.id === customerId)
    setFormData({
      ...formData,
      customerId: customerId,
      customerName: customer?.name || '',
    })
  }

  // 保存销售单
  const handleSave = async () => {
    if (!formData.customerId) {
      alert('请选择客户')
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品')
      return
    }

    const orderData: SalesOrderFormData = {
      ...formData,
      items: items.map(({ amount, ...item }) => item),
    }

    try {
      if (isEditMode && existingOrder) {
        // 编辑模式：更新订单
        await updateOrder(existingOrder.id, orderData)
      } else {
        // 新建模式或复制模式：创建订单
        await addOrder(orderData)
      }
      navigate('/sales')
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'))
    }
  }

  // 取消
  const handleCancel = () => {
    if (confirm('确定要取消吗？未保存的数据将丢失。')) {
      navigate('/sales')
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
              {isEditMode ? '编辑销售单' : '新建销售单'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? '修改销售单信息' : '填写销售单信息，系统会自动校验库存'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-9 border-gray-300 rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isEditMode ? '保存修改' : '保存销售单'}
            </Button>
            <button
              onClick={handleCancel}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基础信息 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">基础信息</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* 销售单号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">销售单号</label>
                <input
                  type="text"
                  value={orderNumber}
                  readOnly
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500"
                />
              </div>

              {/* 销售日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">销售日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.salesDate}
                    onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 选择客户 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择客户 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择客户</option>
                  {customerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 添加销售商品 */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">添加销售商品</h3>
            </div>
            
            <div className="bg-white rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {/* 选择商品 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择商品</label>
                  <select
                    value={itemForm.productId}
                    onChange={(e) => {
                      setItemForm({ ...itemForm, productId: e.target.value, colorId: '', batchId: '' })
                    }}
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">请选择商品</option>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 选择色号 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择色号</label>
                  <select
                    value={itemForm.colorId}
                    onChange={(e) => {
                      setItemForm({ ...itemForm, colorId: e.target.value, batchId: '' })
                    }}
                    disabled={!itemForm.productId}
                    className={cn(
                      'w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      !itemForm.productId ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'
                    )}
                  >
                    <option value="">请选择色号</option>
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 选择缸号（批次） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择缸号（批次）</label>
                  <select
                    value={itemForm.batchId}
                    onChange={(e) => {
                      const batchOption = batchOptions.find(opt => opt.value === e.target.value)
                      setItemForm({ 
                        ...itemForm, 
                        batchId: e.target.value,
                        price: batchOption?.batch.purchasePrice || itemForm.price
                      })
                    }}
                    disabled={!itemForm.colorId}
                    className={cn(
                      'w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      !itemForm.colorId ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'
                    )}
                  >
                    <option value="">请选择缸号</option>
                    {batchOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 销售数量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    销售数量 ({selectedProduct?.unit || 'kg'})
                  </label>
                  <input
                    type="number"
                    value={itemForm.quantity || ''}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="销售数量"
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* 单价 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单价 (¥/{selectedProduct?.unit || 'kg'})</label>
                  <input
                    type="number"
                    value={itemForm.price || ''}
                    onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="单价"
                    step="0.01"
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 添加到销售单按钮 */}
                <div className="col-span-3 flex items-end">
                  <Button
                    onClick={handleAddItem}
                    disabled={!itemForm.productId || !itemForm.colorId || !itemForm.batchId || itemForm.quantity <= 0}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加到销售单
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 商品清单 */}
          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
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
            </div>
          )}

          {/* 备注 */}
      <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={formData.remark || ''}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="选填，输入销售单备注信息..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default SalesCreate
