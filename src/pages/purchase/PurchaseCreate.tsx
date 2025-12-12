import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import { PurchaseOrderItem, PurchaseOrderFormData } from '@/types/purchase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Plus, Trash2, Save, ArrowLeft, Package } from 'lucide-react'

function PurchaseCreate() {
  const navigate = useNavigate()
  const { addOrder } = usePurchaseStore()
  const { products, colors, batches, loadAll, getColorsByProduct } = useProductStore()
  const { suppliers, loadSuppliers } = useContactStore()

  const [formData, setFormData] = useState<Omit<PurchaseOrderFormData, 'items'>>({
    supplierId: '',
    supplierName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    paidAmount: 0,
    remark: '',
  })

  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'id' | 'amount'>[]>([])
  const [itemForm, setItemForm] = useState({
    productId: '',
    productName: '',
    colorId: '',
    colorName: '',
    colorCode: '',
    batchCode: '',
    quantity: 0,
    pieceCount: 0,
    unitWeight: 0,
    unit: 'kg',
    price: 0,
    productionDate: new Date().toISOString().split('T')[0],
    stockLocation: '',
    remark: '',
  })

  useEffect(() => {
    loadAll()
    loadSuppliers()
  }, [loadAll, loadSuppliers])

  // 获取当前选中商品的色号
  const colorOptions = useMemo(() => {
    if (!itemForm.productId) return []
    return getColorsByProduct(itemForm.productId).map((c) => ({
      value: c.id,
      label: `${c.code} - ${c.name}`,
      color: c,
    }))
  }, [itemForm.productId, getColorsByProduct])

  // 获取当前选中商品信息
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === itemForm.productId)
  }, [itemForm.productId, products])

  // 自动计算总重量（如果启用双单位）
  useEffect(() => {
    if (selectedProduct?.enableDualUnit && itemForm.pieceCount > 0 && itemForm.unitWeight > 0) {
      setItemForm((prev) => ({
        ...prev,
        quantity: prev.pieceCount * prev.unitWeight,
      }))
    }
  }, [itemForm.pieceCount, itemForm.unitWeight, selectedProduct])

  const handleAddItem = () => {
    if (!itemForm.productId || !itemForm.colorId || itemForm.quantity <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    const newItem: Omit<PurchaseOrderItem, 'id' | 'amount'> = {
      productId: itemForm.productId,
      productName: itemForm.productName,
      productCode: selectedProduct?.code || '',
      colorId: itemForm.colorId,
      colorName: itemForm.colorName,
      colorCode: itemForm.colorCode,
      batchCode: itemForm.batchCode,
      quantity: itemForm.quantity,
      pieceCount: itemForm.pieceCount,
      unitWeight: itemForm.unitWeight,
      unit: itemForm.unit,
      price: itemForm.price,
      productionDate: itemForm.productionDate,
      stockLocation: itemForm.stockLocation,
      remark: itemForm.remark,
    }

    setItems([...items, newItem])
    setItemForm({
      productId: '',
      productName: '',
      colorId: '',
      colorName: '',
      colorCode: '',
      batchCode: '',
      quantity: 0,
      pieceCount: 0,
      unitWeight: 0,
      unit: 'kg',
      price: 0,
      productionDate: new Date().toISOString().split('T')[0],
      stockLocation: '',
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
    })
  }

  const handleColorChange = (colorId: string) => {
    const color = colors.find((c) => c.id === colorId)
    setItemForm({
      ...itemForm,
      colorId,
      colorName: color?.name || '',
      colorCode: color?.code || '',
    })
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    setFormData({
      ...formData,
      supplierId,
      supplierName: supplier?.name || '',
    })
  }

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  const handleSave = async (status: '草稿' | '已入库' = '草稿') => {
    if (!formData.supplierId) {
      alert('请选择供应商')
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品明细')
      return
    }

    try {
      const orderData: PurchaseOrderFormData = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          amount: item.quantity * item.price,
        })),
      }

      await addOrder(orderData, status)
      alert(status === '草稿' ? '采购单已保存为草稿' : '采购单已创建并入库')
      navigate('/purchase')
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
            onClick={() => navigate('/purchase')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">新建采购单</h1>
            <p className="text-sm text-gray-600 mt-1">创建新的采购进货单</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('草稿')}
            className="px-6 py-2"
          >
            保存草稿
          </Button>
          <Button
            onClick={() => handleSave('已入库')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            保存并入库
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              供应商 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择供应商</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              采购日期 <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">预计到货日期</label>
            <Input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">已付金额</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">缸号编码</label>
              <Input
                value={itemForm.batchCode}
                onChange={(e) => setItemForm({ ...itemForm, batchCode: e.target.value })}
                placeholder="请输入缸号"
                className="w-full"
              />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生产日期</label>
              <Input
                type="date"
                value={itemForm.productionDate}
                onChange={(e) => setItemForm({ ...itemForm, productionDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">库存位置</label>
              <Input
                value={itemForm.stockLocation}
                onChange={(e) => setItemForm({ ...itemForm, stockLocation: e.target.value })}
                className="w-full"
              />
            </div>
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

export default PurchaseCreate
