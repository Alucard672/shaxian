import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSalesStore } from '@/store/salesStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import { useSettingsStore } from '@/store/settingsStore'
import { SalesOrderItem, SalesOrderFormData } from '@/types/sales'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SelectWithAdd from '@/components/ui/SelectWithAdd'
import MultiSelectWithAdd from '@/components/ui/MultiSelectWithAdd'
import DateInput from '@/components/ui/DateInput'
import RequiredFieldsConfigModal from '@/components/ui/RequiredFieldsConfigModal'
import { RequiredMark } from '@/components/ui/RequiredMark'
import { Plus, Trash2, Save, ArrowLeft, X, Edit2, Check, Settings } from 'lucide-react'
import { formatNumber, formatAmount } from '@/utils/formatNumber'
import { WeChatIcon } from '@/components/ui/WeChatIcon'
import { AlipayIcon } from '@/components/ui/AlipayIcon'
import { CashIcon } from '@/components/ui/CashIcon'
import { BankCardIcon } from '@/components/ui/BankCardIcon'
import { ScanPayIcon } from '@/components/ui/ScanPayIcon'
import { parseColorCodeAndName } from '@/utils/parseColorInput'
import React from 'react'

const SALES_PAGE_KEY = 'sales'
const SALES_FIELDS = [
  { id: 'customerId', label: '客户' },
  { id: 'salesDate', label: '销售日期' },
  { id: 'deliveryDate', label: '交货日期' },
  { id: 'contactPhone', label: '联系电话' },
  { id: 'deliveryAddress', label: '交货地址' },
  { id: 'paidAmount', label: '已收金额' },
  { id: 'remark', label: '备注' },
] as const
const SALES_DEFAULT_REQUIRED = ['customerId']

type PaymentLine = {
  id: string
  method: '现金' | '微信' | '支付宝' | '银行卡' | '扫码付'
  amount: number
}

const PAYMENT_METHODS = ['现金', '微信', '支付宝', '银行卡', '扫码付'] as const
const PAYMENT_ICONS: Record<(typeof PAYMENT_METHODS)[number], React.ComponentType<{ className?: string }>> = {
  现金: CashIcon,
  微信: WeChatIcon,
  支付宝: AlipayIcon,
  银行卡: BankCardIcon,
  扫码付: ScanPayIcon,
}

function makeId(prefix = 'pay') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function mergeRemarkLine(remark: string, prefix: string, line: string | null): string {
  const lines = String(remark || '').split('\n')
  const next = lines.filter((l) => !l.trim().startsWith(prefix))
  if (line) next.push(line)
  return next.join('\n').trim()
}

function SalesCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined
  const { orders, addOrder, updateOrder, loadOrders } = useSalesStore()
  const { products, colors, batches, loadAll, loadColors, loadBatches, getColorsByProduct, addProduct, addColor, addBatch } = useProductStore()
  const { customers, loadCustomers, addCustomer } = useContactStore()
  const { systemParams, getPageRequiredFields } = useSettingsStore()
  const enableBatch = !!systemParams?.enableBatch
  const allowNegativeStock = !!systemParams?.allowNegativeStock
  const [showRequiredModal, setShowRequiredModal] = useState(false)
  const requiredFields = getPageRequiredFields(SALES_PAGE_KEY, SALES_DEFAULT_REQUIRED)

  const [formData, setFormData] = useState<Omit<SalesOrderFormData, 'items'>>({
    customerId: '',
    customerName: '',
    salesDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    paidAmount: 0,
    paymentMethod: '现金',
    remark: '',
  })

  const [items, setItems] = useState<Omit<SalesOrderItem, 'id' | 'amount'>[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({
    productId: '',
    productName: '',
    colorIds: [] as string[], // 改为支持多选
    colorId: '', // 保留用于编辑模式
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

  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    { id: makeId(), method: '现金', amount: 0 },
  ])

  const debugQuickAdd =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV || localStorage.getItem('debugQuickAdd') === '1')

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
      const order = orders.find((o) => String(o.id) === String(id))
      if (order) {
        setFormData({
          customerId: String(order.customerId ?? ''),
          customerName: order.customerName ?? '',
          salesDate: order.salesDate,
          deliveryDate: order.deliveryDate || '',
          deliveryAddress: order.deliveryAddress || '',
          contactPerson: order.contactPerson || '',
          contactPhone: order.contactPhone || '',
          paidAmount: order.paidAmount || 0,
          paymentMethod: (order as any).paymentMethod || '现金',
          remark: order.remark || '',
        })
        setPaymentLines([
          {
            id: makeId(),
            method: (PAYMENT_METHODS.includes(String((order as any).paymentMethod || '') as any)
              ? (order as any).paymentMethod
              : '现金') as PaymentLine['method'],
            amount: Number(order.paidAmount || 0),
          },
        ])
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

  // 多笔收款合计 -> 回填已收金额；并保留一个兼容的 paymentMethod（取第一笔）
  useEffect(() => {
    const total = paymentLines.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const first = paymentLines[0]?.method || '现金'
    setFormData((prev) => {
      if (prev.paidAmount === total && prev.paymentMethod === first) return prev
      return { ...prev, paidAmount: total, paymentMethod: first }
    })
  }, [paymentLines])

  // 获取当前选中商品的色号
  const colorOptions = useMemo(() => {
    const productId = editingIndex !== null ? items[editingIndex]?.productId : newItem.productId
    if (!productId) return []
    const productColors = getColorsByProduct(productId)
    return productColors
      .filter((c) => c && c.id)
      .map((c) => ({
        value: c.id,
        label: `${c.code || ''} - ${c.name || ''}`.replace(/^ - | - $|^$/, '') || c.id,
        color: c,
      }))
  }, [newItem.productId, editingIndex, items, colors, getColorsByProduct])
  
  // 获取已选色号对应的缸号选项（用于多选场景；含库存为 0 的缸号，便于快速新增后当场选择）
  const batchOptionsForMultipleColors = useMemo(() => {
    if (newItem.colorIds.length === 0) return []
    const allBatches: Array<{ value: string; label: string; batch: any; colorId: string }> = []
    newItem.colorIds.forEach((colorId) => {
      const colorBatches = batches
        .filter((b) => String(b.colorId) === String(colorId))
        .map((b) => {
          const code = b.code ?? (b as any).batchCode ?? ''
          return {
            value: String(b.id),
            label: `${code} (库存: ${b.stockQuantity ?? 0} ${newItem.unit})`,
            batch: b,
            colorId: colorId,
          }
        })
      allBatches.push(...colorBatches)
    })
    return allBatches
  }, [newItem.colorIds, newItem.unit, batches])

  // 获取当前选中色号的缸号（含库存为 0 的缸号，便于快速新增后当场选择）
  const batchOptions = useMemo(() => {
    const colorId = editingIndex !== null ? items[editingIndex]?.colorId : newItem.colorId
    if (!colorId) return []
    return batches
      .filter((b) => String(b.colorId) === String(colorId))
      .map((b) => {
        const code = b.code ?? (b as any).batchCode ?? ''
        return {
          value: String(b.id),
          label: `${code} (库存: ${b.stockQuantity ?? 0} ${newItem.unit})`,
          batch: b,
        }
      })
  }, [newItem.colorId, newItem.unit, editingIndex, items, batches])

  // 获取当前选中商品信息
  const selectedProduct = useMemo(() => {
    const productId = editingIndex !== null ? items[editingIndex]?.productId : newItem.productId
    return products.find((p) => p.id === productId)
  }, [newItem.productId, editingIndex, items, products])

  // 获取当前选中缸号信息
  const selectedBatch = useMemo(() => {
    const batchId = editingIndex !== null ? items[editingIndex]?.batchId : newItem.batchId
    return batches.find((b) => String(b.id) === String(batchId))
  }, [newItem.batchId, editingIndex, items, batches])

  // 自动计算总重量（如果启用双单位）
  useEffect(() => {
    if (selectedProduct?.enableDualUnit && newItem.pieceCount > 0 && newItem.unitWeight > 0) {
      setNewItem((prev) => ({
        ...prev,
        quantity: prev.pieceCount * prev.unitWeight,
      }))
    }
  }, [newItem.pieceCount, newItem.unitWeight, selectedProduct])

  // 当选择缸号时，自动填充信息
  useEffect(() => {
    if (selectedBatch) {
      setNewItem((prev) => ({
        ...prev,
        batchCode: selectedBatch.code ?? (selectedBatch as any).batchCode ?? '',
        unitWeight: selectedBatch.unitWeight ?? prev.unitWeight,
      }))
    }
  }, [selectedBatch])

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setNewItem({
      ...newItem,
      productId,
      productName: product?.name || '',
      unit: product?.unit || 'kg',
      colorIds: [],
      colorId: '',
      colorName: '',
      colorCode: '',
      batchId: '',
      batchCode: '',
    })
  }

  const handleColorChange = (colorIds: string[]) => {
    setNewItem({
      ...newItem,
      colorIds,
      // 保留第一个色号用于兼容编辑模式
      colorId: colorIds.length > 0 ? colorIds[0] : '',
      colorName: colorIds.length > 0 
        ? getColorsByProduct(newItem.productId).find((c) => c.id === colorIds[0])?.name || ''
        : '',
      colorCode: colorIds.length > 0
        ? getColorsByProduct(newItem.productId).find((c) => c.id === colorIds[0])?.code || ''
        : '',
      batchId: '',
      batchCode: '',
    })
  }
  
  // 编辑模式下的色号变更（单选）
  const handleColorChangeSingle = (colorId: string) => {
    const color = getColorsByProduct(newItem.productId).find((c) => c.id === colorId) ||
                  colors.find((c) => c.id === colorId)
    setNewItem({
      ...newItem,
      colorId,
      colorIds: colorId ? [colorId] : [],
      colorName: color?.name || '',
      colorCode: color?.code || '',
      batchId: '',
      batchCode: '',
    })
  }

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => String(b.id) === String(batchId))
    setNewItem({
      ...newItem,
      batchId,
      batchCode: batch ? (batch.code ?? (batch as any).batchCode ?? '') : '',
      unitWeight: batch?.unitWeight ?? 0,
    })
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    setFormData({
      ...formData,
      customerId,
      customerName: customer?.name || '',
      // 后端可能仍要求联系人字段：不展示，但提交时尽量带上
      contactPerson: (customer as any)?.contactPerson || '',
      contactPhone: customer?.phone || '',
      deliveryAddress: customer?.address || '',
    })
  }

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    // 如果选择了多个色号，为每个色号创建一条明细
    const colorIdsToAdd = newItem.colorIds.length > 0 ? newItem.colorIds : (newItem.colorId ? [newItem.colorId] : [])
    
    if (colorIdsToAdd.length === 0) {
      alert('请至少选择一个色号')
      return
    }

    const newItems: Omit<SalesOrderItem, 'id' | 'amount'>[] = []
    
    for (const colorId of colorIdsToAdd) {
      const color = getColorsByProduct(newItem.productId).find((c) => c.id === colorId) ||
                    colors.find((c) => c.id === colorId)
      let batchId = newItem.batchId
      let batchCode = newItem.batchCode
      if (!enableBatch) {
        const firstBatch = batches.find((b) => String(b.colorId) === String(colorId))
        if (firstBatch) {
          batchId = firstBatch.id
          batchCode = firstBatch.code ?? (firstBatch as any).batchCode ?? ''
        }
      }
      const batch = batches.find((b) => b.id === batchId)
      if (!allowNegativeStock && batch && newItem.quantity > batch.stockQuantity) {
        alert(`色号 ${color?.name || colorId} 的库存不足，当前库存：${batch.stockQuantity} ${newItem.unit}`)
        continue
      }
      if (!batchId && enableBatch) {
        alert(`请选择色号 ${color?.name || colorId} 的缸号`)
        continue
      }
      if (!batchId && !enableBatch) {
        alert(`色号 ${color?.name || colorId} 下暂无缸号，请先在商品管理中为该色号添加缸号`)
        continue
      }

      const item: Omit<SalesOrderItem, 'id' | 'amount'> = {
        productId: newItem.productId,
        productName: newItem.productName,
        productCode: selectedProduct?.code || '',
        colorId: colorId,
        colorName: color?.name || '',
        colorCode: color?.code || '',
        batchId: batchId || '',
        batchCode: batchCode || '',
        quantity: newItem.quantity,
        pieceCount: newItem.pieceCount,
        unitWeight: newItem.unitWeight,
        unit: newItem.unit,
        price: newItem.price,
        remark: newItem.remark,
      }
      
      newItems.push(item)
    }

    setItems([...items, ...newItems])
    setNewItem({
      productId: '',
      productName: '',
      colorIds: [],
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

  const handleEditItem = (index: number) => {
    const item = items[index]
    setNewItem({
      productId: item.productId,
      productName: item.productName,
      colorIds: item.colorId ? [item.colorId] : [],
      colorId: item.colorId,
      colorName: item.colorName,
      colorCode: item.colorCode,
      batchId: item.batchId,
      batchCode: item.batchCode,
      quantity: item.quantity,
      pieceCount: item.pieceCount || 0,
      unitWeight: item.unitWeight || 0,
      unit: item.unit,
      price: item.price,
      remark: item.remark || '',
    })
    setEditingIndex(index)
  }

  const handleUpdateItem = () => {
    if (!newItem.productId || !newItem.colorId || newItem.quantity <= 0) {
      alert('请填写完整的商品信息（商品、色号、数量必填）')
      return
    }
    let batchId = newItem.batchId
    let batchCode = newItem.batchCode
    if (!enableBatch && !batchId) {
      const firstBatch = batches.find((b) => String(b.colorId) === String(newItem.colorId))
      if (firstBatch) {
        batchId = firstBatch.id
        batchCode = firstBatch.code ?? (firstBatch as any).batchCode ?? ''
      }
    }
    if (!batchId) {
      alert(enableBatch ? '请选择缸号' : `色号 ${newItem.colorName} 下暂无缸号，请先在商品管理中添加`)
      return
    }
    if (!allowNegativeStock) {
      const batch = batches.find((b) => String(b.id) === String(batchId))
      if (batch && newItem.quantity > batch.stockQuantity) {
        alert(`库存不足：${newItem.productName} ${newItem.colorName}，当前库存：${batch.stockQuantity} ${newItem.unit}`)
        return
      }
    }

    const updatedItems = [...items]
    updatedItems[editingIndex!] = {
      productId: newItem.productId,
      productName: newItem.productName,
      productCode: selectedProduct?.code || '',
      colorId: newItem.colorId,
      colorName: newItem.colorName,
      colorCode: newItem.colorCode,
      batchId: batchId || '',
      batchCode: batchCode || '',
      quantity: newItem.quantity,
      pieceCount: newItem.pieceCount,
      unitWeight: newItem.unitWeight,
      unit: newItem.unit,
      price: newItem.price,
      remark: newItem.remark,
    }
    setItems(updatedItems)
    setEditingIndex(null)
    setNewItem({
      productId: '',
      productName: '',
      colorIds: [],
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

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setNewItem({
      productId: '',
      productName: '',
      colorIds: [],
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

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  const handleSave = async (status: '草稿' | '已出库' = '草稿') => {
    const missing: string[] = []
    if (requiredFields.includes('customerId') && !formData.customerId) missing.push('客户')
    if (requiredFields.includes('salesDate') && !formData.salesDate) missing.push('销售日期')
    if (requiredFields.includes('deliveryDate') && !formData.deliveryDate) missing.push('交货日期')
    if (requiredFields.includes('contactPhone') && !String(formData.contactPhone || '').trim()) missing.push('联系电话')
    if (requiredFields.includes('deliveryAddress') && !String(formData.deliveryAddress || '').trim()) missing.push('交货地址')
    if (requiredFields.includes('paidAmount') && formData.paidAmount == null) missing.push('已收金额')
    if (requiredFields.includes('remark') && !String(formData.remark || '').trim()) missing.push('备注')
    if (missing.length) {
      alert(`请填写必填项：${missing.join('、')}`)
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品明细')
      return
    }

    if (status === '已出库' && !allowNegativeStock) {
      for (const item of items) {
        const batch = batches.find((b) => String(b.id) === String(item.batchId))
        if (batch && Number(item.quantity) > Number(batch.stockQuantity)) {
          alert(`库存不足：${item.productName} ${item.colorName} ${item.batchCode || ''}，当前库存：${batch.stockQuantity} ${item.unit}，出库数量：${item.quantity}`)
          return
        }
      }
    }

    const requiredLabels = requiredFields
      .filter((id) => SALES_FIELDS.some((f) => f.id === id))
      .map((id) => SALES_FIELDS.find((f) => f.id === id)!.label)
      .join('、')

    try {
      const parts = paymentLines
        .filter((p) => Number(p.amount) > 0)
        .map((p) => `${p.method} ${formatNumber(p.amount)}`)
      const paymentLine = parts.length ? `收款明细：${parts.join('；')}` : null
      const mergedRemark = mergeRemarkLine(formData.remark || '', '收款明细：', paymentLine)

      const orderData: SalesOrderFormData = {
        ...formData,
        remark: mergedRemark,
        items: items.map((item) => ({
          ...item,
          amount: item.quantity * item.price,
        })),
      }

      if (isEdit && id) {
        await updateOrder(id, orderData)
        alert('销售单已更新')
      } else {
        await addOrder(orderData, status)
        alert(status === '草稿' ? '销售单已保存为草稿' : '销售单已创建并出库')
      }
      navigate('/sales')
    } catch (error: any) {
      const msg = error?.message || '未知错误'
      const isRequiredLike = /必填|不能为空/.test(msg)
      const part = requiredLabels ? `【${requiredLabels}】 以及` : ''
      const hint = isRequiredLike
        ? `\n\n未填写的必填项：请检查 ${part}商品明细（至少一项，数量、单价有效）是否已填写完整。`
        : ''
      alert('保存失败：' + msg + hint)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full max-w-full px-2 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/sales')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isEdit ? '编辑销售单' : '新建销售单'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRequiredModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="必填项设置"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Button variant="outline" onClick={() => handleSave('草稿')} size="sm">
                保存草稿
              </Button>
              <Button onClick={() => handleSave('已出库')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-1.5" />
                保存并出库
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RequiredFieldsConfigModal
        open={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        pageKey={SALES_PAGE_KEY}
        title="销售单"
        fields={[...SALES_FIELDS]}
        defaultRequired={SALES_DEFAULT_REQUIRED}
      />

      <div className="w-full max-w-full px-2 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* 左侧：基本信息（缩小约 1/5） */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">基本信息</h2>
                <span className="text-xs text-amber-600">带 <span className="font-semibold">*</span> 的为必填项</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    客户 <RequiredMark required={requiredFields.includes('customerId')} />
                  </label>
                  <SelectWithAdd
                    value={String(formData.customerId ?? '')}
                    onChange={(value) => handleCustomerChange(value)}
                    options={(() => {
                      const base = customers.map((c) => ({
                        value: String(c.id),
                        label: String(c.name ?? ''),
                      }))
                      if (
                        formData.customerId &&
                        formData.customerName &&
                        !base.some((o) => String(o.value) === String(formData.customerId))
                      ) {
                        return [
                          { value: String(formData.customerId), label: String(formData.customerName) },
                          ...base,
                        ]
                      }
                      return base
                    })()}
                    onAddNew={async (name) => {
                      const customerCode = `CUST-${Date.now().toString().slice(-6)}`
                      try {
                        const newCustomer = await addCustomer({
                          name: name.trim(),
                          code: customerCode,
                          type: '直客',
                          status: '正常',
                        })
                        handleCustomerChange(newCustomer.id)
                      } catch (error: any) {
                        alert('添加客户失败：' + (error.message || '未知错误'))
                      }
                    }}
                    placeholder="选择客户"
                    addText="快速添加客户"
                    searchable={true}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">销售日期 <RequiredMark required={requiredFields.includes('salesDate')} /></label>
                    <DateInput
                      value={formData.salesDate}
                      onChange={(value) => setFormData({ ...formData, salesDate: value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">交货日期 <RequiredMark required={requiredFields.includes('deliveryDate')} /></label>
                    <DateInput
                      value={formData.deliveryDate}
                      onChange={(value) => setFormData({ ...formData, deliveryDate: value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">联系电话 <RequiredMark required={requiredFields.includes('contactPhone')} /></label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">交货地址 <RequiredMark required={requiredFields.includes('deliveryAddress')} /></label>
                  <Input
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    className="text-sm h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">已收金额 <RequiredMark required={requiredFields.includes('paidAmount')} /></label>
                  <Input
                    type="number"
                    value={formData.paidAmount}
                    readOnly
                    className="text-sm h-9 bg-gray-100"
                  />
                  <div className="mt-1 text-xs text-gray-400">已收金额由下方“收款明细”自动合计</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">收款方式</label>
                  <div className="space-y-2">
                    {paymentLines.map((p) => {
                      const method = PAYMENT_METHODS.includes(p.method as any) ? p.method : '现金'
                      const Icon = PAYMENT_ICONS[method] ?? CashIcon
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <div className="w-28 flex items-center gap-2">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <SelectWithAdd
                              value={method}
                              onChange={(v) =>
                                setPaymentLines((prev) =>
                                  prev.map((x) =>
                                    x.id === p.id
                                      ? { ...x, method: (PAYMENT_METHODS.includes(v as any) ? v : '现金') as PaymentLine['method'] }
                                      : x
                                  )
                                )
                              }
                              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
                              searchable={false}
                              allowAdd={false}
                              clearable={false}
                              className="text-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Input
                              type="number"
                              value={p.amount}
                              onChange={(e) =>
                                setPaymentLines((prev) =>
                                  prev.map((x) =>
                                    x.id === p.id ? { ...x, amount: Number(e.target.value) || 0 } : x
                                  )
                                )
                              }
                              className="text-sm h-9"
                              placeholder="金额"
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentLines((prev) => [...prev, { id: makeId(), method: '现金', amount: 0 }])
                        }
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + 添加收款
                      </button>
                      <div className="text-sm text-gray-700">
                        合计：<span className="font-semibold text-red-600">{formatAmount(formData.paidAmount)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">支持组合：现金 1000 + 微信 500</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">备注 <RequiredMark required={requiredFields.includes('remark')} /></label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    rows={2}
                    className="input-underline w-full px-0 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* 右侧：商品明细 */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">商品明细</h2>
              </div>

              {/* 添加表单（单行等分占满，无横向滚动） */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-end gap-2 w-full flex-nowrap">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">商品</label>
                    <SelectWithAdd
                      value={newItem.productId}
                      onChange={(value) => handleProductChange(value)}
                      options={products.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.code})`,
                      }))}
                      placeholder="选择商品"
                      searchable={true}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">色号</label>
                    {editingIndex !== null ? (
                      <SelectWithAdd
                        value={newItem.colorId}
                        onChange={(value) => handleColorChangeSingle(value)}
                        disabled={!newItem.productId}
                        options={colorOptions}
                        onAddNew={async (value) => {
                          if (!newItem.productId) {
                            alert('请先选择商品')
                            return
                          }
                          try {
                            const parsed = parseColorCodeAndName(value)
                            if (debugQuickAdd) {
                              console.log('[quickAddColor][sales] start', {
                                input: value,
                                parsed,
                                productId: newItem.productId,
                              })
                            }
                            const newColor = await addColor(newItem.productId, {
                              code: parsed.code,
                              name: parsed.name,
                              status: '在售',
                            })
                            try { await loadColors(newItem.productId) } catch (_) { /* 已通过 addColor 写入 store */ }
                            if (debugQuickAdd) {
                              console.log('[quickAddColor][sales] success', {
                                newColor,
                                productId: newItem.productId,
                              })
                            }
                            handleColorChangeSingle(newColor.id)
                          } catch (error: any) {
                            if (debugQuickAdd) {
                              console.error('[quickAddColor][sales] failed', {
                                input: value,
                                productId: newItem.productId,
                                error,
                              })
                            }
                            alert('添加色号失败：' + (error.message || '未知错误'))
                          }
                        }}
                        placeholder={newItem.productId ? "选择色号" : "先选商品"}
                        addText="添加色号"
                        searchable={true}
                        className="text-sm"
                      />
                    ) : (
                      <MultiSelectWithAdd
                        value={newItem.colorIds}
                        onChange={(value) => handleColorChange(value)}
                        disabled={!newItem.productId}
                        options={colorOptions}
                        onAddNew={async (value) => {
                          if (!newItem.productId) {
                            alert('请先选择商品')
                            return
                          }
                          try {
                            const parsed = parseColorCodeAndName(value)
                            if (debugQuickAdd) {
                              console.log('[quickAddColor][sales] start(multi)', {
                                input: value,
                                parsed,
                                productId: newItem.productId,
                                prevColorIds: newItem.colorIds,
                              })
                            }
                            const newColor = await addColor(newItem.productId, {
                              code: parsed.code,
                              name: parsed.name,
                              status: '在售',
                            })
                            try { await loadColors(newItem.productId) } catch (_) { /* 已通过 addColor 写入 store */ }
                            if (debugQuickAdd) {
                              console.log('[quickAddColor][sales] success(multi)', {
                                newColor,
                                productId: newItem.productId,
                              })
                            }
                            handleColorChange([...newItem.colorIds, newColor.id])
                          } catch (error: any) {
                            if (debugQuickAdd) {
                              console.error('[quickAddColor][sales] failed(multi)', {
                                input: value,
                                productId: newItem.productId,
                                error,
                              })
                            }
                            alert('添加色号失败：' + (error.message || '未知错误'))
                          }
                        }}
                        placeholder={newItem.productId ? "选择色号（可多选）" : "先选商品"}
                        addText="添加色号"
                        searchable={true}
                        className="text-sm"
                      />
                    )}
                  </div>
                  {enableBatch && (
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-700 mb-1">缸号</label>
                      <SelectWithAdd
                        value={String(newItem.batchId ?? '')}
                        onChange={(value) => handleBatchChange(value)}
                        disabled={!newItem.colorId}
                        options={(() => {
                          const base = batchOptions
                          if (
                            newItem.batchId &&
                            newItem.batchCode &&
                            !base.some((o) => String(o.value) === String(newItem.batchId))
                          ) {
                            return [
                              { value: String(newItem.batchId), label: String(newItem.batchCode) },
                              ...base,
                            ]
                          }
                          return base
                        })()}
                        onAddNew={async (code) => {
                          if (!newItem.colorId) {
                            alert('请先选择色号')
                            return
                          }
                          try {
                            if (debugQuickAdd) {
                              console.log('[quickAddBatch][sales] start', {
                                input: code,
                                colorId: newItem.colorId,
                              })
                            }
                            const newBatch = await addBatch(newItem.colorId, {
                              code: code.trim(),
                              productionDate: new Date().toISOString().split('T')[0],
                              initialQuantity: 0,
                              stockQuantity: 0,
                            })
                            try { await loadBatches(newItem.colorId) } catch (_) { /* 已通过 addBatch 写入 store */ }
                            if (debugQuickAdd) {
                              console.log('[quickAddBatch][sales] success', {
                                newBatch,
                                colorId: newItem.colorId,
                              })
                            }
                            handleBatchChange(newBatch.id)
                          } catch (error: any) {
                            if (debugQuickAdd) {
                              console.error('[quickAddBatch][sales] failed', {
                                input: code,
                                colorId: newItem.colorId,
                                error,
                              })
                            }
                            alert('添加缸号失败：' + (error.message || '未知错误'))
                          }
                        }}
                        placeholder={newItem.colorId ? "选择缸号" : "先选色号"}
                        addText="添加缸号"
                        searchable={true}
                        className="text-sm"
                      />
                    </div>
                  )}
                  {selectedProduct?.enableDualUnit ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">件数</label>
                        <Input
                          type="number"
                          value={newItem.pieceCount}
                          onChange={(e) =>
                            setNewItem({ ...newItem, pieceCount: parseFloat(e.target.value) || 0 })
                          }
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">单重</label>
                        <Input
                          type="number"
                          value={newItem.unitWeight}
                          onChange={(e) =>
                            setNewItem({ ...newItem, unitWeight: parseFloat(e.target.value) || 0 })
                          }
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">总重</label>
                        <Input
                          type="number"
                          value={newItem.quantity}
                          readOnly
                          className="text-sm h-9"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-700 mb-1">数量</label>
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm h-9"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">单价</label>
                    <Input
                      type="number"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })
                      }
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
                    <Input
                      value={newItem.remark}
                      onChange={(e) => setNewItem({ ...newItem, remark: e.target.value })}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="flex-shrink-0 self-stretch flex items-end pb-0.5">
                    {editingIndex !== null ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateItem}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          确认
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          取消
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleAddItem}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        添加
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 明细表格（等分占满一行，含备注列） */}
              <div className="overflow-visible">
                <table className="w-full min-w-0 table-fixed">
                  <colgroup>
                    {/* 商品/色号加大；数量/单价缩小 */} 
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '4%', minWidth: '4rem' }} />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 truncate">商品</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 truncate">色号</th>
                      {enableBatch && (
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 truncate">缸号</th>
                      )}
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 truncate">数量</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 truncate">单价</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-700 truncate">小计</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 truncate">备注</th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={enableBatch ? 8 : 7} className="px-2 py-8 text-center text-sm text-gray-500">
                          暂无商品，请在上方添加
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-2 py-2 text-sm truncate" title={item.productName}>{item.productName}</td>
                          <td className="px-2 py-2 text-sm text-gray-600 truncate" title={item.colorName}>{item.colorName}</td>
                          {enableBatch && (
                            <td className="px-2 py-2 text-sm text-gray-600 truncate" title={item.batchCode}>{item.batchCode}</td>
                          )}
                          <td className="px-2 py-2 text-sm text-right text-red-600">
                            {formatNumber(item.quantity)} {item.unit}
                          </td>
                          <td className="px-2 py-2 text-sm text-right text-red-600">{formatAmount(item.price)}</td>
                          <td className="px-2 py-2 text-sm font-medium text-right text-red-600">
                            {formatAmount(item.quantity * item.price)}
                          </td>
                          <td className="px-2 py-2 text-sm text-gray-600 truncate" title={item.remark ?? ''}>{item.remark ?? '-'}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditItem(index)}
                                className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={enableBatch ? 5 : 4} className="px-2 py-2 text-right text-sm font-medium">
                          合计：
                        </td>
                        <td className="px-2 py-2 text-sm font-bold text-red-600">
                          {formatAmount(calculateTotalAmount())}
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 汇总信息 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">汇总</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品数量</span>
                  <span className="font-medium">{items.length} 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">合计金额</span>
                  <span className="font-semibold text-lg text-red-600">
                    {formatAmount(calculateTotalAmount())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">已收金额</span>
                  <span className="font-medium text-red-600">{formatAmount(formData.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">欠款金额</span>
                  <span className="font-semibold text-red-600">
                    {formatAmount(calculateTotalAmount() - formData.paidAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesCreate
