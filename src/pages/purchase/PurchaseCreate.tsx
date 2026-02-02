import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePurchaseStore } from '@/store/purchaseStore'
import { useProductStore } from '@/store/productStore'
import { useContactStore } from '@/store/contactStore'
import { useSettingsStore } from '@/store/settingsStore'
import { PurchaseOrderItem, PurchaseOrderFormData } from '@/types/purchase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SelectWithAdd from '@/components/ui/SelectWithAdd'
import DateInput from '@/components/ui/DateInput'
import RequiredFieldsConfigModal from '@/components/ui/RequiredFieldsConfigModal'
import { RequiredMark } from '@/components/ui/RequiredMark'
import { Plus, Trash2, Save, ArrowLeft, Edit2, Check, X, Settings } from 'lucide-react'
import { formatNumber, formatAmount } from '@/utils/formatNumber'
import { WeChatIcon } from '@/components/ui/WeChatIcon'
import { AlipayIcon } from '@/components/ui/AlipayIcon'
import { CashIcon } from '@/components/ui/CashIcon'
import { BankCardIcon } from '@/components/ui/BankCardIcon'
import { ScanPayIcon } from '@/components/ui/ScanPayIcon'
import { parseColorCodeAndName } from '@/utils/parseColorInput'

const PURCHASE_PAGE_KEY = 'purchase'
const PURCHASE_FIELDS = [
  { id: 'supplierId', label: '供应商' },
  { id: 'purchaseDate', label: '采购日期' },
  { id: 'expectedDate', label: '预计到货日期' },
  { id: 'paidAmount', label: '已付金额' },
  { id: 'remark', label: '备注' },
] as const
const PURCHASE_DEFAULT_REQUIRED = ['supplierId']

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

function PurchaseCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined
  const { orders, addOrder, loadOrders } = usePurchaseStore()
  const { products, colors, batches, loadAll, loadColors, getColorsByProduct, addColor } = useProductStore()
  const { suppliers, loadSuppliers, addSupplier } = useContactStore()
  const { getPageRequiredFields, systemParams } = useSettingsStore()
  const enableBatch = !!systemParams?.enableBatch
  const enableStockLocation = !!systemParams?.enableStockLocation
  const defaultStockLocation = systemParams?.defaultStockLocation ?? '默认仓位'
  const stockLocations = systemParams?.stockLocations ?? [defaultStockLocation]
  const [showRequiredModal, setShowRequiredModal] = useState(false)
  const requiredFields = getPageRequiredFields(PURCHASE_PAGE_KEY, PURCHASE_DEFAULT_REQUIRED)

  const [formData, setFormData] = useState<Omit<PurchaseOrderFormData, 'items'>>({
    supplierId: '',
    supplierName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    paidAmount: 0,
    paymentMethod: '现金',
    remark: '',
  })

  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'id' | 'amount'>[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
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

  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    { id: makeId(), method: '现金', amount: 0 },
  ])

  const debugQuickAdd =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV || localStorage.getItem('debugQuickAdd') === '1')

  useEffect(() => {
    loadAll()
    loadSuppliers()
    if (isEdit) {
      loadOrders()
    }
  }, [loadAll, loadSuppliers, isEdit, loadOrders])

  // 如果是编辑模式，加载订单数据
  useEffect(() => {
    if (isEdit && id && orders.length > 0) {
      const order = orders.find((o) => o.id === id)
      if (order) {
        setFormData({
          supplierId: String(order.supplierId ?? ''),
          supplierName: order.supplierName ?? '',
          purchaseDate: order.purchaseDate,
          expectedDate: order.expectedDate || '',
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
          batchCode: item.batchCode || '',
          quantity: item.quantity,
          pieceCount: item.pieceCount || 0,
          unitWeight: item.unitWeight || 0,
          unit: item.unit || 'kg',
          price: item.price || item.unitPrice || 0,
          productionDate: item.productionDate || new Date().toISOString().split('T')[0],
          stockLocation: item.stockLocation || '',
          remark: item.remark || '',
        })))
      }
    }
  }, [isEdit, id, orders])

  // 多笔付款合计 -> 回填已付金额；并保留一个兼容的 paymentMethod（取第一笔）
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
    const productId = editingIndex !== null ? items[editingIndex]?.productId : itemForm.productId
    if (!productId) return []
    const productColors = getColorsByProduct(productId)
    return productColors
      .filter((c) => c && c.id)
      .map((c) => ({
        value: c.id,
        label: `${c.code || ''} - ${c.name || ''}`.replace(/^ - | - $|^$/, '') || c.id,
        color: c,
      }))
  }, [itemForm.productId, editingIndex, items, colors, getColorsByProduct])

  // 获取当前选中商品信息
  const selectedProduct = useMemo(() => {
    const productId = editingIndex !== null ? items[editingIndex]?.productId : itemForm.productId
    return products.find((p) => p.id === productId)
  }, [itemForm.productId, editingIndex, items, products])

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
      batchCode: enableBatch ? itemForm.batchCode : '默认',
      quantity: itemForm.quantity,
      pieceCount: itemForm.pieceCount,
      unitWeight: itemForm.unitWeight,
      unit: itemForm.unit,
      price: itemForm.price,
      productionDate: itemForm.productionDate,
      stockLocation: enableStockLocation ? (itemForm.stockLocation || defaultStockLocation) : defaultStockLocation,
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
      stockLocation: enableStockLocation ? defaultStockLocation : '',
      remark: '',
    })
  }

  const handleEditItem = (index: number) => {
    const item = items[index]
    setItemForm({
      productId: item.productId,
      productName: item.productName,
      colorId: item.colorId,
      colorName: item.colorName,
      colorCode: item.colorCode,
      batchCode: item.batchCode,
      quantity: item.quantity,
      pieceCount: item.pieceCount || 0,
      unitWeight: item.unitWeight || 0,
      unit: item.unit,
      price: item.price,
      productionDate: item.productionDate || new Date().toISOString().split('T')[0],
      stockLocation: item.stockLocation || '',
      remark: item.remark || '',
    })
    setEditingIndex(index)
  }

  const handleUpdateItem = () => {
    if (!itemForm.productId || !itemForm.colorId || itemForm.quantity <= 0) {
      alert('请填写完整的商品信息')
      return
    }

    const updatedItems = [...items]
    updatedItems[editingIndex!] = {
      productId: itemForm.productId,
      productName: itemForm.productName,
      productCode: selectedProduct?.code || '',
      colorId: itemForm.colorId,
      colorName: itemForm.colorName,
      colorCode: itemForm.colorCode,
      batchCode: enableBatch ? itemForm.batchCode : '默认',
      quantity: itemForm.quantity,
      pieceCount: itemForm.pieceCount,
      unitWeight: itemForm.unitWeight,
      unit: itemForm.unit,
      price: itemForm.price,
      productionDate: itemForm.productionDate,
      stockLocation: enableStockLocation ? (itemForm.stockLocation || defaultStockLocation) : defaultStockLocation,
      remark: itemForm.remark,
    }
    setItems(updatedItems)
    setEditingIndex(null)
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
      stockLocation: enableStockLocation ? defaultStockLocation : '',
      remark: '',
    })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
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
      stockLocation: enableStockLocation ? defaultStockLocation : '',
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
    // 先从当前商品的色号中查找，如果找不到则从所有色号中查找
    const color = getColorsByProduct(itemForm.productId).find((c) => c.id === colorId) ||
                  colors.find((c) => c.id === colorId) ||
                  useProductStore.getState().colors.find((c) => c.id === colorId)
    
    if (!color && colorId) {
      console.warn('Color not found:', colorId)
    }
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
    const missing: string[] = []
    if (requiredFields.includes('supplierId') && !formData.supplierId) missing.push('供应商')
    if (requiredFields.includes('purchaseDate') && !formData.purchaseDate) missing.push('采购日期')
    if (requiredFields.includes('expectedDate') && !formData.expectedDate) missing.push('预计到货日期')
    if (requiredFields.includes('paidAmount') && formData.paidAmount == null) missing.push('已付金额')
    if (requiredFields.includes('remark') && !String(formData.remark || '').trim()) missing.push('备注')
    if (missing.length) {
      alert(`请填写必填项：${missing.join('、')}`)
      return
    }

    if (items.length === 0) {
      alert('请至少添加一个商品明细')
      return
    }

    const requiredLabels = requiredFields
      .filter((id) => PURCHASE_FIELDS.some((f) => f.id === id))
      .map((id) => PURCHASE_FIELDS.find((f) => f.id === id)!.label)
      .join('、')

    try {
      const parts = paymentLines
        .filter((p) => Number(p.amount) > 0)
        .map((p) => `${p.method} ${formatNumber(p.amount)}`)
      const paymentLine = parts.length ? `付款明细：${parts.join('；')}` : null
      const mergedRemark = mergeRemarkLine(formData.remark || '', '付款明细：', paymentLine)

      const orderData: PurchaseOrderFormData = {
        ...formData,
        remark: mergedRemark,
        items: items.map((item) => ({
          ...item,
          amount: item.quantity * item.price,
          ...(!enableStockLocation && { stockLocation: defaultStockLocation }),
        })),
      }

      await addOrder(orderData, status)
      alert(status === '草稿' ? '采购单已保存为草稿' : '采购单已创建并入库')
      navigate('/purchase')
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/purchase')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isEdit ? '编辑进货单' : '新建进货单'}
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
              <Button onClick={() => handleSave('已入库')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-1.5" />
                保存并入库
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RequiredFieldsConfigModal
        open={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        pageKey={PURCHASE_PAGE_KEY}
        title="进货单"
        fields={[...PURCHASE_FIELDS]}
        defaultRequired={PURCHASE_DEFAULT_REQUIRED}
      />

      <div className="max-w-[95%] mx-auto px-4 py-4">
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
                    供应商 <RequiredMark required={requiredFields.includes('supplierId')} />
                  </label>
                  <SelectWithAdd
                    value={String(formData.supplierId ?? '')}
                    onChange={(value) => handleSupplierChange(value)}
                    options={(() => {
                      const base = suppliers.map((s) => ({
                        value: String(s.id),
                        label: String(s.name ?? ''),
                      }))
                      if (
                        formData.supplierId &&
                        formData.supplierName &&
                        !base.some((o) => String(o.value) === String(formData.supplierId))
                      ) {
                        return [
                          { value: String(formData.supplierId), label: String(formData.supplierName) },
                          ...base,
                        ]
                      }
                      return base
                    })()}
                    onAddNew={async (name) => {
                      const supplierCode = `SUPP-${Date.now().toString().slice(-6)}`
                      try {
                        const newSupplier = await addSupplier({
                          name: name.trim(),
                          code: supplierCode,
                          type: '厂家',
                          status: '合作中',
                          settlementCycle: '现结',
                        })
                        handleSupplierChange(newSupplier.id)
                      } catch (error: any) {
                        alert('添加供应商失败：' + (error.message || '未知错误'))
                      }
                    }}
                    placeholder="选择供应商"
                    addText="快速添加供应商"
                    searchable={true}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">采购日期 <RequiredMark required={requiredFields.includes('purchaseDate')} /></label>
                    <DateInput
                      value={formData.purchaseDate}
                      onChange={(value) => setFormData({ ...formData, purchaseDate: value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">预计到货日期 <RequiredMark required={requiredFields.includes('expectedDate')} /></label>
                    <DateInput
                      value={formData.expectedDate}
                      onChange={(value) => setFormData({ ...formData, expectedDate: value })}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">已付金额 <RequiredMark required={requiredFields.includes('paidAmount')} /></label>
                  <Input
                    type="number"
                    value={formData.paidAmount}
                    readOnly
                    className="text-sm h-9 bg-gray-100"
                  />
                  <div className="mt-1 text-xs text-gray-400">已付金额由下方“付款明细”自动合计</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">付款方式</label>
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
                        + 添加付款
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
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* 添加表单（单行横向布局） */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-end gap-3 scrollbar-hide" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                  <div className="flex-shrink-0" style={{ width: '240px', minWidth: '240px' }}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">商品</label>
                    <SelectWithAdd
                      value={itemForm.productId}
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
                  <div className="flex-shrink-0" style={{ width: '130px' }}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">色号</label>
                    <SelectWithAdd
                      value={itemForm.colorId}
                      onChange={(value) => handleColorChange(value)}
                      disabled={!itemForm.productId}
                      options={colorOptions}
                      onAddNew={async (value) => {
                        if (!itemForm.productId) {
                          alert('请先选择商品')
                          return
                        }
                        try {
                          const parsed = parseColorCodeAndName(value)
                          if (debugQuickAdd) {
                            console.log('[quickAddColor][purchase] start', {
                              input: value,
                              parsed,
                              productId: itemForm.productId,
                            })
                          }
                          const newColor = await addColor(itemForm.productId, {
                            code: parsed.code,
                            name: parsed.name,
                            status: '在售',
                          })
                          try { await loadColors(itemForm.productId) } catch (_) { /* 已通过 addColor 写入 store */ }
                          if (debugQuickAdd) {
                            console.log('[quickAddColor][purchase] success', {
                              newColor,
                              productId: itemForm.productId,
                            })
                          }
                          handleColorChange(newColor.id)
                        } catch (error: any) {
                          if (debugQuickAdd) {
                            console.error('[quickAddColor][purchase] failed', {
                              input: value,
                              productId: itemForm.productId,
                              error,
                            })
                          }
                          alert('添加色号失败：' + (error.message || '未知错误'))
                        }
                      }}
                      placeholder={itemForm.productId ? "选择色号" : "先选商品"}
                      addText="添加色号"
                      searchable={true}
                      className="text-sm"
                    />
                  </div>
                  {enableBatch && (
                    <div className="flex-shrink-0" style={{ width: '110px' }}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">缸号</label>
                      <Input
                        value={itemForm.batchCode}
                        onChange={(e) => setItemForm({ ...itemForm, batchCode: e.target.value })}
                        placeholder="缸号"
                        className="text-sm h-9"
                      />
                    </div>
                  )}
                  {selectedProduct?.enableDualUnit ? (
                    <>
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">件数</label>
                        <Input
                          type="number"
                          value={itemForm.pieceCount}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, pieceCount: parseFloat(e.target.value) || 0 })
                          }
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">单重</label>
                        <Input
                          type="number"
                          value={itemForm.unitWeight}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, unitWeight: parseFloat(e.target.value) || 0 })
                          }
                          className="text-sm h-9"
                        />
                      </div>
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">总重</label>
                        <Input
                          type="number"
                          value={itemForm.quantity}
                          readOnly
                          className="text-sm h-9 bg-gray-100"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-shrink-0" style={{ width: '100px' }}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">数量</label>
                      <Input
                        type="number"
                        value={itemForm.quantity}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, quantity: parseFloat(e.target.value) || 0 })
                        }
                        className="text-sm h-9"
                      />
                    </div>
                  )}
                  <div className="flex-shrink-0" style={{ width: '110px' }}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">单价</label>
                    <Input
                      type="number"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })
                      }
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="flex-shrink-0" style={{ width: '130px' }}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">生产日期</label>
                    <DateInput
                      value={itemForm.productionDate}
                      onChange={(value) => setItemForm({ ...itemForm, productionDate: value })}
                      className="text-sm"
                    />
                  </div>
                  {enableStockLocation && (
                    <div className="flex-shrink-0" style={{ width: '120px' }}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">仓位</label>
                      <SelectWithAdd
                        value={itemForm.stockLocation || defaultStockLocation}
                        onChange={(v) => setItemForm({ ...itemForm, stockLocation: v || defaultStockLocation })}
                        options={stockLocations.map((s) => ({ value: s, label: s }))}
                        searchable={false}
                        allowAdd={false}
                        clearable={false}
                        className="text-sm h-9"
                      />
                    </div>
                  )}
                  <div className="flex-shrink-0" style={{ width: '140px' }}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
                    <Input
                      value={itemForm.remark}
                      onChange={(e) => setItemForm({ ...itemForm, remark: e.target.value })}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="flex-shrink-0">
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

              {/* 明细表格（在表单下方，含备注列） */}
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">商品</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">色号</th>
                      {enableBatch && (
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">缸号</th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">数量</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">单价</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">小计</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">备注</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={enableBatch ? 8 : 7} className="px-3 py-8 text-center text-sm text-gray-500">
                          暂无商品，请在上方添加
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{item.productName}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{item.colorName}</td>
                          {enableBatch && (
                            <td className="px-3 py-2 text-sm text-gray-600">{item.batchCode}</td>
                          )}
                          <td className="px-3 py-2 text-sm text-right text-red-600">
                            {formatNumber(item.quantity)} {item.unit}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-red-600">{formatAmount(item.price)}</td>
                          <td className="px-3 py-2 text-sm font-medium text-right text-red-600">
                            {formatAmount(item.quantity * item.price)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-[120px]" title={item.remark ?? ''}>{item.remark ?? '-'}</td>
                          <td className="px-3 py-2">
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
                        <td colSpan={5} className="px-3 py-2 text-right text-sm font-medium">
                          合计：
                        </td>
                        <td className="px-3 py-2 text-sm font-bold text-red-600">
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
                  <span className="text-gray-600">已付金额</span>
                  <span className="font-medium text-red-600">{formatAmount(formData.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">未付金额</span>
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

export default PurchaseCreate
