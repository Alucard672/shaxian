import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Product, Color } from '@/types/product'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ModernTable from '@/components/ui/ModernTable'
import BaseCard from '@/components/ui/BaseCard'
import StatusBadge from '@/components/ui/StatusBadge'
import SelectWithAdd from '@/components/ui/SelectWithAdd'
import { Plus, Edit, Trash2, Save, Package, Search, Palette, Upload, X, Image as ImageIcon, Barcode, Settings, LayoutList } from 'lucide-react'
import ColorPicker from '@/components/ui/ColorPicker'
import RequiredFieldsConfigModal from '@/components/ui/RequiredFieldsConfigModal'
import VisibleColumnsConfigModal from '@/components/ui/VisibleColumnsConfigModal'
import { RequiredMark } from '@/components/ui/RequiredMark'
import { useContactStore } from '@/store/contactStore'

const PRODUCT_PAGE_KEY = 'product'
const PRODUCT_LIST_DOC_KEY = 'product-list'
const PRODUCT_COLUMN_OPTIONS = [
  { id: 'name', label: '商品名称' },
  { id: 'unit', label: '单位' },
  { id: 'manufacturer', label: '厂家' },
  { id: 'composition', label: '成分' },
  { id: 'colorCount', label: '色号数量' },
]
const PRODUCT_DEFAULT_VISIBLE = PRODUCT_COLUMN_OPTIONS.map((c) => c.id)
const PRODUCT_FIELDS = [
  { id: 'name', label: '商品名称' },
  { id: 'code', label: '商品编码' },
  { id: 'composition', label: '成分' },
  { id: 'manufacturer', label: '厂家' },
  { id: 'unit', label: '单位' },
  { id: 'count', label: '支数' },
  { id: 'width', label: '幅宽' },
  { id: 'weight', label: '克重' },
] as const

function ProductManagement() {
  const navigate = useNavigate()
  const {
    products,
    colors,
    loading,
    loadProducts,
    loadColors,
    addProduct,
    updateProduct,
    deleteProduct,
    addColor,
    updateColor,
    deleteColor,
    getColorsByProduct,
  } = useProductStore()
  
  const { units, loadUnits, addUnit, systemParams, getPageRequiredFields, getDocumentVisibleColumns } = useSettingsStore()
  const { suppliers, loadSuppliers, addSupplier } = useContactStore()
  const defaultRequired = systemParams?.productRequiredFields || ['name', 'code']
  const requiredFields = getPageRequiredFields(PRODUCT_PAGE_KEY, defaultRequired)
  const [showRequiredModal, setShowRequiredModal] = useState(false)
  const [showColumnsModal, setShowColumnsModal] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [isColorFormOpen, setIsColorFormOpen] = useState(false)
  const [colorFormData, setColorFormData] = useState({
    code: '',
    name: '',
    colorValue: '',
    description: '',
    status: '在售' as '在售' | '停售',
  })
  type PendingColor = { code: string; name: string; colorValue?: string; status: '在售' | '停售' }
  const [pendingColors, setPendingColors] = useState<PendingColor[]>([])
  const [pendingColorForm, setPendingColorForm] = useState<{ code: string; name: string; colorValue: string; status: '在售' | '停售' }>({
    code: '',
    name: '',
    colorValue: '',
    status: '在售',
  })
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    specification: '',
    composition: '',
    count: '',
    unit: 'kg',
    isWhiteYarn: false,
    description: '',
    manufacturer: '',
    width: '',
    weight: '',
    colorCode: '',
    images: [] as string[],
  })
  const productType = systemParams?.productType || '纱线'

  useEffect(() => {
    loadProducts()
    loadColors()
    loadUnits()
    loadSuppliers()
  }, [loadProducts, loadColors, loadUnits, loadSuppliers])

  // 当编辑商品时，加载该商品的色号
  useEffect(() => {
    if (editingProduct) {
      loadColors(editingProduct.id)
    }
  }, [editingProduct, loadColors])

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        code: product.code,
        specification: product.specification || '',
        composition: product.composition || '',
        count: product.count || '',
        unit: product.unit,
        isWhiteYarn: product.isWhiteYarn || false,
        description: product.description || '',
        manufacturer: product.manufacturer || '',
        width: product.width || '',
        weight: product.weight || '',
        colorCode: product.colorCode || '',
        images: product.images || [],
      })
    } else {
      setEditingProduct(null)
      setPendingColors([])
      setPendingColorForm({ code: '', name: '', colorValue: '', status: '在售' })
      setFormData({
        name: '',
        code: '',
        specification: '',
        composition: '',
        count: '',
        unit: 'kg',
        isWhiteYarn: false,
        description: '',
        manufacturer: '',
        width: '',
        weight: '',
        colorCode: '',
        images: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setPendingColors([])
    setPendingColorForm({ code: '', name: '', colorValue: '', status: '在售' })
    setFormData({
      name: '',
      code: '',
      specification: '',
      composition: '',
      count: '',
      unit: 'kg',
      isWhiteYarn: false,
      description: '',
      manufacturer: '',
      width: '',
      weight: '',
      colorCode: '',
      images: [],
    })
  }

  const handleAddPendingColor = () => {
    const { code, name, colorValue, status } = pendingColorForm
    if (!code.trim() || !name.trim()) {
      alert('请填写色号编码和名称')
      return
    }
    setPendingColors((prev) => [...prev, { code: code.trim(), name: name.trim(), colorValue: colorValue || undefined, status }])
    setPendingColorForm({ code: '', name: '', colorValue: '', status: '在售' })
  }

  const handleRemovePendingColor = (index: number) => {
    setPendingColors((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const fieldLabels: Record<string, string> = {
      name: '商品名称',
      code: '商品编码',
      specification: '规格',
      composition: '成分',
      count: '支数',
      unit: '单位',
      manufacturer: '厂家',
      width: '幅宽',
      weight: '克重',
    }
    const allowedRequired = requiredFields.filter((f) => f !== 'type' && f !== 'needleType')
    const typeSpecific = productType === '纱线' ? ['count'] : ['width', 'weight']
    const toCheck = allowedRequired.filter((f) => {
      if (['width', 'weight', 'count'].includes(f)) return typeSpecific.includes(f)
      return true
    })
    const missingFields: string[] = []
    toCheck.forEach((field) => {
      const value = formData[field as keyof typeof formData]
      if (!value || (typeof value === 'string' && !value.trim())) {
        missingFields.push(fieldLabels[field] || field)
      }
    })
    
    if (missingFields.length > 0) {
      alert(`请填写以下必填项：${missingFields.join('、')}`)
      return
    }

    if (!editingProduct && formData.code.trim()) {
      const exists = products.some((p) => (p.code || '').toLowerCase() === formData.code.trim().toLowerCase())
      if (exists) {
        alert('商品编码已存在，请使用其他编码后再保存。')
        return
      }
    }

    try {
      const payload = { ...formData, type: productType }
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        alert('商品更新成功')
      } else {
        const newProduct = await addProduct(payload)
        for (const pc of pendingColors) {
          await addColor(newProduct.id, { code: pc.code, name: pc.name, colorValue: pc.colorValue, status: pc.status })
        }
        alert(pendingColors.length ? '商品及色号创建成功' : '商品创建成功')
      }
      handleCloseModal()
    } catch (error: any) {
      const msg = error?.message || ''
      if (msg.includes('已存在') || msg.includes('重复')) {
        alert('保存失败：商品编码或名称与已有商品重复，请修改编码后重试。')
      } else {
        alert('保存失败：' + (msg || '未知错误'))
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要作废这个商品吗？作废后将不再用于开单。')) {
      return
    }

    try {
      await deleteProduct(id)
      alert('商品已作废')
    } catch (error: any) {
      alert('作废失败：' + (error.message || '未知错误'))
    }
  }

  const handleManageColors = (product: Product) => {
    setSelectedProduct(product)
    setIsColorModalOpen(true)
  }

  const handleCloseColorModal = () => {
    setIsColorModalOpen(false)
    setSelectedProduct(null)
    setEditingColor(null)
    setIsColorFormOpen(false)
    setColorFormData({
      code: '',
      name: '',
      colorValue: '',
      description: '',
      status: '在售',
    })
  }

  const handleOpenColorModal = (color?: Color) => {
    setIsColorFormOpen(true)
    if (color) {
      setEditingColor(color)
      setColorFormData({
        code: color.code,
        name: color.name,
        colorValue: color.colorValue || '',
        description: color.description || '',
        status: color.status,
      })
    } else {
      setEditingColor(null)
      setColorFormData({
        code: '',
        name: '',
        colorValue: '', // 新增时不设置默认颜色
        description: '',
        status: '在售',
      })
    }
  }

  const handleSaveColor = async () => {
    if (!selectedProduct) return

    if (!colorFormData.code.trim() || !colorFormData.name.trim()) {
      alert('请填写色号编码和名称')
      return
    }

    // 颜色值改为可选，不再强制要求
    // if (!colorFormData.colorValue || !colorFormData.colorValue.trim()) {
    //   alert('请选择颜色值')
    //   return
    // }

    try {
      if (editingColor) {
        await updateColor(editingColor.id, colorFormData)
        alert('色号更新成功')
      } else {
        await addColor(selectedProduct.id, colorFormData)
        alert('色号创建成功')
      }
      // 尝试刷新列表，如果失败也不影响（新色号已经添加到状态中了）
      try {
        await loadColors(selectedProduct.id)
      } catch (loadError: any) {
        // 加载失败不影响，因为新色号已经通过 addColor 添加到状态中了
        console.warn('刷新色号列表失败，但新色号已保存:', loadError)
      }
      setIsColorFormOpen(false)
      setEditingColor(null)
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    }
  }

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('确定要删除这个色号吗？删除后无法恢复。')) {
      return
    }

    try {
      await deleteColor(colorId)
      if (selectedProduct) {
        await loadColors(selectedProduct.id)
      }
      alert('色号已删除')
    } catch (error: any) {
      alert('删除失败：' + (error.message || '未知错误'))
    }
  }

  const filteredProducts = products.filter((product) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      String(product.name ?? '').toLowerCase().includes(keyword) ||
      String(product.code ?? '').toLowerCase().includes(keyword) ||
      (product.composition && String(product.composition).toLowerCase().includes(keyword)) ||
      (product.colorCode && String(product.colorCode).toLowerCase().includes(keyword))
    )
  })

  const visibleColumnKeys = getDocumentVisibleColumns(PRODUCT_LIST_DOC_KEY, PRODUCT_DEFAULT_VISIBLE)
  const allColumns = [
    {
      key: 'name',
      title: '商品名称',
      render: (_: any, record: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{record.name}</span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-sm text-gray-600">{record.code}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'unit',
      title: '单位',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.unit}</span>
      ),
    },
    {
      key: 'manufacturer',
      title: '厂家',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.manufacturer || '-'}</span>
      ),
    },
    {
      key: 'composition',
      title: '成分',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.composition || '-'}</span>
      ),
    },
    {
      key: 'colorCount',
      title: '色号数量',
      render: (_: any, record: Product) => {
        const colorCount = getColorsByProduct(record.id).length
        return (
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">{colorCount} 个</span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleManageColors(record)}
            className="p-1.5 hover:bg-purple-50 rounded-xl"
            title="管理色号"
          >
            <Palette className="w-4 h-4 text-purple-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigate(`/products/barcode-print?productId=${record.id}`)
            }}
            className="p-1.5 hover:bg-green-50 rounded-xl"
            title="打印条码"
          >
            <Barcode className="w-4 h-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(record)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
            title="作废"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]
  const columns = allColumns.filter((c) => c.key === 'actions' || visibleColumnKeys.includes(c.key))

  return (
    <div className="space-y-6 p-8">
      <VisibleColumnsConfigModal
        open={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        docKey={PRODUCT_LIST_DOC_KEY}
        title="商品列表"
        columns={[...PRODUCT_COLUMN_OPTIONS]}
        defaultVisible={PRODUCT_DEFAULT_VISIBLE}
      />
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">商品管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理商品、色号、缸号信息</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnsModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="自定义列显示"
          >
            <LayoutList className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowRequiredModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="必填项设置"
          >
            <Settings className="w-5 h-5" />
          </button>
          <Button
            onClick={() => navigate('/products/barcode-print')}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Barcode className="w-4 h-4 mr-2" />
            打印条码
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建商品
          </Button>
        </div>
      </div>

      <RequiredFieldsConfigModal
        open={showRequiredModal}
        onClose={() => setShowRequiredModal(false)}
        pageKey={PRODUCT_PAGE_KEY}
        title="商品"
        fields={[...PRODUCT_FIELDS]}
        defaultRequired={defaultRequired}
      />

      {/* 搜索栏 */}
      <BaseCard padding="md">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索商品名称、编码、成分、色号..."
            className="w-96"
          />
          <Button
            onClick={() => {
              loadProducts()
              loadColors()
            }}
            className="h-10 px-6 rounded-lg border-blue-200 bg-blue-50 text-blue-600 font-medium whitespace-nowrap"
          >
            查询
          </Button>
        </div>
      </BaseCard>

      {/* 商品列表 */}
      <BaseCard padding="none">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无商品，点击"新建商品"创建第一个商品</p>
          </div>
        ) : (
          <ModernTable
            columns={columns}
            data={filteredProducts}
            rowKey={(record) => record.id}
          />
        )}
      </BaseCard>

      {/* 新增/编辑商品弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BaseCard className="w-full max-w-5xl max-h-[90vh] overflow-y-auto" padding="lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingProduct ? '编辑商品' : '新建商品'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名称 <RequiredMark required={requiredFields.includes('name')} />
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入商品名称"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品编码 <RequiredMark required={requiredFields.includes('code')} />
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="请输入商品编码"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    成分 <RequiredMark required={requiredFields.includes('composition')} />
                  </label>
                  <Input
                    value={formData.composition}
                    onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                    placeholder="请输入成分"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    厂家 <RequiredMark required={requiredFields.includes('manufacturer')} />
                  </label>
                  <SelectWithAdd
                    value={formData.manufacturer || ''}
                    onChange={(value) => setFormData({ ...formData, manufacturer: value })}
                    options={(() => {
                      const base = suppliers.map((s) => ({
                        value: String(s.name ?? ''),
                        label: String(s.name ?? ''),
                      }))
                      if (
                        formData.manufacturer &&
                        !base.some((o) => o.value === String(formData.manufacturer))
                      ) {
                        return [{ value: String(formData.manufacturer), label: String(formData.manufacturer) }, ...base]
                      }
                      return base
                    })()}
                    onAddNew={async (name) => {
                      const supplierCode = `SUPP-${Date.now().toString().slice(-6)}`
                      try {
                        await addSupplier({
                          name: name.trim(),
                          code: supplierCode,
                          type: '厂家',
                          status: '合作中',
                          settlementCycle: '现结',
                        })
                        setFormData({ ...formData, manufacturer: name.trim() })
                      } catch (error: any) {
                        alert('添加供应商失败：' + (error.message || '未知错误'))
                      }
                    }}
                    placeholder="选择或输入供应商"
                    addText="快速添加供应商"
                    searchable={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位 <RequiredMark required={requiredFields.includes('unit')} /></label>
                  <SelectWithAdd
                    value={formData.unit}
                    onChange={(value) => setFormData({ ...formData, unit: value })}
                    options={units.filter(u => u.isEnabled).map((unit) => ({
                      value: unit.name,
                      label: unit.name,
                    }))}
                    onAddNew={async (name) => {
                      await addUnit({
                        name,
                        isEnabled: true,
                      })
                      setFormData({ ...formData, unit: name })
                    }}
                    placeholder="选择或输入单位名称"
                    addText="添加新单位"
                    emptyText="暂无单位，输入名称后按回车添加"
                  />
                </div>
                {/* 纱线属性（系统设置-商品类型为纱线时显示） */}
                {productType === '纱线' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        支数 <RequiredMark required={requiredFields.includes('count')} />
                      </label>
                      <Input
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                        placeholder="请输入支数"
                        className="w-full"
                      />
                    </div>
                    {systemParams?.enableDyeingProcess && (
                      <div className="col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.isWhiteYarn}
                            onChange={(e) => setFormData({ ...formData, isWhiteYarn: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-700">白坯纱线</span>
                        </label>
                      </div>
                    )}
                  </>
                )}
                {/* 面料属性（系统设置-商品类型为面料时显示） */}
                {productType === '面料' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        幅宽 <RequiredMark required={requiredFields.includes('width')} />
                      </label>
                      <Input
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                        placeholder="请输入幅宽"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        克重 <RequiredMark required={requiredFields.includes('weight')} />
                      </label>
                      <Input
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="请输入克重"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">色号</label>
                  {editingProduct ? (
                    <>
                      <select
                        value={formData.colorCode}
                        onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择色号</option>
                        {getColorsByProduct(editingProduct.id).map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.code} {color.name}
                          </option>
                        ))}
                      </select>
                      {getColorsByProduct(editingProduct.id).length === 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          该商品暂无色号，请先<a href="#" onClick={(e) => { e.preventDefault(); handleManageColors(editingProduct); }} className="underline">添加色号</a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">新建时可预先添加色号，保存商品后将一并创建</p>
                      <div className="flex flex-nowrap gap-2 items-end overflow-x-auto pb-1">
                        <Input
                          value={pendingColorForm.code}
                          onChange={(e) => setPendingColorForm({ ...pendingColorForm, code: e.target.value })}
                          placeholder="色号编码"
                          className="w-28 min-w-[7rem] flex-shrink-0 text-sm"
                        />
                        <Input
                          value={pendingColorForm.name}
                          onChange={(e) => setPendingColorForm({ ...pendingColorForm, name: e.target.value })}
                          placeholder="色号名称"
                          className="w-28 min-w-[7rem] flex-shrink-0 text-sm"
                        />
                        <div className="w-32 flex-shrink-0">
                          <ColorPicker
                            value={pendingColorForm.colorValue || ''}
                            onChange={(v) => setPendingColorForm({ ...pendingColorForm, colorValue: v })}
                          />
                        </div>
                        <select
                          value={pendingColorForm.status}
                          onChange={(e) => setPendingColorForm({ ...pendingColorForm, status: e.target.value as '在售' | '停售' })}
                          className="h-9 px-2 border border-gray-200 rounded-lg text-sm flex-shrink-0"
                        >
                          <option value="在售">在售</option>
                          <option value="停售">停售</option>
                        </select>
                        <Button type="button" size="sm" onClick={handleAddPendingColor} className="bg-purple-600 hover:bg-purple-700 flex-shrink-0">
                          <Plus className="w-4 h-4 mr-1" />
                          添加
                        </Button>
                      </div>
                      {pendingColors.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {pendingColors.map((pc, idx) => (
                            <li
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-sm"
                            >
                              {pc.colorValue && (
                                <span className="w-3 h-3 rounded border border-gray-300 shrink-0" style={{ backgroundColor: pc.colorValue }} />
                              )}
                              <span>{pc.code} {pc.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingColor(idx)}
                                className="p-0.5 hover:bg-gray-200 rounded"
                              >
                                <X className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品图片 <span className="text-gray-500 text-xs">(最多9张)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`商品图片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index)
                            setFormData({ ...formData, images: newImages })
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 9 && (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">上传图片</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            const remainingSlots = 9 - formData.images.length
                            if (files.length > remainingSlots) {
                              alert(`最多只能上传${remainingSlots}张图片`)
                              files.splice(remainingSlots)
                            }
                            
                            const newImages: string[] = []
                            let loadedCount = 0
                            
                            files.forEach((file) => {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string
                                newImages.push(base64)
                                loadedCount++
                                if (loadedCount === files.length) {
                                  setFormData({
                                    ...formData,
                                    images: [...formData.images, ...newImages],
                                  })
                                }
                              }
                              reader.readAsDataURL(file)
                            })
                            // 重置input，以便可以再次选择相同的文件
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入商品描述"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={handleCloseModal}>
                  取消
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          </BaseCard>
        </div>
      )}

      {/* 色号管理弹窗 */}
      {isColorModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <BaseCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">管理色号</h2>
                <p className="text-sm text-gray-600 mt-1">商品：{selectedProduct.name} ({selectedProduct.code})</p>
              </div>
              <button
                onClick={handleCloseColorModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 色号列表 */}
              <BaseCard className="bg-gray-50" padding="md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">色号列表</h3>
                  <Button
                    onClick={() => handleOpenColorModal()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加色号
                  </Button>
                </div>
                {getColorsByProduct(selectedProduct.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>暂无色号，点击"添加色号"创建第一个色号</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getColorsByProduct(selectedProduct.id).map((color) => (
                      <BaseCard
                        key={color.id}
                        padding="md"
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {color.colorValue ? (
                            <div
                              className="w-10 h-10 rounded border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: color.colorValue }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Palette className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {color.code} {color.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              状态：<StatusBadge status={color.status} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenColorModal(color)}
                            className="p-1.5 hover:bg-gray-100 rounded-xl"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteColor(color.id)}
                            className="p-1.5 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </BaseCard>
                    ))}
                  </div>
                )}
              </BaseCard>

              {/* 添加/编辑色号表单 */}
              {isColorFormOpen && (
                <BaseCard padding="md">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingColor ? '编辑色号' : '添加色号'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        色号编码 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={colorFormData.code}
                        onChange={(e) => setColorFormData({ ...colorFormData, code: e.target.value })}
                        placeholder="请输入色号编码"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        色号名称 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={colorFormData.name}
                        onChange={(e) => setColorFormData({ ...colorFormData, name: e.target.value })}
                        placeholder="请输入色号名称"
                        className="w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        颜色值
                      </label>
                      <ColorPicker
                        value={colorFormData.colorValue || ''}
                        onChange={(color) => setColorFormData({ ...colorFormData, colorValue: color })}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {colorFormData.colorValue 
                          ? `选择颜色后，色号将显示为：${colorFormData.colorValue} ${colorFormData.name || '色号名称'}`
                          : '可选：点击调色盘选择颜色，或从预设颜色中选择'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                      <select
                        value={colorFormData.status}
                        onChange={(e) => setColorFormData({ ...colorFormData, status: e.target.value as '在售' | '停售' })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="在售">在售</option>
                        <option value="停售">停售</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                      <textarea
                        value={colorFormData.description}
                        onChange={(e) => setColorFormData({ ...colorFormData, description: e.target.value })}
                        placeholder="请输入色号描述"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                    <Button variant="outline" onClick={() => setIsColorFormOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSaveColor} className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                  </div>
                </BaseCard>
              )}
            </div>
          </BaseCard>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
