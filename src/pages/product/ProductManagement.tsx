import { useState, useEffect } from 'react'
import { useProductStore } from '@/store/productStore'
import { Product, Color } from '@/types/product'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { Plus, Edit, Trash2, Save, Package, Search, Palette } from 'lucide-react'

function ProductManagement() {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
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
    type: '原料' as '原料' | '半成品' | '成品',
    isWhiteYarn: false,
    description: '',
    auxiliaryUnit: '',
    unitWeight: 0,
    enableDualUnit: false,
  })

  useEffect(() => {
    loadProducts()
    loadColors()
  }, [loadProducts, loadColors])

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
        auxiliaryUnit: product.auxiliaryUnit || '',
        unitWeight: product.unitWeight || 0,
        enableDualUnit: product.enableDualUnit || false,
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
        type: '原料',
        isWhiteYarn: false,
        description: '',
        auxiliaryUnit: '',
        unitWeight: 0,
        enableDualUnit: false,
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
      type: '原料',
      isWhiteYarn: false,
      description: '',
      auxiliaryUnit: '',
      unitWeight: 0,
      enableDualUnit: false,
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
    setColorFormData({
      code: '',
      name: '',
      colorValue: '',
      description: '',
      status: '在售',
    })
  }

  const handleOpenColorModal = (color?: Color) => {
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

    try {
      if (editingColor) {
        await updateColor(editingColor.id, colorFormData)
        alert('色号更新成功')
      } else {
        await addColor(selectedProduct.id, colorFormData)
        alert('色号创建成功')
      }
      await loadColors(selectedProduct.id)
      handleOpenColorModal()
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
      (product.specification && product.specification.toLowerCase().includes(keyword))
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
      key: 'specification',
      title: '规格',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.specification || '-'}</span>
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
      key: 'type',
      title: '类型',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-600">{record.type}</span>
      ),
    },
    {
      key: 'enableDualUnit',
      title: '双单位',
      render: (_: any, record: Product) => (
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
          {record.enableDualUnit ? '启用' : '未启用'}
        </span>
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
        <Button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建商品
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索商品名称、编码、规格..."
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
          <Table columns={columns} data={filteredProducts} rowKey={(record) => record.id} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">规格</label>
                  <Input
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                    placeholder="请输入规格"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">支数</label>
                  <Input
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                    placeholder="请输入支数"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="ton">ton</option>
                    <option value="斤">斤</option>
                    <option value="件">件</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">商品类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as '原料' | '半成品' | '成品' })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="原料">原料</option>
                    <option value="半成品">半成品</option>
                    <option value="成品">成品</option>
                  </select>
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
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enableDualUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, enableDualUnit: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">启用双单位</span>
                  </label>
                </div>
                {formData.enableDualUnit && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">辅助单位</label>
                      <Input
                        value={formData.auxiliaryUnit}
                        onChange={(e) =>
                          setFormData({ ...formData, auxiliaryUnit: e.target.value })
                        }
                        placeholder="如：件、包"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">单件重量</label>
                      <Input
                        type="number"
                        value={formData.unitWeight}
                        onChange={(e) =>
                          setFormData({ ...formData, unitWeight: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="请输入单件重量"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
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
                <Trash2 className="w-5 h-5 text-gray-400" />
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
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {color.code} - {color.name}
                            </div>
                            {color.colorValue && (
                              <div className="text-xs text-gray-500 mt-1">
                                色值：{color.colorValue}
                              </div>
                            )}
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
              {editingColor !== null && (
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">色值</label>
                      <Input
                        value={colorFormData.colorValue}
                        onChange={(e) => setColorFormData({ ...colorFormData, colorValue: e.target.value })}
                        placeholder="请输入色值（如：#FF0000）"
                        className="w-full"
                      />
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
                    <Button variant="outline" onClick={() => handleOpenColorModal()}>
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
