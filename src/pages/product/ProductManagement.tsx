import { useState, useMemo } from 'react'
import { useProductStore } from '@/store/productStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Product } from '@/types/product'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import ProductModal from '../../components/product/ProductModal'
import ProductForm from '../../components/product/ProductForm'
import ProductDetail from '../../components/product/ProductDetail'
import { Plus, Eye, Edit, Trash2, Package, Palette, Layers, Download, Search, MoreVertical, Check, Copy } from 'lucide-react'
import Tooltip from '../../components/ui/Tooltip'
import { ProductFormData } from '@/types/product'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

function ProductManagement() {
  const {
    products,
    colors,
    batches,
    addProduct,
    updateProduct,
    deleteProduct,
    getColorsByProduct,
  } = useProductStore()
  const { systemParams } = useSettingsStore()

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<'all' | 'white' | 'dyed'>('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const pageSize = 10

  // 统计数据
  const stats = useMemo(() => {
    const totalProducts = products.length
    const totalColors = colors.length
    const totalBatches = batches.length
    const totalInventory = batches.reduce((sum, b) => sum + b.stockQuantity, 0)
    
    return {
      totalProducts,
      totalColors,
      totalBatches,
      totalInventory,
    }
  }, [products, colors, batches])

  // 筛选商品
  const filteredProducts = useMemo(() => {
    let filtered = products
    
    // 如果染色加工流程未启用，过滤掉白坯商品
    if (!systemParams.enableDyeingProcess) {
      filtered = filtered.filter((p) => !p.isWhiteYarn)
    }
    
    // 类型筛选
    if (filterType === 'white') {
      filtered = filtered.filter((p) => p.isWhiteYarn === true)
    } else if (filterType === 'dyed') {
      filtered = filtered.filter((p) => !p.isWhiteYarn)
    }
    
    // 搜索筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.code.toLowerCase().includes(keyword) ||
          p.specification?.toLowerCase().includes(keyword) ||
          p.composition?.toLowerCase().includes(keyword)
      )
    }
    
    return filtered
  }, [products, searchKeyword, filterType, systemParams.enableDyeingProcess])

  // 分页数据
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredProducts.slice(start, end)
  }, [filteredProducts, currentPage])

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

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setIsDetailModalOpen(true)
  }

  const handleCopyProduct = (product: Product) => {
    // 复制商品信息，打开编辑模态框并预设数据
    const timestamp = Date.now().toString().slice(-4)
    const copiedProduct: Product = {
      ...product,
      id: '', // 清空ID，作为新商品
      name: `${product.name} (副本)`,
      code: `${product.code}-COPY${timestamp}`, // 添加时间戳确保唯一性
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditingProduct(copiedProduct)
    setIsProductModalOpen(true)
  }

  const handleProductSubmit = (data: ProductFormData) => {
    if (editingProduct && editingProduct.id) {
      // 编辑模式：更新商品
      updateProduct(editingProduct.id, data)
    } else {
      // 新建模式或复制模式：创建新商品
      addProduct(data)
    }
    setIsProductModalOpen(false)
    setEditingProduct(null)
  }

  // 表格列定义
  const productColumns = [
    {
      key: 'select',
      title: '',
      width: '72px',
      render: (_: any, record: Product) => (
        <div className="flex items-center justify-center h-20">
          <input
            type="checkbox"
            checked={selectedProducts.has(record.id)}
            onChange={(e) => handleSelectProduct(record.id, e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </div>
      ),
    },
    {
      key: 'code',
      title: '商品编码',
      width: '99px',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-900">{record.code}</span>
      ),
    },
    {
      key: 'name',
      title: '商品名称',
      width: '186px',
      render: (_: any, record: Product) => {
        const isWhite = record.isWhiteYarn === true
        return (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-900">{record.name}</span>
            {isWhite && (
              <Badge variant="warning" className="text-xs">白坯</Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'specification',
      title: '规格',
      width: '82px',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-500">{record.specification || '-'}</span>
      ),
    },
    {
      key: 'composition',
      title: '成分',
      width: '154px',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-500">{record.composition || '-'}</span>
      ),
    },
    {
      key: 'count',
      title: '支数',
      width: '82px',
      render: (_: any, record: Product) => (
        <span className="text-sm text-gray-500">{record.count || '-'}</span>
      ),
    },
    {
      key: 'colors',
      title: '色号数',
      width: '90px',
      render: (_: any, record: Product) => {
        const productColors = getColorsByProduct(record.id)
        return (
          <Badge variant="gray" className="inline-flex items-center gap-1">
            <Palette className="w-3 h-3" />
            <span>{productColors.length}</span>
          </Badge>
        )
      },
    },
    {
      key: 'batches',
      title: '缸号数',
      width: '91px',
      render: (_: any, record: Product) => {
        const productColors = getColorsByProduct(record.id)
        const colorIds = productColors.map((c) => c.id)
        const productBatches = batches.filter((b) => colorIds.includes(b.colorId))
        return (
          <Badge variant="gray" className="inline-flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{productBatches.length}</span>
          </Badge>
        )
      },
    },
    {
      key: 'inventory',
      title: '库存总量',
      width: '100px',
      render: (_: any, record: Product) => {
        const productColors = getColorsByProduct(record.id)
        const colorIds = productColors.map((c) => c.id)
        const productBatches = batches.filter((b) => colorIds.includes(b.colorId))
        const totalStock = productBatches.reduce((sum, b) => sum + b.stockQuantity, 0)
        return <span className="text-sm text-gray-900">{totalStock} {record.unit || 'kg'}</span>
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '93px',
      render: (_: any, record: Product) => (
        <Badge variant="success" className="bg-green-100 text-green-700">正常</Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '148px',
      render: (_: any, record: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewProduct(record)}
            title="查看"
            className="p-1"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditProduct(record)}
            title="编辑"
            className="p-1"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyProduct(record)}
            title="复制"
            className="p-1"
          >
            <Copy className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(record.id)}
            title="删除"
            className="p-1"
          >
            <Trash2 className="w-4 h-4 text-danger-500" />
          </Button>
        </div>
      ),
    },
  ]

  // 统计卡片 - 变化指标基于实际数据，数据为空时不显示变化
  const statCards = [
    {
      label: '商品总数',
      value: stats.totalProducts.toString(),
      change: null, // 暂时不显示变化，等有历史数据后再计算
      icon: Package,
      iconBg: 'bg-blue-100',
      changeBg: 'bg-green-100',
      changeColor: 'text-green-600',
    },
    {
      label: '色号总数',
      value: stats.totalColors.toLocaleString(),
      change: null,
      icon: Palette,
      iconBg: 'bg-purple-100',
      changeBg: 'bg-green-100',
      changeColor: 'text-green-600',
    },
    {
      label: '缸号总数',
      value: stats.totalBatches.toLocaleString(),
      change: null,
      icon: Layers,
      iconBg: 'bg-green-100',
      changeBg: 'bg-green-100',
      changeColor: 'text-green-600',
    },
    {
      label: '库存总量',
      value: stats.totalInventory > 0 
        ? `${(stats.totalInventory / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} kg`
        : '0 kg',
      change: null,
      icon: Package,
      iconBg: 'bg-orange-100',
      changeBg: 'bg-green-100',
      changeColor: 'text-green-600',
    },
  ]

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(paginatedProducts.map((p) => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  // 处理单个商品选择
  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900">商品管理</h1>
        <Tooltip
          content={
            <div>
              <div className="font-medium text-gray-900 mb-2">关于三层结构</div>
              <div className="text-sm text-gray-700 leading-relaxed">
                <span className="font-medium">商品</span>：基础商品信息（如"精梳棉纱 32支"） →{' '}
                <span className="font-medium">色号</span>：该商品的不同颜色 →{' '}
                <span className="font-medium">缸号</span>：同一色号的不同生产批次，每个缸号有独立的库存和价格
              </div>
            </div>
          }
        />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className="p-4 border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                {card.change && (
                  <div className={`text-xs px-1.5 py-0.5 ${card.changeBg} ${card.changeColor} rounded font-medium`}>
                    {card.change}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 mb-1">{card.label}</div>
              <div className="text-base font-semibold text-gray-900">{card.value}</div>
            </Card>
          )
        })}
      </div>

      {/* 操作栏 */}
      <Card className="p-4 border-gray-200 rounded-2xl">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 筛选按钮组 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 h-9 rounded-xl text-sm font-medium transition-colors',
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              全部
            </button>
            {systemParams.enableDyeingProcess && (
              <button
                onClick={() => setFilterType('white')}
                className={cn(
                  'px-4 h-9 rounded-xl text-sm font-medium transition-colors',
                  filterType === 'white'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                白坯纱线
              </button>
            )}
            <button
              onClick={() => setFilterType('dyed')}
              className={cn(
                'px-4 h-9 rounded-xl text-sm font-medium transition-colors',
                filterType === 'dyed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              已染色
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[300px] max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品名称、编码..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-9 border-gray-300 rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            <Button
              onClick={handleAddProduct}
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建商品
            </Button>
          </div>
        </div>
      </Card>

      {/* 商品列表表格 */}
      <Card className="p-0 border-gray-200 rounded-2xl overflow-hidden">
        {paginatedProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword ? '未找到匹配的商品' : '暂无商品，请添加商品'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {productColumns.map((column) => (
                      <th
                        key={column.key}
                        className="px-6 py-4 text-left text-sm font-bold text-gray-700"
                        style={{ width: column.width }}
                      >
                        {column.key === 'select' ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={
                                paginatedProducts.length > 0 &&
                                paginatedProducts.every((p) => selectedProducts.has(p.id))
                              }
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </div>
                        ) : (
                          column.title
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {productColumns.map((column) => {
                        return (
                          <td
                            key={column.key}
                            className="px-6 py-5 text-sm"
                            style={{ width: column.width }}
                          >
                            {column.render
                              ? (column.render as any)(null, record, index)
                              : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 px-6 py-4">
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                totalText={`共 ${filteredProducts.length} 个商品`}
              />
            </div>
          </>
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

      {/* 商品详情弹窗 */}
      {isDetailModalOpen && viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsDetailModalOpen(false)
              setViewingProduct(null)
            }}
          />
          {/* 详情内容 */}
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <ProductDetail
              product={viewingProduct}
              onEdit={() => {
                setIsDetailModalOpen(false)
                setEditingProduct(viewingProduct)
                setIsProductModalOpen(true)
                setViewingProduct(null)
              }}
              onDelete={() => {
                if (confirm('确定要删除这个商品吗？删除后相关的色号和缸号也会被删除。')) {
                  deleteProduct(viewingProduct.id)
                  setIsDetailModalOpen(false)
                  setViewingProduct(null)
                }
              }}
              onClose={() => {
                setIsDetailModalOpen(false)
                setViewingProduct(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
