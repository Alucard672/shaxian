import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useContactStore } from '@/store/contactStore'
import { useProductStore } from '@/store/productStore'
import { PurchaseOrderFormData, PurchaseOrderItem } from '@/types/purchase'
import Button from '../../components/ui/Button'
import { X, Plus, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

interface PurchaseOrderItemForm extends Omit<PurchaseOrderItem, 'id' | 'amount'> {
  amount: number
}

function PurchaseCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { generateOrderNumber, addOrder, updateOrder, getOrder, loadOrders } = usePurchaseStore()
  const { suppliers, getSuppliers, loadAll: loadContacts } = useContactStore()
  const { products, colors, getColorsByProduct, loadAll: loadProducts } = useProductStore()

  // 检查是否是复制模式
  const copyId = new URLSearchParams(window.location.search).get('copy')
  const isCopyMode = !!copyId
  const copyOrder = isCopyMode ? getOrder(copyId) : null

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

  // 加载数据
  useEffect(() => {
    loadContacts()
    loadProducts()
    if (isEditMode) {
      loadOrders()
    }
  }, [isEditMode, loadContacts, loadProducts, loadOrders])

  // 加载订单数据（编辑模式或复制模式）
  useEffect(() => {
    // 如果数据不存在，先加载
    if (isEditMode && !existingOrder) {
      loadOrders()
      return
    }
    
    const orderToLoad = isCopyMode ? copyOrder : existingOrder
    if (orderToLoad) {
      // 编辑模式：检查是否可以编辑（只能编辑草稿状态）
      if (isEditMode && orderToLoad.status !== '草稿') {
        alert('只能编辑草稿状态的进货单')
        navigate('/purchase')
        return
      }

      setFormData({
        supplierId: orderToLoad.supplierId,
        supplierName: orderToLoad.supplierName,
        purchaseDate: isCopyMode ? format(new Date(), 'yyyy-MM-dd') : orderToLoad.purchaseDate,
        expectedDate: orderToLoad.expectedDate,
        remark: orderToLoad.remark || '',
        paidAmount: isCopyMode ? 0 : (orderToLoad.paidAmount || 0),
      })

      setItems(
        orderToLoad.items.map((item) => ({
          ...item,
          amount: item.amount,
        }))
      )
    }
  }, [existingOrder, copyOrder, isEditMode, isCopyMode, navigate, loadOrders])

  // 获取所有供应商选项
  const supplierOptions = useMemo(() => {
    return getSuppliers().map((s) => ({
      value: s.id,
      label: s.name,
    }))
  }, [suppliers, getSuppliers])

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
  }, [itemForm.productId, colors, getColorsByProduct])

  // 计算金额
  const itemAmount = useMemo(() => {
    return itemForm.quantity * itemForm.price
  }, [itemForm.quantity, itemForm.price])

  // 获取当前选中的商品和色号信息
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === itemForm.productId)
  }, [products, itemForm.productId])

  const selectedColor = useMemo(() => {
    return colors.find((c) => c.id === itemForm.colorId)
  }, [colors, itemForm.colorId])

  // 添加清单项
  const handleAddItem = () => {
    if (!itemForm.productId) {
      alert('请选择商品')
      return
    }
    if (!itemForm.colorId) {
      alert('请选择色号')
      return
    }
    if (!itemForm.batchCode) {
      alert('请输入缸号')
      return
    }
    if (itemForm.quantity <= 0) {
      alert('请输入数量')
      return
    }
    if (itemForm.price <= 0) {
      alert('请输入单价')
      return
    }

    const newItem: PurchaseOrderItemForm = {
      productId: itemForm.productId,
      productName: selectedProduct!.name,
      productCode: selectedProduct!.code,
      colorId: itemForm.colorId,
      colorName: selectedColor!.name,
      colorCode: selectedColor!.code,
      batchCode: itemForm.batchCode,
      quantity: itemForm.quantity,
      unit: selectedProduct!.unit,
      price: itemForm.price,
      amount: itemAmount,
    }

    setItems([...items, newItem])
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
    const supplier = getSuppliers().find((s) => s.id === supplierId)
    setFormData({
      ...formData,
      supplierId: supplierId,
      supplierName: supplier?.name || '',
    })
  }

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!formData.supplierId) {
      alert('请选择供应商')
      return
    }

    const orderData: PurchaseOrderFormData = {
      ...formData,
      items: items.map(({ amount, ...item }) => item),
    }

    try {
      if (isEditMode && existingOrder) {
        await updateOrder(existingOrder.id, orderData)
      } else {
        // 新建模式或复制模式：创建新订单
        await addOrder(orderData, '草稿')
      }
      navigate('/purchase')
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'))
    }
  }

  // 保存并入库
  const handleSaveAndSubmit = async () => {
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

    try {
      if (isEditMode && existingOrder) {
        // 编辑模式下，先更新订单数据
        await updateOrder(existingOrder.id, orderData)
        
        // 如果订单是草稿状态，将其改为已入库状态并执行入库操作
        if (existingOrder.status === '草稿') {
          // 更新状态为已入库（后端会自动处理入库逻辑）
          await updateOrder(existingOrder.id, { ...orderData, status: '已入库' } as any)
        } else {
          alert('只能对草稿状态的订单进行保存并入库操作')
          return
        }
      } else {
        // 直接创建为已入库状态（会自动执行入库逻辑）
        await addOrder(orderData, '已入库')
      }
      navigate('/purchase')
    } catch (error: any) {
      alert('保存失败: ' + (error.message || '未知错误'))
    }
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
      {/* 内容区域 */}
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? '编辑进货单' : isCopyMode ? '复制进货单' : '新建进货单'}
              </h2>
              <p className="text-sm text-gray-500">进货单号: {orderNumber}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  供应商 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择供应商</option>
                  {supplierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  进货日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预计到货日期
                </label>
                <input
                  type="date"
                  value={formData.expectedDate || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已付金额
                </label>
                <input
                  type="number"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* 商品明细 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">商品明细</h3>
                <Button
                  onClick={handleAddItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  添加商品
                </Button>
              </div>

              {/* 添加商品表单 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-6 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">商品</label>
                    <select
                      value={itemForm.productId}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, productId: e.target.value, colorId: '' })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">选择商品</option>
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">色号</label>
                    <select
                      value={itemForm.colorId}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, colorId: e.target.value })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      disabled={!itemForm.productId}
                    >
                      <option value="">选择色号</option>
                      {colorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">缸号</label>
                    <input
                      type="text"
                      value={itemForm.batchCode}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, batchCode: e.target.value })
                      }
                      placeholder="输入缸号"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">数量</label>
                    <input
                      type="number"
                      value={itemForm.quantity || ''}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">单价</label>
                    <input
                      type="number"
                      value={itemForm.price || ''}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddItem}
                      size="sm"
                      className="w-full"
                    >
                      添加
                    </Button>
                  </div>
                </div>
              </div>

              {/* 商品列表 */}
              {items.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          商品
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          色号
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                          缸号
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          数量
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          单价
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                          金额
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {item.colorName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {item.batchCode}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">
                            ¥{item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            ¥{item.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注
              </label>
              <textarea
                value={formData.remark || ''}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-lg font-semibold text-gray-900">
            合计: ¥{totalAmount.toLocaleString()}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              保存草稿
            </Button>
            <Button onClick={handleSaveAndSubmit}>
              保存并入库
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseCreate
