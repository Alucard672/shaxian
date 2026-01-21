import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '@/store/productStore'
import { Product, Color, Batch } from '@/types/product'
import { templateApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { ArrowLeft, Printer, Package, Search, Plus, X, Barcode, Settings, FileText } from 'lucide-react'
import { generateBarcodeHTML, generateBarcodeHTMLFromTemplate, openPrintDialog } from '@/utils/barcodeService'
import { BarcodeTemplate, DataSourceType } from '@/types/barcodeTemplate'

interface SelectedItem {
  product: Product
  color?: Color
  batch?: Batch
  quantity: number
}

function BarcodePrint() {
  const navigate = useNavigate()
  const { products, colors, batches, loadProducts, loadColors, loadBatches } = useProductStore()
  
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [barcodeDataSource, setBarcodeDataSource] = useState<DataSourceType>('barcodeValue')  // 条码数据源
  const [showTemplateTypeModal, setShowTemplateTypeModal] = useState(false)  // 模板类型选择对话框
  const [barcodeSettings, setBarcodeSettings] = useState({
    width: 2,
    height: 60,
    format: 'CODE128' as 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39',
    displayValue: true,
    fontSize: 14,
    textMargin: 2,
    margin: 10,
  })

  useEffect(() => {
    loadProducts()
    loadColors()
    loadBatches()
    loadTemplates()
  }, [loadProducts, loadColors, loadBatches])

  const loadTemplates = async () => {
    try {
      const data = await templateApi.getAll()
      const barcodeTemplates = data.filter((t: any) => t.documentType === '条码打印')
      setTemplates(barcodeTemplates)
      // 如果有默认模板，自动选择
      const defaultTemplate = barcodeTemplates.find((t: any) => t.isDefault)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
        // 从模板加载设置
        if (defaultTemplate.barcodeSettings) {
          setBarcodeSettings(defaultTemplate.barcodeSettings)
        }
      }
    } catch (error: any) {
      console.error('Failed to load templates:', error)
    }
  }

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
      // 如果已存在，增加数量
      const newItems = [...selectedItems]
      newItems[existingIndex].quantity += 1
      setSelectedItems(newItems)
    } else {
      // 添加新项
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

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      alert('请至少选择一个商品')
      return
    }

    // 检查是否选择了模板
    if (selectedTemplateId) {
      const template = templates.find((t: any) => t.id === selectedTemplateId)
      if (template && template.barcodeTemplate) {
        // 使用新模板系统，但覆盖条码元素的数据源
        const modifiedTemplate = {
          ...template.barcodeTemplate,
          elements: template.barcodeTemplate.elements.map((el: any) => {
            if (el.type === 'barcode') {
              return {
                ...el,
                dataSource: barcodeDataSource  // 使用用户选择的数据源
              }
            }
            return el
          })
        }
        const html = generateBarcodeHTMLFromTemplate(selectedItems, modifiedTemplate)
        openPrintDialog(html)
        return
      }
    }

    // 使用旧设置系统（兼容性）
    const html = generateBarcodeHTML(selectedItems, barcodeSettings)
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
                        // 如果有缸号，让用户选择缸号
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
            <p className="text-sm text-gray-600 mt-1">选择商品并打印条码</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const templateType = prompt(
                '请选择要创建的模板类型：\n\n1. 单据模板（销售单、进货单等）\n2. 条码模板（商品条码标签）\n\n请输入序号（1或2）：',
                '2'
              )
              
              if (templateType === '1') {
                navigate('/settings/print/template/new')
              } else if (templateType === '2') {
                navigate('/settings/print/barcode-template/new')
              }
            }}
            className="px-4 py-2 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            新建模板
          </Button>
          <Button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            打印条码
          </Button>
        </div>
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

        {/* 右侧：已选商品和设置 */}
        <div className="space-y-4">
          {/* 模板选择 */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">打印模板</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateTypeModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50"
                title="新建模板"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">新建模板</span>
              </Button>
            </div>
            {templates.length > 0 ? (
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value)
                  const template = templates.find((t: any) => t.id === e.target.value)
                  if (template && template.barcodeSettings) {
                    setBarcodeSettings(template.barcodeSettings)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">使用默认设置</option>
                {templates.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 mb-2">
                暂无条码打印模板，点击右上角图标创建模板
              </div>
            )}
          </div>

          {/* 条码设置 */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">条码设置</h3>
            <div className="space-y-3">
              {/* 数据源选择 - 只在选择了模板时显示 */}
              {selectedTemplateId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">条码数据源</label>
                  <select
                    value={barcodeDataSource}
                    onChange={(e) => setBarcodeDataSource(e.target.value as DataSourceType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="barcodeValue">条码值（商品编码-色号-缸号）</option>
                    <option value="productCode">商品编码</option>
                    <option value="productName">商品名称</option>
                    <option value="colorCode">色号编码</option>
                    <option value="colorName">色号名称</option>
                    <option value="batchCode">缸号编码</option>
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    选择条码内容的数据源，将覆盖模板中的设置
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">条码格式</label>
                <select
                  value={barcodeSettings.format}
                  onChange={(e) =>
                    setBarcodeSettings({
                      ...barcodeSettings,
                      format: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="CODE128">CODE128</option>
                  <option value="EAN13">EAN13</option>
                  <option value="EAN8">EAN8</option>
                  <option value="CODE39">CODE39</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">宽度</label>
                  <Input
                    type="number"
                    value={barcodeSettings.width}
                    onChange={(e) =>
                      setBarcodeSettings({
                        ...barcodeSettings,
                        width: parseFloat(e.target.value) || 2,
                      })
                    }
                    className="w-full"
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">高度</label>
                  <Input
                    type="number"
                    value={barcodeSettings.height}
                    onChange={(e) =>
                      setBarcodeSettings({
                        ...barcodeSettings,
                        height: parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-full"
                    min={20}
                    max={200}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={barcodeSettings.displayValue}
                    onChange={(e) =>
                      setBarcodeSettings({
                        ...barcodeSettings,
                        displayValue: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">显示条码值</span>
                </label>
              </div>
            </div>
          </div>

          {/* 已选商品列表 */}
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

      {/* 模板类型选择对话框 */}
      {showTemplateTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">选择模板类型</h3>
            <p className="text-sm text-gray-600 mb-6">请选择要创建的模板类型</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSelectTemplateType('document')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">单据模板</div>
                    <div className="text-sm text-gray-500">用于销售单、进货单等单据打印</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleSelectTemplateType('barcode')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Barcode className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">条码模板</div>
                    <div className="text-sm text-gray-500">用于商品条码标签打印</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowTemplateTypeModal(false)}
                className="px-4"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BarcodePrint

