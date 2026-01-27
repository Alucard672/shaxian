import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { publicProductApi } from '@/api/client'
import { Product, Color, Batch } from '@/types/product'
import { Package, Palette, Hash, Ruler, Weight, FileText, Building2, Grid3x3, Image as ImageIcon, X } from 'lucide-react'

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { getProduct, getColorsByProduct } = useProductStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [colors, setColors] = useState<Color[]>([])
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null)
  const [highlightedBatchId, setHighlightedBatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  
  // 从URL参数中获取租户ID（如果有），并设置到localStorage（仅用于API请求）
  useEffect(() => {
    const tenantId = searchParams.get('tenantId')
    if (tenantId) {
      // 临时设置租户ID，用于API请求（不设置其他认证信息）
      const currentTenantId = localStorage.getItem('currentTenantId')
      if (!currentTenantId) {
        localStorage.setItem('currentTenantId', tenantId)
      }
    }
  }, [searchParams])

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        // 优先使用公开API加载商品数据（不需要登录）
        try {
          const productData = await publicProductApi.getById(id)
          if (productData) {
            // 转换API返回的数据格式为前端Product类型
            const mappedProduct: Product = {
              ...productData,
              id: String(productData.id),
              type: productData.type || '纱线',
            }
            setProduct(mappedProduct)
            
            // 加载色号数据
            try {
              const colorsData = await publicProductApi.getColors(id)
              if (Array.isArray(colorsData)) {
                const mappedColors: Color[] = colorsData.map((c: any) => ({
                  ...c,
                  id: String(c.id),
                  productId: String(c.productId || id),
                  status: c.status || '在售',
                }))
                setColors(mappedColors)
                
                // 从URL参数中获取色号和缸号
                const colorId = searchParams.get('color')
                const batchId = searchParams.get('batch')
                
                if (colorId) {
                  const color = mappedColors.find(c => c.id === colorId)
                  if (color) {
                    setHighlightedColorId(colorId)
                    
                    // 如果有缸号，加载缸号数据
                    if (batchId) {
                      try {
                        const batchesData = await publicProductApi.getBatches(colorId)
                        if (Array.isArray(batchesData)) {
                          const batch = batchesData.find((b: any) => String(b.id) === batchId)
                          if (batch) {
                            setHighlightedBatchId(batchId)
                          }
                        }
                      } catch (error) {
                        console.warn('Failed to load batches:', error)
                      }
                    }
                  }
                } else if (batchId) {
                  // 如果有缸号但没有色号，需要先找到对应的色号
                  // 遍历所有色号查找包含该缸号的色号
                  for (const color of mappedColors) {
                    try {
                      const batchesData = await publicProductApi.getBatches(color.id)
                      if (Array.isArray(batchesData)) {
                        const batch = batchesData.find((b: any) => String(b.id) === batchId)
                        if (batch) {
                          setHighlightedBatchId(batchId)
                          setHighlightedColorId(color.id)
                          break
                        }
                      }
                    } catch (error) {
                      // 继续查找下一个色号
                    }
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to load colors:', error)
              // 即使色号加载失败，也显示商品基本信息
            }
          }
        } catch (error: any) {
          console.warn('Failed to load product from public API:', error)
          // 如果公开API失败，尝试从store中获取（可能已有缓存）
          const foundProduct = getProduct(id)
          if (foundProduct) {
            setProduct(foundProduct)
            const productColors = getColorsByProduct(id)
            setColors(productColors)
          } else {
            // 如果store中也没有，可能是未登录或数据不存在
            // 检查是否是401错误（未授权）
            if (error?.message?.includes('401') || error?.message?.includes('未授权')) {
              // 401错误：可能是需要登录，但公开访问应该不需要登录
              // 继续显示错误页面
            }
          }
        }
      } catch (error) {
        console.error('Failed to load product:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, searchParams, getProduct, getColorsByProduct])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">商品未找到</h2>
          <p className="text-gray-500 mb-4">该商品不存在或已被删除</p>
          <p className="text-sm text-gray-400">
            如果这是通过二维码访问的，请确保二维码链接正确
          </p>
        </div>
      </div>
    )
  }

  const images = product.images || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 头部信息 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                款号：{product.code}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                类型：{product.type}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：图片展示 */}
              <div>
                {images.length > 0 ? (
                  <div className="space-y-4">
                    {/* 主图 */}
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img
                        src={images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setSelectedImageIndex(0)}
                      />
                    </div>
                    {/* 缩略图 */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((img, index) => (
                          <div
                            key={index}
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <img
                              src={img}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                      <p>暂无图片</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：详细信息 */}
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    基本信息
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">款号</div>
                        <div className="text-base font-medium text-gray-900">{product.code}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">商品名称</div>
                        <div className="text-base font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                    {product.type && (
                      <div className="flex items-start gap-3">
                        <Grid3x3 className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">商品类型</div>
                          <div className="text-base font-medium text-gray-900">{product.type}</div>
                        </div>
                      </div>
                    )}
                    {product.unit && (
                      <div className="flex items-start gap-3">
                        <Ruler className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">单位</div>
                          <div className="text-base font-medium text-gray-900">{product.unit}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 规格信息 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Ruler className="w-5 h-5 text-blue-600" />
                    规格信息
                  </h2>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {product.count && (
                      <div className="flex items-start gap-3">
                        <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">支数</div>
                          <div className="text-base font-medium text-gray-900">{product.count}</div>
                        </div>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex items-start gap-3">
                        <Weight className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">克重</div>
                          <div className="text-base font-medium text-gray-900">{product.weight}</div>
                        </div>
                      </div>
                    )}
                    {product.width && (
                      <div className="flex items-start gap-3">
                        <Ruler className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">幅宽</div>
                          <div className="text-base font-medium text-gray-900">{product.width}</div>
                        </div>
                      </div>
                    )}
                    {product.specification && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">规格</div>
                          <div className="text-base font-medium text-gray-900">{product.specification}</div>
                        </div>
                      </div>
                    )}
                    {product.composition && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">成分</div>
                          <div className="text-base font-medium text-gray-900">{product.composition}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 其他信息 */}
                {(product.manufacturer || product.description) && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      其他信息
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {product.manufacturer && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-500">厂家</div>
                            <div className="text-base font-medium text-gray-900">{product.manufacturer}</div>
                          </div>
                        </div>
                      )}
                      {product.description && (
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-500">描述</div>
                            <div className="text-base text-gray-900 whitespace-pre-wrap">{product.description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 色号信息 */}
                {colors.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-blue-600" />
                      色号信息
                    </h2>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {colors.map((color) => {
                          const isHighlighted = highlightedColorId === color.id
                          return (
                            <div
                              key={color.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isHighlighted
                                  ? 'bg-blue-50 border-blue-500 shadow-md'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              {color.colorValue && (
                                <div
                                  className={`w-8 h-8 rounded border flex-shrink-0 ${
                                    isHighlighted ? 'border-blue-500' : 'border-gray-300'
                                  }`}
                                  style={{ backgroundColor: color.colorValue }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${
                                  isHighlighted ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {color.code}
                                </div>
                                {color.name && (
                                  <div className={`text-xs truncate ${
                                    isHighlighted ? 'text-blue-700' : 'text-gray-500'
                                  }`}>
                                    {color.name}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                {color.status === '在售' ? (
                                  <span className="text-green-600">在售</span>
                                ) : (
                                  <span className="text-gray-400">停售</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={images[selectedImageIndex]}
              alt={`${product.name} ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImageIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
