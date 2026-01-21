import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { templateApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { 
  Save, ArrowLeft, Barcode, Type, Image, Minus, Square, 
  Eye, Trash2, Copy, Move, RotateCw, Settings, Table, X, Plus
} from 'lucide-react'
import { BarcodeTemplate, BarcodeElement, BarcodeElementType, DataSourceType, BarcodeFormat, TextAlign, FontStyle } from '@/types/barcodeTemplate'

function BarcodeTemplateEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isNew = id === 'new'
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elementX: 0, elementY: 0 })
  
  const [formData, setFormData] = useState<BarcodeTemplate>({
    id: '',
    name: '',
    description: '',
    isDefault: false,
    pageWidth: 100,      // 默认100mm（标签纸宽度）
    pageHeight: 50,      // 默认50mm（标签纸高度）
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate(id)
    }
  }, [id, isNew])

  // 监听键盘事件，支持Delete键删除元素
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框、文本区域或选择框中，不删除元素
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault()
        handleDeleteElement(selectedElementId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedElementId])

  const loadTemplate = async (templateId: string) => {
    setLoading(true)
    try {
      const data = await templateApi.getById(templateId)
      if (data.barcodeTemplate) {
        setFormData(data.barcodeTemplate)
      }
    } catch (error: any) {
      console.error('Failed to load template:', error)
      alert('加载模板失败：' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入模板名称')
      return
    }

    setLoading(true)
    try {
      const saveData = {
        name: formData.name,
        description: formData.description,
        isDefault: formData.isDefault,
        documentType: '条码打印',
        barcodeTemplate: formData,
      }

      if (isNew) {
        await templateApi.create(saveData)
        alert('模板创建成功')
      } else if (id) {
        await templateApi.update(id, saveData)
        alert('模板更新成功')
      }
      navigate('/settings/print')
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddElement = (type: BarcodeElementType) => {
    const newElement: BarcodeElement = {
      id: `element-${Date.now()}`,
      type,
      x: 10,
      y: 10,
      width: type === 'barcode' ? 60 : type === 'text' ? 30 : 20,
      height: type === 'barcode' ? 20 : type === 'text' ? 5 : 20,
      visible: true,
      zIndex: formData.elements.length,
    }

    // 根据类型设置默认属性
    if (type === 'text') {
      newElement.text = '文本'
      newElement.textParts = [{ type: 'static', content: '文本' }]  // 默认一个静态文本片段
      newElement.fontSize = 12
      newElement.fontFamily = 'Arial'
      newElement.fontStyle = 'normal'
      newElement.color = '#000000'
      newElement.textAlign = 'left'
      newElement.dataSource = 'static'
    } else if (type === 'barcode') {
      newElement.barcodeFormat = 'CODE128'
      newElement.barcodeWidth = 2
      newElement.barcodeHeight = 20
      newElement.displayValue = true
      newElement.fontSizeBarcode = 10
      newElement.dataSource = 'barcodeValue'
    } else if (type === 'line') {
      newElement.strokeColor = '#000000'
      newElement.strokeWidth = 1
      newElement.lineAngle = 0  // 默认水平线
      // 水平线：宽度30mm，高度设为线条宽度+0.2mm（让辅助框更贴合线条）
      newElement.width = 30
      newElement.height = (newElement.strokeWidth || 1) * 0.264583 + 0.2  // 将磅转换为mm，并加一点边距
    } else if (type === 'rectangle') {
      newElement.strokeColor = '#000000'
      newElement.strokeWidth = 1
      newElement.fillColor = 'transparent'
    } else if (type === 'table') {
      newElement.tableColumns = ['productCode', 'productName']
      newElement.tableColumnWidths = [30, 30]  // 默认每列宽度
      newElement.tableRows = 3
      newElement.tableRowHeights = [10, 10, 10]  // 默认每行高度
      newElement.showHeader = true
      newElement.borderWidth = 1
      newElement.borderColor = '#000000'
      newElement.strokeColor = '#000000'
      newElement.width = 60
      newElement.height = 30
    }

    setFormData({
      ...formData,
      elements: [...formData.elements, newElement],
    })
    setSelectedElementId(newElement.id)
  }

  const handleDeleteElement = (elementId: string) => {
    setFormData({
      ...formData,
      elements: formData.elements.filter(el => el.id !== elementId),
    })
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const handleDuplicateElement = (elementId: string) => {
    const element = formData.elements.find(el => el.id === elementId)
    if (element) {
      const newElement: BarcodeElement = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 5,
        y: element.y + 5,
      }
      setFormData({
        ...formData,
        elements: [...formData.elements, newElement],
      })
      setSelectedElementId(newElement.id)
    }
  }

  const handleUpdateElement = (elementId: string, updates: Partial<BarcodeElement>) => {
    setFormData({
      ...formData,
      elements: formData.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    })
  }

  const selectedElement = selectedElementId ? formData.elements.find(el => el.id === selectedElementId) : null

  // 毫米转像素（假设1mm = 3.779527559像素，96 DPI）
  const mmToPx = (mm: number) => mm * 3.779527559

  // 像素转毫米
  const pxToMm = (px: number) => px / 3.779527559

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    // 检查是否点击了缩放控制点
    const target = e.target as HTMLElement
    if (target.classList.contains('resize-handle')) {
      const handle = target.getAttribute('data-handle')
      if (handle) {
        setResizeHandle(handle)
        setIsResizing(true)
        const element = formData.elements.find(el => el.id === elementId)
        if (element) {
          setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: element.width,
            height: element.height,
            elementX: element.x,
            elementY: element.y,
          })
        }
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }
    
    // 允许点击元素本身或其子元素来拖动
    if (target.closest('.barcode-element') && !target.closest('.resize-handle')) {
      setSelectedElementId(elementId)
      setIsDragging(true)
      const rect = canvasRef.current?.getBoundingClientRect()
      const element = formData.elements.find(el => el.id === elementId)
      if (rect && element) {
        // 计算鼠标相对于元素左上角的偏移
        const elementRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setDragStart({
          x: e.clientX - elementRect.left,
          y: e.clientY - elementRect.top,
        })
      }
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing && selectedElementId && resizeHandle && canvasRef.current) {
      const element = formData.elements.find(el => el.id === selectedElementId)
      if (!element) return
      
      const deltaX = pxToMm(e.clientX - resizeStart.x)
      const deltaY = pxToMm(e.clientY - resizeStart.y)
      
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.elementX
      let newY = resizeStart.elementY
      
      // 根据不同的控制点调整大小和位置
      if (resizeHandle.includes('e')) { // 右边缘
        newWidth = Math.max(1, resizeStart.width + deltaX)
      }
      if (resizeHandle.includes('w')) { // 左边缘
        newWidth = Math.max(1, resizeStart.width - deltaX)
        newX = resizeStart.elementX + deltaX
      }
      if (resizeHandle.includes('s')) { // 下边缘
        newHeight = Math.max(1, resizeStart.height + deltaY)
      }
      if (resizeHandle.includes('n')) { // 上边缘
        newHeight = Math.max(1, resizeStart.height - deltaY)
        newY = resizeStart.elementY + deltaY
      }
      
      // 限制在画布范围内
      newWidth = Math.min(newWidth, formData.pageWidth - newX)
      newHeight = Math.min(newHeight, formData.pageHeight - newY)
      newX = Math.max(0, Math.min(newX, formData.pageWidth - newWidth))
      newY = Math.max(0, Math.min(newY, formData.pageHeight - newHeight))
      
      handleUpdateElement(selectedElementId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      })
    } else if (isDragging && selectedElementId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      // 计算新位置，考虑鼠标相对于元素的偏移
      const x = pxToMm(e.clientX - rect.left - dragStart.x)
      const y = pxToMm(e.clientY - rect.top - dragStart.y)
      
      handleUpdateElement(selectedElementId, {
        x: Math.max(0, Math.min(x, formData.pageWidth - (selectedElement?.width || 0))),
        y: Math.max(0, Math.min(y, formData.pageHeight - (selectedElement?.height || 0))),
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧工具栏 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">模板信息</h3>
            <div className="space-y-2">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="模板名称"
                className="w-full"
              />
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述（可选）"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">页面设置</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">宽度 (mm)</label>
                <Input
                  type="number"
                  value={formData.pageWidth}
                  onChange={(e) => setFormData({ ...formData, pageWidth: parseFloat(e.target.value) || 100 })}
                  className="w-full"
                  min={10}
                  max={500}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">高度 (mm)</label>
                <Input
                  type="number"
                  value={formData.pageHeight}
                  onChange={(e) => setFormData({ ...formData, pageHeight: parseFloat(e.target.value) || 50 })}
                  className="w-full"
                  min={10}
                  max={500}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">添加元素</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('text')}
                className="flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                文本
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('barcode')}
                className="flex items-center gap-2"
              >
                <Barcode className="w-4 h-4" />
                条码
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('image')}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                图片
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('line')}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                线条
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('rectangle')}
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                矩形
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('table')}
                className="flex items-center gap-2"
              >
                <Table className="w-4 h-4" />
                表格
              </Button>
            </div>
          </div>

          {/* 字段选择 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">字段选择</h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">点击字段应用到选中元素：</div>
              <div className="space-y-1">
                {[
                  { label: '商品编码', value: 'productCode' },
                  { label: '商品名称', value: 'productName' },
                  { label: '色号编码', value: 'colorCode' },
                  { label: '色号名称', value: 'colorName' },
                  { label: '缸号编码', value: 'batchCode' },
                  { label: '条码值', value: 'barcodeValue' },
                  { label: '静态文本', value: 'static' },
                ].map((field) => (
                  <button
                    key={field.value}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (selectedElement) {
                        if (selectedElement.type === 'text') {
                          // 如果是文本元素，添加到textParts数组
                          const currentParts = selectedElement.textParts || []
                          if (field.value === 'static') {
                            // 添加静态文本片段
                            const newParts = [...currentParts, { type: 'static' as const, content: '' }]
                            handleUpdateElement(selectedElement.id, { textParts: newParts })
                          } else {
                            // 添加字段片段
                            const newParts = [...currentParts, { type: 'field' as const, content: field.value }]
                            handleUpdateElement(selectedElement.id, { textParts: newParts })
                          }
                        } else if (selectedElement.type === 'barcode') {
                          handleUpdateElement(selectedElement.id, { 
                            dataSource: field.value === 'static' ? 'barcodeValue' : field.value as DataSourceType
                          })
                        }
                      } else {
                        alert('请先选择一个元素')
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors ${
                      selectedElement && selectedElement.dataSource === field.value
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    } ${!selectedElement ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={!selectedElement}
                  >
                    <span className="text-gray-700">{field.label}</span>
                    <code className="text-blue-600">{field.value}</code>
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                提示：选中元素后点击字段即可应用
              </div>
            </div>
          </div>

          {selectedElement && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">元素属性</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">X (mm)</label>
                    <Input
                      type="text"
                      value={selectedElement.x.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          handleUpdateElement(selectedElement.id, { x: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value < 0) {
                          handleUpdateElement(selectedElement.id, { x: 0 })
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Y (mm)</label>
                    <Input
                      type="text"
                      value={selectedElement.y.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          handleUpdateElement(selectedElement.id, { y: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value < 0) {
                          handleUpdateElement(selectedElement.id, { y: 0 })
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">宽度 (mm)</label>
                    <Input
                      type="text"
                      value={selectedElement.width.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value > 0) {
                          handleUpdateElement(selectedElement.id, { width: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value <= 0) {
                          handleUpdateElement(selectedElement.id, { width: 1 })
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">高度 (mm)</label>
                    <Input
                      type="text"
                      value={selectedElement.height.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value > 0) {
                          handleUpdateElement(selectedElement.id, { height: value })
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value <= 0) {
                          handleUpdateElement(selectedElement.id, { height: 1 })
                        }
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">文本内容（支持混合静态文本和字段）</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(() => {
                          // 兼容旧版本：如果没有textParts，从dataSource和text创建
                          let textParts = selectedElement.textParts || []
                          if (textParts.length === 0) {
                            if (selectedElement.dataSource === 'static') {
                              textParts = [{ type: 'static', content: selectedElement.text || '文本' }]
                            } else if (selectedElement.dataSource) {
                              textParts = [{ type: 'field', content: selectedElement.dataSource }]
                            } else {
                              textParts = [{ type: 'static', content: '文本' }]
                            }
                          }
                          
                          return textParts.map((part, index) => (
                            <div key={index} className="flex items-center gap-1 p-2 bg-gray-50 rounded border border-gray-200">
                              <select
                                value={part.type}
                                onChange={(e) => {
                                  const newParts = [...textParts]
                                  newParts[index] = {
                                    type: e.target.value as 'static' | 'field',
                                    content: part.content
                                  }
                                  handleUpdateElement(selectedElement.id, { textParts: newParts })
                                }}
                                className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                              >
                                <option value="static">静态文本</option>
                                <option value="field">字段</option>
                              </select>
                              {part.type === 'static' ? (
                                <Input
                                  value={part.content}
                                  onChange={(e) => {
                                    const newParts = [...textParts]
                                    newParts[index] = { ...part, content: e.target.value }
                                    handleUpdateElement(selectedElement.id, { textParts: newParts })
                                  }}
                                  placeholder="输入文本"
                                  className="flex-1 text-xs"
                                />
                              ) : (
                                <select
                                  value={part.content}
                                  onChange={(e) => {
                                    const newParts = [...textParts]
                                    newParts[index] = { ...part, content: e.target.value }
                                    handleUpdateElement(selectedElement.id, { textParts: newParts })
                                  }}
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                >
                                  <option value="productCode">商品编码</option>
                                  <option value="productName">商品名称</option>
                                  <option value="colorCode">色号编码</option>
                                  <option value="colorName">色号名称</option>
                                  <option value="batchCode">缸号编码</option>
                                  <option value="barcodeValue">条码值</option>
                                </select>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newParts = textParts.filter((_, i) => i !== index)
                                  handleUpdateElement(selectedElement.id, { 
                                    textParts: newParts.length > 0 ? newParts : [{ type: 'static', content: '' }]
                                  })
                                }}
                                className="p-1 text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))
                        })()}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentParts = selectedElement.textParts || []
                            const newParts = [...currentParts, { type: 'static' as const, content: '' }]
                            handleUpdateElement(selectedElement.id, { textParts: newParts })
                          }}
                          className="w-full text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加片段
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        提示：可以添加多个片段，每个片段可以是静态文本或字段
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">字体大小</label>
                        <Input
                          type="number"
                          value={selectedElement.fontSize || 12}
                          onChange={(e) => {
                            const size = parseInt(e.target.value) || 1
                            handleUpdateElement(selectedElement.id, { fontSize: Math.max(1, size) })
                          }}
                          className="w-full"
                          min={1}
                          max={72}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">字体样式</label>
                        <select
                          value={selectedElement.fontStyle || 'normal'}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { fontStyle: e.target.value as FontStyle })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        >
                          <option value="normal">正常</option>
                          <option value="bold">加粗</option>
                          <option value="italic">斜体</option>
                          <option value="bold italic">加粗斜体</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">对齐</label>
                        <select
                          value={selectedElement.textAlign || 'left'}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { textAlign: e.target.value as TextAlign })}
                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                        >
                          <option value="left">左对齐</option>
                          <option value="center">居中</option>
                          <option value="right">右对齐</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">颜色</label>
                      <Input
                        type="color"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { color: e.target.value })}
                        className="w-full h-8"
                      />
                    </div>
                  </>
                )}

                {selectedElement.type === 'barcode' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-600">条码格式</label>
                      <select
                        value={selectedElement.barcodeFormat || 'CODE128'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { barcodeFormat: e.target.value as BarcodeFormat })}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
                      >
                        <option value="CODE128">CODE128</option>
                        <option value="EAN13">EAN13</option>
                        <option value="EAN8">EAN8</option>
                        <option value="CODE39">CODE39</option>
                        <option value="ITF14">ITF14</option>
                        <option value="MSI">MSI</option>
                        <option value="pharmacode">pharmacode</option>
                        <option value="codabar">codabar</option>
                        <option value="QRCODE">QRCODE (二维码)</option>
                      </select>
                    </div>
                    {selectedElement.barcodeFormat !== 'QRCODE' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">条码宽度</label>
                          <Input
                            type="text"
                            value={selectedElement.barcodeWidth || 2}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value)
                              if (!isNaN(value) && value > 0) {
                                handleUpdateElement(selectedElement.id, { barcodeWidth: value })
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value)
                              if (isNaN(value) || value <= 0) {
                                handleUpdateElement(selectedElement.id, { barcodeWidth: 2 })
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">条码高度</label>
                          <Input
                            type="text"
                            value={selectedElement.barcodeHeight || 20}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value)
                              if (!isNaN(value) && value > 0) {
                                handleUpdateElement(selectedElement.id, { barcodeHeight: value })
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value)
                              if (isNaN(value) || value <= 0) {
                                handleUpdateElement(selectedElement.id, { barcodeHeight: 20 })
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                    {selectedElement.barcodeFormat === 'QRCODE' && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        提示：QR码是方形，将根据元素的宽度和高度自动调整大小
                      </div>
                    )}
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedElement.displayValue !== false}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { displayValue: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-600">显示条码值</span>
                      </label>
                    </div>
                  </>
                )}

                {selectedElement.type === 'line' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-600">角度（度）</label>
                      <Input
                        type="text"
                        value={selectedElement.lineAngle || 0}
                        onChange={(e) => {
                          const angle = parseFloat(e.target.value) || 0
                          const normalizedAngle = ((angle % 360) + 360) % 360
                          // 当角度改变时，自动调整宽高以适应线条
                          const currentWidth = selectedElement.width || 30
                          const currentHeight = selectedElement.height || 1
                          
                          let newWidth = currentWidth
                          let newHeight = currentHeight
                          
                          // 计算线条宽度（转换为mm）
                          const strokeWidth = selectedElement.strokeWidth || 1
                          const strokeWidthMm = strokeWidth * 0.264583  // 1pt = 0.264583mm
                          const minSize = strokeWidthMm + 0.2  // 线条宽度 + 0.2mm边距
                          
                          // 如果是水平线（0或180度），高度应该等于线条宽度+边距
                          if (normalizedAngle === 0 || normalizedAngle === 180) {
                            newHeight = minSize
                            newWidth = currentWidth || 30
                          }
                          // 如果是垂直线（90或270度），宽度应该等于线条宽度+边距
                          else if (normalizedAngle === 90 || normalizedAngle === 270) {
                            newWidth = minSize
                            newHeight = currentHeight || 30
                          }
                          // 其他角度，保持对角线长度
                          else {
                            const diagonal = Math.sqrt(currentWidth * currentWidth + currentHeight * currentHeight)
                            const radians = (normalizedAngle * Math.PI) / 180
                            newWidth = Math.abs(diagonal * Math.cos(radians))
                            newHeight = Math.abs(diagonal * Math.sin(radians))
                            // 确保最小尺寸
                            if (newWidth < 1) newWidth = 1
                            if (newHeight < 1) newHeight = 1
                          }
                          
                          handleUpdateElement(selectedElement.id, { 
                            lineAngle: normalizedAngle,
                            width: newWidth,
                            height: newHeight
                          })
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value)
                          if (isNaN(value)) {
                            handleUpdateElement(selectedElement.id, { lineAngle: 0 })
                          }
                        }}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        0°=水平，90°=垂直，180°=水平（反向）
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">线条长度 (mm)</label>
                      <Input
                        type="text"
                        value={(() => {
                          const angle = selectedElement.lineAngle || 0
                          const normalizedAngle = ((angle % 360) + 360) % 360
                          const width = selectedElement.width || 30
                          const height = selectedElement.height || 1
                          
                          // 计算线条实际长度
                          if (normalizedAngle === 0 || normalizedAngle === 180) {
                            return width.toFixed(2)
                          } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                            return height.toFixed(2)
                          } else {
                            return Math.sqrt(width * width + height * height).toFixed(2)
                          }
                        })()}
                        onChange={(e) => {
                          const length = parseFloat(e.target.value) || 30
                          const angle = selectedElement.lineAngle || 0
                          const normalizedAngle = ((angle % 360) + 360) % 360
                          
                          let newWidth = selectedElement.width || 30
                          let newHeight = selectedElement.height || 1
                          
                          // 计算线条宽度（转换为mm）
                          const strokeWidth = selectedElement.strokeWidth || 1
                          const strokeWidthMm = strokeWidth * 0.264583  // 1pt = 0.264583mm
                          const minSize = strokeWidthMm + 0.2  // 线条宽度 + 0.2mm边距
                          
                          if (normalizedAngle === 0 || normalizedAngle === 180) {
                            // 水平线
                            newWidth = length
                            newHeight = minSize
                          } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                            // 垂直线
                            newWidth = minSize
                            newHeight = length
                          } else {
                            // 其他角度，保持角度不变，调整对角线长度
                            const radians = (normalizedAngle * Math.PI) / 180
                            newWidth = Math.abs(length * Math.cos(radians))
                            newHeight = Math.abs(length * Math.sin(radians))
                            if (newWidth < 1) newWidth = 1
                            if (newHeight < 1) newHeight = 1
                          }
                          
                          handleUpdateElement(selectedElement.id, { 
                            width: newWidth,
                            height: newHeight
                          })
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value)
                          if (isNaN(value) || value <= 0) {
                            handleUpdateElement(selectedElement.id, { width: 30, height: 1 })
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">线条颜色</label>
                      <Input
                        type="color"
                        value={selectedElement.strokeColor || '#000000'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { strokeColor: e.target.value })}
                        className="w-full h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        线条粗细 (pt)
                        <span className="text-gray-400 ml-1">
                          (当前: {(selectedElement.strokeWidth || 1).toFixed(1)}pt ≈ {((selectedElement.strokeWidth || 1) * 0.264583).toFixed(2)}mm)
                        </span>
                      </label>
                      {/* 滑块 */}
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={selectedElement.strokeWidth || 1}
                        onChange={(e) => {
                          const strokeWidth = parseFloat(e.target.value) || 1
                          const strokeWidthMm = strokeWidth * 0.264583  // 1pt = 0.264583mm
                          const minSize = strokeWidthMm + 0.2  // 线条宽度 + 0.2mm边距
                          
                          const angle = selectedElement.lineAngle || 0
                          const normalizedAngle = ((angle % 360) + 360) % 360
                          
                          let newWidth = selectedElement.width || 30
                          let newHeight = selectedElement.height || 1
                          
                          // 根据角度调整辅助框大小
                          if (normalizedAngle === 0 || normalizedAngle === 180) {
                            // 水平线：只调整高度
                            newHeight = minSize
                          } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                            // 垂直线：只调整宽度
                            newWidth = minSize
                          }
                          
                          handleUpdateElement(selectedElement.id, { 
                            strokeWidth: strokeWidth,
                            width: newWidth,
                            height: newHeight
                          })
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-2"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((selectedElement.strokeWidth || 1) - 0.5) / 9.5 * 100}%, #e5e7eb ${((selectedElement.strokeWidth || 1) - 0.5) / 9.5 * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      {/* 数值输入框 */}
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={selectedElement.strokeWidth || 1}
                          onChange={(e) => {
                            const strokeWidth = parseFloat(e.target.value) || 1
                            if (!isNaN(strokeWidth) && strokeWidth > 0) {
                              const strokeWidthMm = strokeWidth * 0.264583
                              const minSize = strokeWidthMm + 0.2
                              
                              const angle = selectedElement.lineAngle || 0
                              const normalizedAngle = ((angle % 360) + 360) % 360
                              
                              let newWidth = selectedElement.width || 30
                              let newHeight = selectedElement.height || 1
                              
                              if (normalizedAngle === 0 || normalizedAngle === 180) {
                                newHeight = minSize
                              } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                                newWidth = minSize
                              }
                              
                              handleUpdateElement(selectedElement.id, { 
                                strokeWidth: strokeWidth,
                                width: newWidth,
                                height: newHeight
                              })
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value)
                            if (isNaN(value) || value <= 0) {
                              handleUpdateElement(selectedElement.id, { strokeWidth: 1 })
                            }
                          }}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500">pt</span>
                      </div>
                      {/* 快速选择按钮 */}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500 mr-1">快速选择:</span>
                        {[0.5, 1, 2, 3, 5].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const strokeWidthMm = size * 0.264583
                              const minSize = strokeWidthMm + 0.2
                              
                              const angle = selectedElement.lineAngle || 0
                              const normalizedAngle = ((angle % 360) + 360) % 360
                              
                              let newWidth = selectedElement.width || 30
                              let newHeight = selectedElement.height || 1
                              
                              if (normalizedAngle === 0 || normalizedAngle === 180) {
                                newHeight = minSize
                              } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                                newWidth = minSize
                              }
                              
                              handleUpdateElement(selectedElement.id, { 
                                strokeWidth: size,
                                width: newWidth,
                                height: newHeight
                              })
                            }}
                            className={`px-2 py-1 text-xs rounded border ${
                              (selectedElement.strokeWidth || 1) === size
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {size}pt
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedElement.type === 'table' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">表格列（数据源字段）</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {(selectedElement.tableColumns || []).map((col, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <select
                              value={col}
                              onChange={(e) => {
                                const newColumns = [...(selectedElement.tableColumns || [])]
                                newColumns[index] = e.target.value
                                handleUpdateElement(selectedElement.id, { tableColumns: newColumns })
                              }}
                              className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                            >
                              <option value="productCode">商品编码</option>
                              <option value="productName">商品名称</option>
                              <option value="colorCode">色号编码</option>
                              <option value="colorName">色号名称</option>
                              <option value="batchCode">缸号编码</option>
                              <option value="barcodeValue">条码值</option>
                            </select>
                            <Input
                              type="number"
                              value={selectedElement.tableColumnWidths?.[index] || 30}
                              onChange={(e) => {
                                const newWidths = [...(selectedElement.tableColumnWidths || [])]
                                newWidths[index] = parseFloat(e.target.value) || 30
                                handleUpdateElement(selectedElement.id, { tableColumnWidths: newWidths })
                              }}
                              placeholder="宽度"
                              className="w-16 px-1 py-1 text-xs"
                              min={5}
                              max={200}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newColumns = (selectedElement.tableColumns || []).filter((_, i) => i !== index)
                                const newWidths = (selectedElement.tableColumnWidths || []).filter((_, i) => i !== index)
                                handleUpdateElement(selectedElement.id, { 
                                  tableColumns: newColumns,
                                  tableColumnWidths: newWidths
                                })
                              }}
                              className="p-1 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newColumns = [...(selectedElement.tableColumns || []), 'productCode']
                            const newWidths = [...(selectedElement.tableColumnWidths || []), 30]
                            handleUpdateElement(selectedElement.id, { 
                              tableColumns: newColumns,
                              tableColumnWidths: newWidths
                            })
                          }}
                          className="w-full text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          添加列
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">表格行高度（mm）</label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {Array.from({ length: selectedElement.tableRows || 3 }).map((_, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <span className="text-xs text-gray-600 w-8">行{index + 1}</span>
                            <Input
                              type="number"
                              value={selectedElement.tableRowHeights?.[index] || 10}
                              onChange={(e) => {
                                const newHeights = [...(selectedElement.tableRowHeights || [])]
                                newHeights[index] = parseFloat(e.target.value) || 10
                                handleUpdateElement(selectedElement.id, { tableRowHeights: newHeights })
                              }}
                              className="flex-1 px-2 py-1 text-xs"
                              min={5}
                              max={100}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">行数</label>
                        <Input
                          type="number"
                          value={selectedElement.tableRows || 3}
                          onChange={(e) => {
                            const rows = parseInt(e.target.value) || 3
                            const currentHeights = selectedElement.tableRowHeights || []
                            const newHeights = Array.from({ length: rows }, (_, i) => currentHeights[i] || 10)
                            handleUpdateElement(selectedElement.id, { 
                              tableRows: rows,
                              tableRowHeights: newHeights
                            })
                          }}
                          className="w-full"
                          min={1}
                          max={20}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">边框宽度</label>
                        <Input
                          type="number"
                          value={selectedElement.borderWidth || 1}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) || 1 })}
                          className="w-full"
                          min={0}
                          max={5}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">边框颜色</label>
                      <Input
                        type="color"
                        value={selectedElement.borderColor || '#000000'}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { borderColor: e.target.value })}
                        className="w-full h-8"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedElement.showHeader !== false}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { showHeader: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-600">显示表头</span>
                      </label>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateElement(selectedElement.id)}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="flex-1 text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 中间画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/settings/print')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {isNew ? '新建条码模板' : '编辑条码模板'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        </div>

        {/* 画布 */}
        <div 
          className="flex-1 overflow-auto p-8 bg-gray-100"
          style={{ cursor: isDragging ? 'grabbing' : (isResizing ? 'grabbing' : 'default') }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={canvasRef}
            className="bg-white shadow-lg mx-auto"
            style={{
              width: `${mmToPx(formData.pageWidth)}px`,
              height: `${mmToPx(formData.pageHeight)}px`,
              position: 'relative',
            }}
          >
            {formData.elements.map((element) => {
              const isSelected = selectedElementId === element.id
              const isDraggingThis = isDragging && isSelected
              
              return (
              <div
                key={element.id}
                className={`barcode-element absolute border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 shadow-lg'
                    : 'border-transparent hover:border-gray-300'
                } ${
                  isDraggingThis 
                    ? 'opacity-80 shadow-2xl scale-105 border-blue-600' 
                    : ''
                }`}
                style={{
                  left: `${mmToPx(element.x)}px`,
                  top: `${mmToPx(element.y)}px`,
                  width: `${mmToPx(element.width)}px`,
                  height: `${mmToPx(element.height)}px`,
                  zIndex: isDraggingThis ? 1000 : (element.zIndex || 0),
                  cursor: isSelected ? 'grab' : 'move',
                  userSelect: 'none',
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === 'text' && (() => {
                  // 兼容旧版本：如果没有textParts，从dataSource和text创建
                  let textParts = element.textParts || []
                  if (textParts.length === 0) {
                    if (element.dataSource === 'static') {
                      textParts = [{ type: 'static', content: element.text || '文本' }]
                    } else if (element.dataSource) {
                      textParts = [{ type: 'field', content: element.dataSource }]
                    } else {
                      textParts = [{ type: 'static', content: '文本' }]
                    }
                  }
                  
                  return (
                    <div
                      className="w-full h-full flex items-center"
                      style={{
                        fontSize: `${Math.max(1, (element.fontSize || 12) * 0.75)}px`, // 转换为像素，最小1px
                        fontFamily: element.fontFamily || 'Arial',
                        fontWeight: element.fontStyle === 'bold' || element.fontStyle === 'bold italic' ? 'bold' : 'normal',
                        fontStyle: element.fontStyle === 'italic' || element.fontStyle === 'bold italic' ? 'italic' : 'normal',
                        color: element.color || '#000000',
                        textAlign: element.textAlign || 'left',
                        justifyContent:
                          element.textAlign === 'center'
                            ? 'center'
                            : element.textAlign === 'right'
                            ? 'flex-end'
                            : 'flex-start',
                        minHeight: '1px', // 确保元素不会消失
                      }}
                    >
                      {textParts.map((part, idx) => (
                        <span key={idx}>
                          {part.type === 'static' ? part.content : `[${part.content}]`}
                        </span>
                      ))}
                    </div>
                  )
                })()}
                {element.type === 'barcode' && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-xs text-gray-400">
                      {element.barcodeFormat === 'QRCODE' ? 'QR码' : '条码'}
                    </div>
                  </div>
                )}
                {element.type === 'image' && (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    {element.imageUrl ? (
                      <img src={element.imageUrl} alt="" className="max-w-full max-h-full" />
                    ) : (
                      <Image className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                )}
                {element.type === 'line' && (() => {
                  const angle = element.lineAngle || 0
                  const normalizedAngle = ((angle % 360) + 360) % 360
                  const radians = (normalizedAngle * Math.PI) / 180
                  const width = element.width || 20
                  const height = element.height || 20
                  const strokeWidth = element.strokeWidth || 1
                  
                  // 使用viewBox来正确映射坐标系统（以毫米为单位）
                  // 计算线条起点和终点（在毫米坐标系中）
                  let x1 = 0, y1 = 0, x2 = width, y2 = height
                  
                  if (normalizedAngle === 0 || normalizedAngle === 180) {
                    // 水平线：从左边到右边，垂直居中
                    x1 = 0
                    y1 = height / 2
                    x2 = width
                    y2 = height / 2
                  } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                    // 垂直线：从上到下，水平居中
                    x1 = width / 2
                    y1 = 0
                    x2 = width / 2
                    y2 = height
                  } else {
                    // 其他角度：从中心点向两边延伸
                    const centerX = width / 2
                    const centerY = height / 2
                    // 计算对角线长度
                    const diagonal = Math.sqrt(width * width + height * height)
                    const halfLength = diagonal / 2
                    
                    x1 = centerX - halfLength * Math.cos(radians)
                    y1 = centerY - halfLength * Math.sin(radians)
                    x2 = centerX + halfLength * Math.cos(radians)
                    y2 = centerY + halfLength * Math.sin(radians)
                  }
                  
                  return (
                    <svg 
                      className="w-full h-full" 
                      viewBox={`0 0 ${width} ${height}`}
                      preserveAspectRatio="none"
                      style={{ overflow: 'visible' }}
                    >
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={element.strokeColor || '#000000'}
                        strokeWidth={strokeWidth}
                      />
                    </svg>
                  )
                })()}
                {element.type === 'rectangle' && (
                  <div
                    className="w-full h-full"
                    style={{
                      border: `${element.strokeWidth || 1}px solid ${element.strokeColor || '#000000'}`,
                      backgroundColor: element.fillColor || 'transparent',
                    }}
                  />
                )}
                {/* 缩放控制点 - 只在选中时显示 */}
                {isSelected && (
                  <>
                    {/* 四个角落 */}
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nwse-resize"
                      style={{ left: '-4px', top: '-4px' }}
                      data-handle="nw"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nesw-resize"
                      style={{ right: '-4px', top: '-4px' }}
                      data-handle="ne"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nwse-resize"
                      style={{ right: '-4px', bottom: '-4px' }}
                      data-handle="se"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-nesw-resize"
                      style={{ left: '-4px', bottom: '-4px' }}
                      data-handle="sw"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    {/* 四个边缘中点 */}
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ns-resize"
                      style={{ left: '50%', top: '-4px', transform: 'translateX(-50%)' }}
                      data-handle="n"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ew-resize"
                      style={{ right: '-4px', top: '50%', transform: 'translateY(-50%)' }}
                      data-handle="e"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ns-resize"
                      style={{ left: '50%', bottom: '-4px', transform: 'translateX(-50%)' }}
                      data-handle="s"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                    <div
                      className="resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm cursor-ew-resize"
                      style={{ left: '-4px', top: '50%', transform: 'translateY(-50%)' }}
                      data-handle="w"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, element.id)
                      }}
                    />
                  </>
                )}
                {element.type === 'table' && (
                  <div className="w-full h-full overflow-hidden">
                    <table className="w-full h-full border-collapse" style={{ fontSize: '8px' }}>
                      <colgroup>
                        {(element.tableColumns || []).map((_, idx) => (
                          <col 
                            key={idx} 
                            style={{ width: `${mmToPx(element.tableColumnWidths?.[idx] || 30)}px` }}
                          />
                        ))}
                      </colgroup>
                      {element.showHeader !== false && (
                        <thead>
                          <tr>
                            {(element.tableColumns || []).map((col, idx) => (
                              <th
                                key={idx}
                                className="border p-1 bg-gray-100 text-left"
                                style={{
                                  borderWidth: `${element.borderWidth || 1}px`,
                                  borderColor: element.borderColor || '#000000',
                                  height: `${mmToPx(element.tableRowHeights?.[0] || 10)}px`,
                                }}
                              >
                                {col === 'productCode' && '商品编码'}
                                {col === 'productName' && '商品名称'}
                                {col === 'colorCode' && '色号编码'}
                                {col === 'colorName' && '色号名称'}
                                {col === 'batchCode' && '缸号编码'}
                                {col === 'barcodeValue' && '条码值'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {Array.from({ length: element.tableRows || 3 }).map((_, rowIdx) => (
                          <tr key={rowIdx}>
                            {(element.tableColumns || []).map((col, colIdx) => (
                              <td
                                key={colIdx}
                                className="border p-1"
                                style={{
                                  borderWidth: `${element.borderWidth || 1}px`,
                                  borderColor: element.borderColor || '#000000',
                                  height: `${mmToPx(element.tableRowHeights?.[rowIdx + (element.showHeader !== false ? 1 : 0)] || 10)}px`,
                                }}
                              >
                                [{col}]
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 预览对话框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">预览</h3>
              <Button
                variant="ghost"
                onClick={() => setShowPreview(false)}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* 预览内容 */}
            <div className="bg-gray-100 p-8 flex justify-center">
              <div
                className="bg-white shadow-lg"
                style={{
                  width: `${mmToPx(formData.pageWidth)}px`,
                  height: `${mmToPx(formData.pageHeight)}px`,
                  position: 'relative',
                }}
              >
                {formData.elements
                  .filter(el => el.visible !== false)
                  .map((element) => (
                    <div
                      key={element.id}
                      className="absolute"
                      style={{
                        left: `${mmToPx(element.x)}px`,
                        top: `${mmToPx(element.y)}px`,
                        width: `${mmToPx(element.width)}px`,
                        height: `${mmToPx(element.height)}px`,
                        zIndex: element.zIndex || 0,
                      }}
                    >
                      {element.type === 'text' && (() => {
                        // 兼容旧版本：如果没有textParts，从dataSource和text创建
                        let textParts = element.textParts || []
                        if (textParts.length === 0) {
                          if (element.dataSource === 'static') {
                            textParts = [{ type: 'static', content: element.text || '文本' }]
                          } else if (element.dataSource) {
                            textParts = [{ type: 'field', content: element.dataSource }]
                          } else {
                            textParts = [{ type: 'static', content: '文本' }]
                          }
                        }
                        
                        return (
                          <div
                            className="w-full h-full flex items-center"
                            style={{
                              fontSize: `${Math.max(1, (element.fontSize || 12) * 0.75)}px`,
                              fontFamily: element.fontFamily || 'Arial',
                              fontWeight: element.fontStyle === 'bold' || element.fontStyle === 'bold italic' ? 'bold' : 'normal',
                              fontStyle: element.fontStyle === 'italic' || element.fontStyle === 'bold italic' ? 'italic' : 'normal',
                              color: element.color || '#000000',
                              textAlign: element.textAlign || 'left',
                              justifyContent:
                                element.textAlign === 'center'
                                  ? 'center'
                                  : element.textAlign === 'right'
                                  ? 'flex-end'
                                  : 'flex-start',
                              minHeight: '1px',
                            }}
                          >
                            {textParts.map((part, idx) => (
                              <span key={idx}>
                                {part.type === 'static' ? part.content : `[${part.content}]`}
                              </span>
                            ))}
                          </div>
                        )
                      })()}
                      {element.type === 'barcode' && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-200">
                          <div className="text-xs text-gray-400">
                            {element.barcodeFormat === 'QRCODE' ? 'QR码预览' : '条码预览'}
                          </div>
                        </div>
                      )}
                      {element.type === 'image' && (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          {element.imageUrl ? (
                            <img src={element.imageUrl} alt="" className="max-w-full max-h-full" />
                          ) : (
                            <Image className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      )}
                      {element.type === 'line' && (() => {
                        const angle = element.lineAngle || 0
                        const normalizedAngle = ((angle % 360) + 360) % 360
                        const radians = (normalizedAngle * Math.PI) / 180
                        const width = element.width || 20
                        const height = element.height || 20
                        const strokeWidth = element.strokeWidth || 1
                        
                        // 使用viewBox来正确映射坐标系统（以毫米为单位）
                        let x1 = 0, y1 = 0, x2 = width, y2 = height
                        
                        if (normalizedAngle === 0 || normalizedAngle === 180) {
                          // 水平线：从左边到右边，垂直居中
                          x1 = 0
                          y1 = height / 2
                          x2 = width
                          y2 = height / 2
                        } else if (normalizedAngle === 90 || normalizedAngle === 270) {
                          // 垂直线：从上到下，水平居中
                          x1 = width / 2
                          y1 = 0
                          x2 = width / 2
                          y2 = height
                        } else {
                          // 其他角度：从中心点向两边延伸
                          const centerX = width / 2
                          const centerY = height / 2
                          const diagonal = Math.sqrt(width * width + height * height)
                          const halfLength = diagonal / 2
                          
                          x1 = centerX - halfLength * Math.cos(radians)
                          y1 = centerY - halfLength * Math.sin(radians)
                          x2 = centerX + halfLength * Math.cos(radians)
                          y2 = centerY + halfLength * Math.sin(radians)
                        }
                        
                        return (
                          <svg 
                            className="w-full h-full" 
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            style={{ overflow: 'visible' }}
                          >
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={element.strokeColor || '#000000'}
                              strokeWidth={strokeWidth}
                            />
                          </svg>
                        )
                      })()}
                      {element.type === 'rectangle' && (
                        <div
                          className="w-full h-full"
                          style={{
                            border: `${element.strokeWidth || 1}px solid ${element.strokeColor || '#000000'}`,
                            backgroundColor: element.fillColor || 'transparent',
                          }}
                        />
                      )}
                      {element.type === 'table' && (
                        <div className="w-full h-full overflow-hidden">
                          <table className="w-full h-full border-collapse" style={{ fontSize: '8px' }}>
                            <colgroup>
                              {(element.tableColumns || []).map((_, idx) => (
                                <col 
                                  key={idx} 
                                  style={{ width: `${mmToPx(element.tableColumnWidths?.[idx] || 30)}px` }}
                                />
                              ))}
                            </colgroup>
                            {element.showHeader !== false && (
                              <thead>
                                <tr>
                                  {(element.tableColumns || []).map((col, idx) => (
                                    <th
                                      key={idx}
                                      className="border p-1 bg-gray-100 text-left"
                                      style={{
                                        borderWidth: `${element.borderWidth || 1}px`,
                                        borderColor: element.borderColor || '#000000',
                                        height: `${mmToPx(element.tableRowHeights?.[0] || 10)}px`,
                                      }}
                                    >
                                      {col === 'productCode' && '商品编码'}
                                      {col === 'productName' && '商品名称'}
                                      {col === 'colorCode' && '色号编码'}
                                      {col === 'colorName' && '色号名称'}
                                      {col === 'batchCode' && '缸号编码'}
                                      {col === 'barcodeValue' && '条码值'}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {Array.from({ length: element.tableRows || 3 }).map((_, rowIdx) => (
                                <tr key={rowIdx}>
                                  {(element.tableColumns || []).map((col, colIdx) => (
                                    <td
                                      key={colIdx}
                                      className="border p-1"
                                      style={{
                                        borderWidth: `${element.borderWidth || 1}px`,
                                        borderColor: element.borderColor || '#000000',
                                        height: `${mmToPx(element.tableRowHeights?.[rowIdx + (element.showHeader !== false ? 1 : 0)] || 10)}px`,
                                      }}
                                    >
                                      [{col}]
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BarcodeTemplateEdit

