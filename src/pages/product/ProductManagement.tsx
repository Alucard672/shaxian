import { useState } from 'react'
import { useProductStore } from '@/store/productStore'
import { Product, Color, Batch } from '@/types/product'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import ProductModal from '../../components/product/ProductModal'
import ProductForm from '../../components/product/ProductForm'
import ColorForm from '../../components/product/ColorForm'
import BatchForm from '../../components/product/BatchForm'
import { Plus, Edit, Trash2, Eye, Palette, Package } from 'lucide-react'
import { ProductFormData, ColorFormData, BatchFormData } from '@/types/product'

function ProductManagement() {
  const {
    products,
    colors,
    batches,
    addProduct,
    updateProduct,
    deleteProduct,
    addColor,
    updateColor,
    deleteColor,
    addBatch,
    updateBatch,
    deleteBatch,
    getColorsByProduct,
    getBatchesByColor,
  } = useProductStore()

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isColorModalOpen, setIsColorModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')

  // 商品操作
  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsProductModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('确定要删除这个商品吗？删除后相关的色号和缸号也会被删除。')) {
      deleteProduct(id)
    }
  }

  const handleProductSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data)
    } else {
      addProduct(data)
    }
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  // 色号操作
  const handleAddColor = (product: Product) => {
    setSelectedProduct(product)
    setEditingColor(null)
    setIsColorModalOpen(true)
  }

  const handleEditColor = (color: Color) => {
    const product = products.find((p) => p.id === color.productId)
    setSelectedProduct(product || null)
    setEditingColor(color)
    setIsColorModalOpen(true)
  }

  const handleDeleteColor = (id: string) => {
    if (confirm('确定要删除这个色号吗？删除后相关的缸号也会被删除。')) {
      deleteColor(id)
    }
  }

  const handleColorSubmit = (data: ColorFormData) => {
    if (!selectedProduct) return
    
    if (editingColor) {
      updateColor(editingColor.id, data)
    } else {
      addColor(selectedProduct.id, data)
    }
    setIsColorModalOpen(false)
    setEditingColor(null)
    setSelectedProduct(null)
  }

  // 缸号操作
  const handleAddBatch = (color: Color) => {
    setSelectedColor(color)
    setEditingBatch(null)
    setIsBatchModalOpen(true)
  }

  const handleEditBatch = (batch: Batch) => {
    const color = colors.find((c) => c.id === batch.colorId)
    setSelectedColor(color || null)
    setEditingBatch(batch)
    setIsBatchModalOpen(true)
  }

  const handleDeleteBatch = (id: string) => {
    if (confirm('确定要删除这个缸号吗？')) {
      deleteBatch(id)
    }
  }

  const handleBatchSubmit = (data: BatchFormData) => {
    if (!selectedColor) return
    
    if (editingBatch) {
      updateBatch(editingBatch.id, data)
    } else {
      addBatch(selectedColor.id, data)
    }
    setIsBatchModalOpen(false)
    setEditingBatch(null)
    setSelectedColor(null)
  }

  // 查看商品详情
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setViewMode('detail')
  }

  // 表格列定义
  const productColumns = [
    {
      key: 'code',
      title: '商品编码',
      dataIndex: 'code' as keyof Product,
    },
    {
      key: 'name',
      title: '商品名称',
      dataIndex: 'name' as keyof Product,
    },
    {
      key: 'type',
      title: '商品类型',
      render: (_: any, record: Product) => (
        <Badge variant="primary">{record.type}</Badge>
      ),
    },
    {
      key: 'specification',
      title: '规格',
      dataIndex: 'specification' as keyof Product,
    },
    {
      key: 'unit',
      title: '单位',
      dataIndex: 'unit' as keyof Product,
    },
    {
      key: 'colors',
      title: '色号数量',
      render: (_: any, record: Product) => {
        const productColors = getColorsByProduct(record.id)
        return productColors.length
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
            onClick={() => handleViewProduct(record)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(record)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(record.id)}
          >
            <Trash2 className="w-4 h-4 text-danger-500" />
          </Button>
        </div>
      ),
    },
  ]

  // 商品详情视图
  if (viewMode === 'detail' && selectedProduct) {
    const productColors = getColorsByProduct(selectedProduct.id)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setViewMode('list')
                setSelectedProduct(null)
              }}
            >
              ← 返回列表
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedProduct.name}
              </h1>
              <p className="text-gray-600">{selectedProduct.code}</p>
            </div>
          </div>
          <Button onClick={() => handleAddColor(selectedProduct)}>
            <Plus className="w-4 h-4 mr-2" />
            添加色号
          </Button>
        </div>

        <Card title="商品信息">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">商品类型</div>
              <div className="font-medium">{selectedProduct.type}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">规格</div>
              <div className="font-medium">{selectedProduct.specification || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">成分</div>
              <div className="font-medium">{selectedProduct.composition || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">单位</div>
              <div className="font-medium">{selectedProduct.unit}</div>
            </div>
          </div>
        </Card>

        <Card
          title={`色号列表 (${productColors.length})`}
          actions={
            <Button onClick={() => handleAddColor(selectedProduct)}>
              <Plus className="w-4 h-4 mr-2" />
              添加色号
            </Button>
          }
        >
          {productColors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无色号</p>
          ) : (
            <div className="space-y-4">
              {productColors.map((color) => {
                const colorBatches = getBatchesByColor(color.id)
                const totalStock = colorBatches.reduce(
                  (sum, batch) => sum + batch.stockQuantity,
                  0
                )
                
                return (
                  <div
                    key={color.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {color.colorValue && (
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color.colorValue }}
                          />
                        )}
                        <div>
                          <div className="font-medium">{color.name}</div>
                          <div className="text-sm text-gray-600">{color.code}</div>
                        </div>
                        <Badge
                          variant={color.status === '在售' ? 'success' : 'gray'}
                        >
                          {color.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBatch(color)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          添加缸号
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditColor(color)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteColor(color.id)}
                        >
                          <Trash2 className="w-4 h-4 text-danger-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      库存总量: {totalStock} {selectedProduct.unit}
                    </div>
                    
                    {colorBatches.length > 0 && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          缸号列表 ({colorBatches.length})
                        </div>
                        <div className="space-y-2">
                          {colorBatches.map((batch) => (
                            <div
                              key={batch.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-medium">{batch.code}</span>
                                <span className="text-gray-600">
                                  库存: {batch.stockQuantity} {selectedProduct.unit}
                                </span>
                                {batch.stockLocation && (
                                  <span className="text-gray-600">
                                    位置: {batch.stockLocation}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBatch(batch)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBatch(batch.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-danger-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    )
  }

  // 商品列表视图
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">商品管理</h1>
          <p className="text-gray-600">管理商品、色号、缸号三层结构</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="w-4 h-4 mr-2" />
          新建商品
        </Button>
      </div>

      <Card>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无商品，请添加商品</p>
        ) : (
          <Table columns={productColumns} data={products} />
        )}
      </Card>

      {/* 商品表单弹窗 */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setEditingProduct(null)
        }}
        title={editingProduct ? '编辑商品' : '新建商品'}
      >
        <ProductForm
          initialData={editingProduct || undefined}
          onSubmit={handleProductSubmit}
          onCancel={() => {
            setIsProductModalOpen(false)
            setEditingProduct(null)
          }}
        />
      </ProductModal>

      {/* 色号表单弹窗 */}
      <ProductModal
        isOpen={isColorModalOpen}
        onClose={() => {
          setIsColorModalOpen(false)
          setEditingColor(null)
          setSelectedProduct(null)
        }}
        title={editingColor ? '编辑色号' : '新建色号'}
      >
        <ColorForm
          initialData={editingColor || undefined}
          onSubmit={handleColorSubmit}
          onCancel={() => {
            setIsColorModalOpen(false)
            setEditingColor(null)
            setSelectedProduct(null)
          }}
        />
      </ProductModal>

      {/* 缸号表单弹窗 */}
      <ProductModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false)
          setEditingBatch(null)
          setSelectedColor(null)
        }}
        title={editingBatch ? '编辑缸号' : '新建缸号'}
      >
        <BatchForm
          initialData={editingBatch || undefined}
          onSubmit={handleBatchSubmit}
          onCancel={() => {
            setIsBatchModalOpen(false)
            setEditingBatch(null)
            setSelectedColor(null)
          }}
        />
      </ProductModal>
    </div>
  )
}

export default ProductManagement
