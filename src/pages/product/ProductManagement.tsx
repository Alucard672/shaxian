import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Product, Color } from '@/types/product'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import ManufacturerSelect from '@/components/ui/ManufacturerSelect'
import { Plus, Edit, Trash2, Save, Package, Search, Palette, Upload, X, Image as ImageIcon, Barcode } from 'lucide-react'
import ColorPicker from '@/components/ui/ColorPicker'

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
  
  const { units, loadUnits } = useSettingsStore()

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
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    specification: '',
    composition: '',
    count: '',
    unit: 'kg',
    type: '纱线' as '纱线' | '面料',
    isWhiteYarn: false,
    description: '',
    manufacturer: '', // 厂家
    needleType: '',
    width: '',
    weight: '',
    colorCode: '',
    images: [] as string[],
  })

  useEffect(() => {
    loadProducts()
    loadColors()
    loadUnits()
  }, [loadProducts, loadColors, loadUnits])

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
        type: product.type,
        isWhiteYarn: product.isWhiteYarn || false,
        description: product.description || '',
        manufacturer: product.manufacturer || '',
        needleType: product.needleType || '',
        width: product.width || '',
        weight: product.weight || '',
        colorCode: product.colorCode || '',
        images: product.images || [],
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        code: '',
        specification: '',
        composition: '',
        count: '',
        unit: 'kg',
        type: '纱线',
        isWhiteYarn: false,
        description: '',
        manufacturer: '',
        needleType: '',
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
    setFormData({
      name: '',
      code: '',
      specification: '',
      composition: '',
      count: '',
      unit: 'kg',
      type: '纱线',
      isWhiteYarn: false,
      description: '',
      manufacturer: '',
      needleType: '',
      width: '',
      weight: '',
      colorCode: '',
      images: [],
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('请填写商品名称和编码')
      return
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        alert('商品更新成功')
      } else {
        await addProduct(formData)
        alert('商品创建成功')
      }
      handleCloseModal()
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？删除后无法恢复。')) {
      return
    }

    try {
      await deleteProduct(id)
      alert('商品已删除')
    } catch (error: any) {
      alert('删除失败：' + (error.message || '未知错误'))
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
        colorValue: '',
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

    if (!colorFormData.colorValue || !colorFormData.colorValue.trim()) {
      alert('请选择颜色值')
      return
    }

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
      product.name.toLowerCase().includes(keyword) ||
      product.code.toLowerCase().includes(keyword) ||
      (product.composition && product.composition.toLowerCase().includes(keyword)) ||
      (product.needleType && product.needleType.toLowerCase().includes(keyword)) ||
      (product.colorCode && product.colorCode.toLowerCase().includes(keyword))
    )
  })

  const columns = [
    {
      key: 'name',
      title: '商品名称',
      render: (_: any, record: Product) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900">{record.name}</span>
            <div className="text-xs text-gray-500">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'needleType',
      title: '针型',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.needleType || '-'}</span>
      ),
    },
    {
      key: 'colorCode',
      title: '色号',
      render: (_: any, record: Product) => {
        if (!record.colorCode) return <span className="text-sm text-gray-600">-</span>
        // 查找对应的色号
        const color = colors.find((c) => c.id === record.colorCode)
        if (color) {
          return (
            <div className="flex items-center gap-2">
              {color.colorValue && (
                <div
                  className="w-5 h-5 rounded border border-gray-300"
                  style={{ backgroundColor: color.colorValue }}
                />
              )}
              <span className="text-sm text-gray-600">
                {color.code} {color.name}
              </span>
            </div>
          )
        }
        return <span className="text-sm text-gray-600">{record.colorCode}</span>
      },
    },
    {
      key: 'unit',
      title: '单位',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.unit}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.type}</span>
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
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">商品管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理商品、色号、缸号信息</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* 搜索栏 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索商品名称、编码、成分、针型、色号..."
            className="flex-1"
          />
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无商品，点击"新建商品"创建第一个商品</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={filteredProducts} rowKey={(record) => record.id} />
          </div>
        )}
      </div>

      {/* 新增/编辑商品弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingProduct ? '编辑商品' : '新建商品'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名称 <span className="text-red-500">*</span>
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
                    商品编码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="请输入商品编码"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">成分</label>
                  <Input
                    value={formData.composition}
                    onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                    placeholder="请输入成分"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">厂家</label>
                  <ManufacturerSelect
                    value={formData.manufacturer || ''}
                    onChange={(value) => setFormData({ ...formData, manufacturer: value })}
                    placeholder="输入拼音或中文搜索厂家，支持快速新增"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {units.filter(u => u.isEnabled).map((unit) => (
                      <option key={unit.id} value={unit.name}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">商品类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as '纱线' | '面料' })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="纱线">纱线</option>
                    <option value="面料">面料</option>
                  </select>
                </div>
                {/* 纱线类型字段 */}
                {formData.type === '纱线' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">针型</label>
                      <Input
                        value={formData.needleType}
                        onChange={(e) => setFormData({ ...formData, needleType: e.target.value })}
                        placeholder="请输入针型"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">支数</label>
                      <Input
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                        placeholder="请输入支数"
                        className="w-full"
                      />
                    </div>
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
                  </>
                )}
                {/* 面料类型字段 */}
                {formData.type === '面料' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">幅宽</label>
                      <Input
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                        placeholder="请输入幅宽"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">克重</label>
                      <Input
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="请输入克重"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
                <div>
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
                    <div className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500">
                      请先保存商品后再选择色号
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
          </div>
        </div>
      )}

      {/* 色号管理弹窗 */}
      {isColorModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="bg-gray-50 rounded-xl p-4">
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
                      <div
                        key={color.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
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
                              状态：<span className={color.status === '在售' ? 'text-green-600' : 'text-gray-600'}>{color.status}</span>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 添加/编辑色号表单 */}
              {isColorFormOpen && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
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
                        颜色值 <span className="text-red-500">*</span>
                      </label>
                      <ColorPicker
                        value={colorFormData.colorValue || '#000000'}
                        onChange={(color) => setColorFormData({ ...colorFormData, colorValue: color })}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        选择颜色后，色号将显示为：{colorFormData.colorValue || '#000000'} {colorFormData.name || '色号名称'}
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
