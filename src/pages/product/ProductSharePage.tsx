import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { publicProductShareApi } from '@/api/client'
import { Product } from '@/types/product'
import { Package, Hash, Ruler, Weight, FileText, Building2, Grid3x3, Image as ImageIcon, X } from 'lucide-react'

function ProductSharePage() {
  const { code } = useParams<{ code: string }>()
  const [searchParams] = useSearchParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // 从 URL 同步 tenantId 到 localStorage，供公开接口 getByCode 使用（解决扫码后“过期”因缺 tenantId 导致解析失败）
  useEffect(() => {
    const tenantId = searchParams.get('tenantId')
    if (tenantId) {
      const current = localStorage.getItem('currentTenantId')
      if (!current) localStorage.setItem('currentTenantId', tenantId)
    }
  }, [searchParams])

  useEffect(() => {
    const loadData = async () => {
      if (!code) return
      setLoading(true)
      try {
        const data: any = await (publicProductShareApi as any).getByCode(code)
        if (data) {
          const mapped: Product = {
            ...data,
            id: String(data.id),
            type: (data.type as any) || '纱线',
          }
          setProduct(mapped)
        }
      } catch (e) {
        // ignore, handled by !product view
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F3F5] flex items-center justify-center">
        <div className="text-center text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F2F3F5] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">商品未找到</h2>
          <p className="text-gray-500">分享码无效或已过期</p>
        </div>
      </div>
    )
  }

  const images = product.images || []

  return (
    <div className="min-h-screen bg-[#F2F3F5] py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                款号：{product.code}
              </span>
              {product.type && (
                <span className="flex items-center gap-1">
                  <Grid3x3 className="w-4 h-4" />
                  类型：{product.type}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    <img
                      src={images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setSelectedImageIndex(0)}
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="aspect-square bg-gray-50 rounded border border-gray-100 overflow-hidden hover:border-blue-500 transition-colors"
                          onClick={() => setSelectedImageIndex(idx)}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                    <div className="text-sm">暂无图片</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  基本信息
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-400 text-xs">款号</div>
                      <div className="text-gray-900">{product.code}</div>
                    </div>
                  </div>
                  {product.unit && (
                    <div className="flex items-start gap-2">
                      <Ruler className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">单位</div>
                        <div className="text-gray-900">{product.unit}</div>
                      </div>
                    </div>
                  )}
                  {product.count && (
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">支数</div>
                        <div className="text-gray-900">{product.count}</div>
                      </div>
                    </div>
                  )}
                  {product.weight && (
                    <div className="flex items-start gap-2">
                      <Weight className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">克重</div>
                        <div className="text-gray-900">{product.weight}</div>
                      </div>
                    </div>
                  )}
                  {product.specification && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">规格</div>
                        <div className="text-gray-900">{product.specification}</div>
                      </div>
                    </div>
                  )}
                  {product.composition && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">成分</div>
                        <div className="text-gray-900">{product.composition}</div>
                      </div>
                    </div>
                  )}
                  {product.manufacturer && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400 text-xs">厂家</div>
                        <div className="text-gray-900">{product.manufacturer}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className="text-sm font-medium text-gray-900 mb-2">描述</div>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImageIndex(null)
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={images[selectedImageIndex]}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default ProductSharePage

