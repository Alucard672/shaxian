import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import { SalesOrderItem, SalesOrderFormData } from '@/types/sales'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Trash2, Save, ArrowLeft, ShoppingCart } from 'lucide-react'

function SalesCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined
  const { orders, addOrder, loadOrders } = useSalesStore()
  const { products, colors, batches, loadAll, getColorsByProduct } = useProductStore()
  const { customers, loadCustomers } = useContactStore()

  const [formData, setFormData] = useState<Omit<SalesOrderFormData, 'items'>>({
    customerId: '',
    customerName: '',
    salesDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    paidAmount: 0,
    remark: '',
  })

  const [items, setItems] = useState<Omit<SalesOrderItem, 'id' | 'amount'>[]>([])
  const [itemForm, setItemForm] = useState({
    productId: '',
    productName: '',
    colorId: '',
    colorName: '',
    colorCode: '',
    batchId: '',
    batchCode: '',
    quantity: 0,
    pieceCount: 0,
    unitWeight: 0,
    unit: 'kg',
    price: 0,
    remark: '',
  })

  useEffect(() => {
    loadAll()
    loadCustomers()
    if (isEdit) {
      loadOrders()
    }
  }, [loadAll, loadCustomers, isEdit, loadOrders])

  // 如果是编辑模式，加载订单数据
  useEffect(() => {
    if (isEdit && id && orders.length > 0) {
      const order = orders.find((o) => o.id === id)
      if (order) {
        setFormData({
          customerId: order.customerId || '',
          customerName: order.customerName,
          salesDate: order.salesDate,
          deliveryDate: order.deliveryDate || '',
          deliveryAddress: order.deliveryAddress || '',
          contactPerson: order.contactPerson || '',
          contactPhone: order.contactPhone || '',
          paidAmount: order.paidAmount || 0,
          remark: order.remark || '',
        })
        setItems(order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode || '',
          colorId: item.colorId || '',
          colorName: item.colorName || '',
          colorCode: item.colorCode || '',
          batchId: item.batchId || '',
          batchCode: item.batchCode || '',
          quantity: item.quantity,
          pieceCount: item.pieceCount || 0,
          unitWeight: item.unitWeight || 0,
          unit: item.unit || 'kg',
          price: item.price || item.unitPrice || 0,
          remark: item.remark || '',
        })))
      }
    }
  }, [isEdit, id, orders])

  // 获取当前选中商品的色号
  const colorOptions = useMemo(() => {
    if (!itemForm.productId) return []
    const colors = getColorsByProduct(itemForm.productId)
    
    // 如果编辑模式下已选择了色号，但该色号不在当前商品的色号列表中，也要包含它
    const allColors = [...colors]
    if (itemForm.colorId && !colors.find((c) => c.id === itemForm.colorId)) {
      // 从所有色号中查找已选择的色号
      const selectedColor = colors.find((c) => c.id === itemForm.colorId) || 
                           productStore.colors.find((c) => c.id === itemForm.colorId)
      if (selectedColor) {
        allColors.push(selectedColor)
      }
    }
    
    return allColors
      .filter((c) => c && c.id) // 过滤掉无效的颜色
      .map((c) => ({
        value: c.id,
        label: `${c.code || ''} - ${c.name || ''}`.replace(/^ - | - $|^$/, '') || c.id, // 处理 undefined，如果都为空则显示 ID
        color: c,
      }))
  }, [itemForm.productId, itemForm.colorId, getColorsByProduct, productStore.colors])

  // 获取当前选中色号的缸号
  const batchOptions = useMemo(() => {
    if (!itemForm.colorId) return []
    return batches
      .filter((b) => b.colorId === itemForm.colorId && b.stockQuantity > 0)
      .map((b) => ({
        value: b.id,
        label: `${b.code} (库存: ${b.stockQuantity} ${itemForm.unit})`,
        batch: b,
      }))
  }, [itemForm.colorId, batches, itemForm.unit])

  // 获取当前选中商品信息
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === itemForm.productId)
  }, [itemForm.productId, products])

  // 获取当前选中缸号信息
  const selectedBatch = useMemo(() => {
    return batches.find((b) => b.id === itemForm.batchId)
  }, [itemForm.batchId, batches])

  // 自动计算总重量（如果启用双单位）
  useEffect(() => {
    if (selectedProduct?.enableDualUnit && itemForm.pieceCount > 0 && itemForm.unitWeight > 0) {
      setItemForm((prev) => ({
        ...prev,
        quantity: prev.pieceCount * prev.unitWeight,
      }))
    }
  }, [itemForm.pieceCount, itemForm.unitWeight, selectedProduct])

  // 当选择缸号时，自动填充信息
  useEffect(() => {
    if (selectedBatch) {
      setItemForm((prev) => ({
        ...prev,
        batchCode: selectedBatch.code,
        unitWeight: selectedBatch.unitWeight || prev.unitWeight,
      }))
    }
  }, [selectedBatch])

  const handleAddItem = () => {
    if (!itemForm.productId || !itemForm.colorId || !itemForm.batchId || itemForm.quantity <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    // 检查库存
    if (selectedBatch && itemForm.quantity > selectedBatch.stockQuantity) {
      alert(`库存不足，当前库存：${selectedBatch.stockQuantity} ${itemForm.unit}`)
      return
    }

    const newItem: Omit<SalesOrderItem, 'id' | 'amount'> = {
      productId: itemForm.productId,
      productName: itemForm.productName,
      productCode: selectedProduct?.code || '',
      colorId: itemForm.colorId,
      colorName: itemForm.colorName,
      colorCode: itemForm.colorCode,
      batchId: itemForm.batchId,
      batchCode: itemForm.batchCode,
      quantity: itemForm.quantity,
      pieceCount: itemForm.pieceCount,
      unitWeight: itemForm.unitWeight,
      unit: itemForm.unit,
      price: itemForm.price,
      remark: itemForm.remark,
    }

    setItems([...items, newItem])
    setItemForm({
      productId: '',
      productName: '',
      colorId: '',
      colorName: '',
      colorCode: '',
      batchId: '',
      batchCode: '',
      quantity: 0,
      pieceCount: 0,
      unitWeight: 0,
      unit: 'kg',
      price: 0,
      remark: '',
    })
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setItemForm({
      ...itemForm,
      productId,
      productName: product?.name || '',
      unit: product?.unit || 'kg',
      colorId: '',
      colorName: '',
      colorCode: '',
      batchId: '',
      batchCode: '',
    })
  }

  const handleColorChange = (colorId: string) => {
    // 先从当前商品的色号中查找，如果找不到则从所有色号中查找
    const color = getColorsByProduct(itemForm.productId).find((c) => c.id === colorId) ||
                  colors.find((c) => c.id === colorId) ||
                  productStore.colors.find((c) => c.id === colorId)
    
    if (!color && colorId) {
      console.warn('Color not found:', colorId)
    }
    
    setItemForm({
      ...itemForm,
      colorId,
      colorName: color?.name || '',
      colorCode: color?.code || '',
      batchId: '',
      batchCode: '',
    })
  }

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    setItemForm({
      ...itemForm,
      batchId,
      batchCode: batch?.code || '',
      unitWeight: batch?.unitWeight || 0,
    })
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    setFormData({
      ...formData,
      customerId,
      customerName: customer?.name || '',
      contactPerson: customer?.contactPerson || '',
      contactPhone: customer?.phone || '',
      deliveryAddress: customer?.address || '',
    })
  }

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  const handleSave = async (status: '草稿' | '已出库' = '草稿') => {
    if (!formData.customerId) {
      alert('请选择客户')
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品明细')
      return
    }

    try {
      const orderData: SalesOrderFormData = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          amount: item.quantity * item.price,
        })),
      }

      await addOrder(orderData, status)
      alert(status === '草稿' ? '销售单已保存为草稿' : '销售单已创建并出库')
      navigate('/sales')
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sales')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? '查看/编辑销售单' : '新建销售单'}</h1>
            <p className="text-sm text-gray-600 mt-1">创建新的销售出货单</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('草稿')} className="px-6 py-2">
            保存草稿
          </Button>
          <Button
            onClick={() => handleSave('已出库')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            保存并出库
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客户 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              销售日期 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.salesDate}
              onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">联系人</label>
            <Input
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
            <Input
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">交货日期</label>
            <Input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">已收金额</label>
            <Input
              type="number"
              value={formData.paidAmount}
              onChange={(e) =>
                setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">交货地址</label>
            <Input
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 商品明细 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">商品明细</h2>

        {/* 添加商品表单 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">商品</label>
              <select
                value={itemForm.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择商品</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">色号</label>
              <select
                value={itemForm.colorId}
                onChange={(e) => handleColorChange(e.target.value)}
                disabled={!itemForm.productId}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择色号</option>
                {colorOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">缸号 <span className="text-red-500">*</span></label>
              <select
                value={itemForm.batchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={!itemForm.colorId}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">请选择缸号</option>
                {batchOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单价</label>
              <Input
                type="number"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* 双单位支持 */}
          {selectedProduct?.enableDualUnit ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">件数</label>
                <Input
                  type="number"
                  value={itemForm.pieceCount}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, pieceCount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单件重量 ({selectedProduct.unit})
                </label>
                <Input
                  type="number"
                  value={itemForm.unitWeight}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, unitWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总重量 ({selectedProduct.unit})
                </label>
                <Input
                  type="number"
                  value={itemForm.quantity}
                  readOnly
                  className="w-full bg-gray-100"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数量 ({itemForm.unit})
                </label>
                <Input
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
              <Input
                value={itemForm.remark}
                onChange={(e) => setItemForm({ ...itemForm, remark: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <Button
            onClick={handleAddItem}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加商品
          </Button>
        </div>

        {/* 商品列表 */}
        {items.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">商品</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">色号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">缸号</th>
                  {selectedProduct?.enableDualUnit && (
                    <>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">件数</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">单件重量</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">数量</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">单价</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">小计</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{item.productName}</td>
                    <td className="px-4 py-3 text-sm">{item.colorName}</td>
                    <td className="px-4 py-3 text-sm">{item.batchCode}</td>
                    {selectedProduct?.enableDualUnit && (
                      <>
                        <td className="px-4 py-3 text-sm">{item.pieceCount || '-'}</td>
                        <td className="px-4 py-3 text-sm">{item.unitWeight || '-'}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.price}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={selectedProduct?.enableDualUnit ? 7 : 5} className="px-4 py-3 text-right text-sm font-medium">
                    合计：
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {calculateTotalAmount().toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesCreate
