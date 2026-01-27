import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { useSettingsStore } from '@/store/settingsStore'
import { Product, Color, Batch } from '@/types/product'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { ArrowLeft, Printer, Package, Search, Plus, X, Barcode } from 'lucide-react'
import { generateFixedBarcodeHTML, openPrintDialog, type BarcodePaperSize } from '@/utils/barcodeService'
import { productShareApi } from '@/api/client'

const BARCODE_PAPER_KEY = 'barcode-paper-size'

const PAPER_PRESETS: { label: string; widthMm: number; heightMm: number }[] = [
  { label: '100×50 mm', widthMm: 100, heightMm: 50 },
  { label: '70×40 mm', widthMm: 70, heightMm: 40 },
  { label: '60×40 mm', widthMm: 60, heightMm: 40 },
  { label: '50×30 mm', widthMm: 50, heightMm: 30 },
  { label: '40×30 mm', widthMm: 40, heightMm: 30 },
  { label: '自定义', widthMm: 0, heightMm: 0 },
]

interface SelectedItem {
  product: Product
  color?: Color
  batch?: Batch
  shareCode?: string
  quantity: number
}

function BarcodePrint() {
  const navigate = useNavigate()
  const { products, colors, batches, loadProducts, loadColors, loadBatches } = useProductStore()
  const { storeInfo, loadStoreInfo } = useSettingsStore()
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')

  const loadPaperSize = (): BarcodePaperSize => {
    try {
      const raw = localStorage.getItem(BARCODE_PAPER_KEY)
      if (raw) {
        const o = JSON.parse(raw) as { widthMm?: number; heightMm?: number }
        if (typeof o?.widthMm === 'number' && typeof o?.heightMm === 'number' && o.widthMm >= 40 && o.heightMm >= 30) {
          return { widthMm: o.widthMm, heightMm: o.heightMm }
        }
      }
    } catch (_) {}
    return { widthMm: 100, heightMm: 50 }
  }

  const [paperSize, setPaperSize] = useState<BarcodePaperSize>(loadPaperSize)
  const [paperCustom, setPaperCustom] = useState({ widthMm: 100, heightMm: 50 })
  const [paperPresetIndex, setPaperPresetIndex] = useState(0)

  useEffect(() => {
    loadProducts()
    loadColors()
    loadBatches()
    loadStoreInfo()
  }, [loadProducts, loadColors, loadBatches, loadStoreInfo])

  useEffect(() => {
    const loaded = loadPaperSize()
    const idx = PAPER_PRESETS.findIndex(
      (p) => p.widthMm === loaded.widthMm && p.heightMm === loaded.heightMm
    )
    setPaperPresetIndex(idx >= 0 ? idx : PAPER_PRESETS.length - 1)
    if (idx < 0) setPaperCustom(loaded)
  }, [])

  // 从URL参数中获取商品ID，如果有则自动添加
  useEffect(() => {
    if (products.length > 0 && selectedItems.length === 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const productId = urlParams.get('productId')
      if (productId) {
        const product = products.find(p => p.id === productId)
        if (product) {
          setSelectedItems([{
            product,
            quantity: 1,
          }])
        }
      }
    }
  }, [products.length])

  const handleAddItem = (product: Product, color?: Color, batch?: Batch) => {
    const existingIndex = selectedItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.color?.id === color?.id &&
        item.batch?.id === batch?.id
    )

    if (existingIndex >= 0) {
      const newItems = [...selectedItems]
      newItems[existingIndex].quantity += 1
      setSelectedItems(newItems)
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product,
          color,
          batch,
          quantity: 1,
        },
      ])
    }
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...selectedItems]
    newItems[index].quantity = Math.max(1, quantity)
    setSelectedItems(newItems)
  }

  const applyPaperSize = (size: BarcodePaperSize) => {
    setPaperSize(size)
    try {
      localStorage.setItem(BARCODE_PAPER_KEY, JSON.stringify(size))
    } catch (_) {}
  }

  const handlePaperPresetChange = (idx: number) => {
    setPaperPresetIndex(idx)
    const p = PAPER_PRESETS[idx]
    if (p.widthMm > 0 && p.heightMm > 0) {
      const size = { widthMm: p.widthMm, heightMm: p.heightMm }
      setPaperCustom(size)
      applyPaperSize(size)
    } else {
      setPaperCustom(paperSize)
    }
  }

  const handlePaperCustomChange = (field: 'widthMm' | 'heightMm', v: number) => {
    const next = { ...paperCustom, [field]: Math.max(field === 'widthMm' ? 40 : 30, Math.min(300, v)) }
    setPaperCustom(next)
    applyPaperSize(next)
  }

  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      alert('请至少选择一个商品')
      return
    }
    const size = paperPresetIndex === PAPER_PRESETS.length - 1 ? paperCustom : paperSize

    // 打印前为每个商品生成分享码（免登录扫码查看）
    const uniqueProductIds = Array.from(new Set(selectedItems.map((it) => it.product.id)))
    const shareCodeMap = new Map<string, string>()
    const shareErrors: Array<{ productId: string; message: string }> = []
    try {
      await Promise.all(
        uniqueProductIds.map(async (pid) => {
          try {
            const res: any = await (productShareApi as any).generateShareCode(pid)
            const code = res?.shareCode || res?.data?.shareCode || res?.share_code
            if (code) {
              shareCodeMap.set(pid, String(code))
            } else {
              shareErrors.push({
                productId: String(pid),
                message: '后端返回的分享码为空',
              })
            }
          } catch (e: any) {
            const errMsg = e?.message || '生成分享码失败'
            shareErrors.push({
              productId: String(pid),
              message: errMsg,
            })
            console.error(`商品 ${pid} 分享码生成失败:`, e)
          }
        })
      )
    } catch (e) {
      console.error('批量生成分享码时发生错误:', e)
    }

    // 如果分享码全部生成失败，提示用户（否则二维码会退化为需要登录的链接）
    if (shareCodeMap.size === 0) {
      const errorDetails = shareErrors.length > 0 
        ? `\n\n错误详情：${shareErrors.map(e => `商品 ${e.productId}: ${e.message}`).join('\n')}`
        : ''
      const shouldContinue = confirm(
        `生成商品分享码失败，二维码将无法免登录查看。${errorDetails}\n\n` +
        `可能原因：\n` +
        `1. 后端服务异常（500错误）\n` +
        `2. 数据库操作失败\n` +
        `3. 会话已过期\n\n` +
        `是否仍要继续打印？（二维码将使用旧链接，扫码后需要登录）`
      )
      if (!shouldContinue) {
        return
      }
    } else if (shareErrors.length > 0) {
      console.warn('部分商品分享码生成失败：', shareErrors)
      alert(
        `警告：${shareErrors.length} 个商品的分享码生成失败，这些商品的二维码将无法免登录查看。\n\n` +
        `失败的商品：${shareErrors.map(e => e.productId).join(', ')}`
      )
    }

    const itemsWithShare = selectedItems.map((it) => ({
      ...it,
      shareCode: shareCodeMap.get(it.product.id) || it.shareCode,
    }))

    const html = await generateFixedBarcodeHTML(itemsWithShare, storeInfo, size)
    openPrintDialog(html)
  }

  const filteredProducts = products.filter((product) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      product.name.toLowerCase().includes(keyword) ||
      product.code.toLowerCase().includes(keyword)
    )
  })

  const getColorsByProduct = (productId: string) => {
    return colors.filter((c) => c.productId === productId)
  }

  const getBatchesByColor = (colorId: string) => {
    return batches.filter((b) => b.colorId === colorId)
  }

  const columns = [
    {
      key: 'product',
      title: '商品信息',
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
      key: 'actions',
      title: '操作',
      render: (_: any, record: Product) => {
        const productColors = getColorsByProduct(record.id)
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddItem(record)}
              className="p-1.5 hover:bg-blue-50 rounded-xl"
            >
              <Plus className="w-4 h-4 text-blue-600" />
            </Button>
            {productColors.length > 0 && (
              <select
                onChange={(e) => {
                  const colorId = e.target.value
                  if (colorId) {
                    const color = productColors.find((c) => c.id === colorId)
                    if (color) {
                      const colorBatches = getBatchesByColor(color.id)
                      if (colorBatches.length > 0) {
                        const batchId = prompt('请输入缸号ID（可选）')
                        if (batchId) {
                          const batch = colorBatches.find((b) => b.id === batchId)
                          handleAddItem(record, color, batch)
                        } else {
                          handleAddItem(record, color)
                        }
                      } else {
                        handleAddItem(record, color)
                      }
                    }
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-200 rounded"
              >
                <option value="">选择色号</option>
                {productColors.map((color) => (
                  <option key={color.id} value={color.id}>
                    {color.code} - {color.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )
      },
    },
  ]

  const selectedColumns = [
    {
      key: 'info',
      title: '商品信息',
      render: (_: any, record: SelectedItem, index: number) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{record.product.name}</div>
          <div className="text-xs text-gray-500">{record.product.code}</div>
          {record.color && (
            <div className="text-xs text-gray-500">
              色号：{record.color.colorValue ? `${record.color.colorValue} ${record.color.name}` : `${record.color.code} - ${record.color.name}`}
            </div>
          )}
          {record.batch && (
            <div className="text-xs text-gray-500">缸号：{record.batch.code}</div>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      title: '打印数量',
      render: (_: any, record: SelectedItem, index: number) => (
        <Input
          type="number"
          value={record.quantity}
          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
          className="w-20"
          min={1}
        />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: SelectedItem, index: number) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveItem(index)}
          className="p-1.5 hover:bg-red-50 rounded-xl"
        >
          <X className="w-4 h-4 text-red-600" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">条码打印</h1>
            <p className="text-sm text-gray-600 mt-1">选择商品并打印条码标签</p>
          </div>
        </div>
        <Button
          onClick={handlePrint}
          disabled={selectedItems.length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Printer className="w-4 h-4 mr-2" />
          打印条码
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：商品列表 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索商品名称、编码..."
                className="flex-1"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>暂无商品</p>
                </div>
              ) : (
                <Table columns={columns} data={filteredProducts} rowKey={(record) => record.id} />
              )}
            </div>
          </div>
        </div>

        {/* 右侧：纸张设置 + 已选商品列表 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">纸张设置</h3>
            <p className="text-sm text-gray-500 mb-3">按实际标签纸尺寸设置，打印时与打印机纸张一致。</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">纸张尺寸</label>
                <div className="flex flex-wrap gap-2">
                  {PAPER_PRESETS.map((p, idx) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handlePaperPresetChange(idx)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        paperPresetIndex === idx
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {paperPresetIndex === PAPER_PRESETS.length - 1 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">宽度 (mm)</label>
                    <Input
                      type="number"
                      value={paperCustom.widthMm}
                      onChange={(e) => handlePaperCustomChange('widthMm', Number(e.target.value) || 40)}
                      min={40}
                      max={300}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">高度 (mm)</label>
                    <Input
                      type="number"
                      value={paperCustom.heightMm}
                      onChange={(e) => handlePaperCustomChange('heightMm', Number(e.target.value) || 30)}
                      min={30}
                      max={300}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400">
                当前：{paperPresetIndex === PAPER_PRESETS.length - 1 ? paperCustom.widthMm : paperSize.widthMm} × {paperPresetIndex === PAPER_PRESETS.length - 1 ? paperCustom.heightMm : paperSize.heightMm} mm
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              已选商品 ({selectedItems.length})
            </h3>
            {selectedItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Barcode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>请从左侧选择商品</p>
              </div>
            ) : (
              <Table
                columns={selectedColumns}
                data={selectedItems}
                rowKey={(_, index) => index.toString()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodePrint
