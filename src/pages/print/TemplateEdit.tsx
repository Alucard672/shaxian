import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { templateApi } from '@/api/client'
import { generatePrintContent } from '@/utils/printService'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Save, ArrowLeft, FileText, Type, Info, Package, Calculator, QrCode, Eye, Upload, X } from 'lucide-react'

function TemplateEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'A4模板',
    documentType: '销售单',
    description: '',
    pageSettings: {
      width: 210,
      height: 297,
      unit: 'mm',
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    },
    titleSettings: {
      enabled: true,
      text: '织云ERP 销售提货单（代合同代欠条）',
      fontSize: 18,
      align: 'center',
    },
    basicInfoFields: {
      documentNumber: true,
      documentDate: true,
      customerName: true,
      contactPerson: true,
      contactPhone: true,
      deliveryAddress: true,
      printDate: true,
    },
    productFields: {
      showTable: true,
      productName: true,
      productCode: true,
      colorName: true,
      colorCode: true,
      batchCode: true,
      quantity: true,
      unit: true,
      price: true,
      amount: true,
      pieceCount: false,
      unitWeight: false,
      productionDate: false,
      stockLocation: false,
      remark: true,
      textAlign: 'left',
    },
    summaryFields: {
      subtotal: true,
      totalAmount: true,
      paymentInfo: true,
      creator: true,
      handler: true,
      customerSign: true,
    },
    otherElements: {
      qrcode: true,
      qrcodeCount: 1,
      qrcodeImages: [] as string[],
      companyInfo: true,
      cornerMark: false,
      pageNumber: true,
    },
  })

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate(id)
    }
  }, [id, isNew])

  // 当模板类型改变时，自动设置页面大小（仅在用户手动切换时，不在加载模板时）
  useEffect(() => {
    // 如果正在加载模板，不执行自动设置
    if (isLoadingTemplate) {
      return
    }
    
    if (formData.type === 'A4模板') {
      setFormData((prev) => ({
        ...prev,
        pageSettings: {
          ...prev.pageSettings,
          width: 210,
          height: 297,
          unit: 'mm',
        },
      }))
    } else if (formData.type === '三联单') {
      setFormData((prev) => ({
        ...prev,
        pageSettings: {
          ...prev.pageSettings,
          width: 9.5,
          height: 5.5,
          unit: 'inch',
        },
      }))
    }
  }, [formData.type, isLoadingTemplate])

  const loadTemplate = async (templateId: string) => {
    setLoading(true)
    setIsLoadingTemplate(true)
    try {
      const data = await templateApi.getById(templateId)
      
      // 字段名映射：将旧字段名映射到新字段名
      const fieldNameMap: Record<string, string> = {
        spec: 'productCode',
        color: 'colorName',
        batch: 'batchCode',
        orderNumber: 'documentNumber',
        customer: 'customerName',
        date: 'documentDate',
        operator: 'handler',
      }
      
      // 将数组转换为对象
      const arrayToObject = (arr: string[], defaultFields: Record<string, any>): Record<string, any> => {
        const result: Record<string, any> = {}
        // 先设置所有默认字段为false
        Object.keys(defaultFields).forEach(key => {
          if (key !== 'showTable' && key !== 'textAlign') {
            result[key] = false
          } else {
            result[key] = defaultFields[key]
          }
        })
        // 然后根据数组中的字段名设置为true
        arr.forEach(fieldName => {
          const mappedName = fieldNameMap[fieldName] || fieldName
          // 如果映射后的字段名存在于默认字段中，设置为true
          if (result.hasOwnProperty(mappedName)) {
            result[mappedName] = true
          }
        })
        return result
      }
      
      // 解析JSON字符串字段
      const parseJsonField = (field: any, defaultValue: any, isArrayField = false) => {
        if (!field) return defaultValue
        if (typeof field === 'string') {
          try {
            const parsed = JSON.parse(field)
            // 如果是数组字段，转换为对象
            if (isArrayField && Array.isArray(parsed)) {
              return arrayToObject(parsed, defaultValue)
            }
            // 确保解析后是对象，不是数组
            if (Array.isArray(parsed)) {
              return defaultValue
            }
            return parsed
          } catch {
            return defaultValue
          }
        }
        // 如果已经是数组，转换为对象
        if (isArrayField && Array.isArray(field)) {
          return arrayToObject(field, defaultValue)
        }
        // 如果已经是数组但不是数组字段，返回默认值
        if (Array.isArray(field)) {
          return defaultValue
        }
        return field
      }
      
      setFormData({
        name: data.name || '',
        type: data.type || 'A4模板',
        documentType: data.documentType || '销售单',
        description: data.description || '',
        pageSettings: parseJsonField(data.pageSettings, formData.pageSettings),
        titleSettings: parseJsonField(data.titleSettings, formData.titleSettings),
        basicInfoFields: parseJsonField(data.basicInfoFields, formData.basicInfoFields, true),
        productFields: {
          ...formData.productFields,
          ...parseJsonField(data.productFields, formData.productFields, true),
        },
        summaryFields: parseJsonField(data.summaryFields, formData.summaryFields, true),
        otherElements: {
          ...formData.otherElements,
          ...parseJsonField(data.otherElements, {}),
          qrcodeImages: data.otherElements?.qrcodeImages || formData.otherElements.qrcodeImages || [],
        },
      })
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
      if (isNew) {
        await templateApi.create(formData)
        alert('模板创建成功')
      } else if (id) {
        await templateApi.update(id, formData)
        alert('模板更新成功')
      }
      navigate('/settings/print')
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    // 创建模拟数据用于预览，包含所有可能的字段
    const mockOrder = {
      orderNumber: 'XS20250101001',
      items: [
        {
          productId: 'P001',
          productCode: 'P001',
          productName: '32S纯棉纱线',
          colorId: 'C001',
          colorName: '白色',
          colorCode: 'C001',
          batchId: 'B001',
          batchCode: 'B20250101',
          quantity: 100,
          unit: 'kg',
          price: 25.5,
          unitPrice: 25.5,
          amount: 2550,
          pieceCount: 8,
          unitWeight: 12.5,
          productionDate: '2025-01-01',
          stockLocation: 'A区-01',
          remark: '测试商品',
        },
        {
          productId: 'P002',
          productCode: 'P002',
          productName: '40S纯棉纱线',
          colorId: 'C002',
          colorName: '蓝色',
          colorCode: 'C002',
          batchId: 'B002',
          batchCode: 'B20250102',
          quantity: 50,
          unit: 'kg',
          price: 30.0,
          unitPrice: 30.0,
          amount: 1500,
          pieceCount: 4,
          unitWeight: 12.5,
          productionDate: '2025-01-02',
          stockLocation: 'A区-02',
          remark: '',
        },
      ],
      totalAmount: 4050,
      salesDate: new Date().toISOString().split('T')[0],
      customerName: '测试客户',
      operator: '张三',
    }

    const mockCustomer = {
      contactPerson: '张三',
      phone: '13800138000',
      address: '浙江省杭州市余杭区测试路123号',
    }

    const previewData = {
      template: {
        ...formData,
        qrcodeImages: formData.otherElements.qrcodeImages,
      },
      order: mockOrder,
      documentType: formData.documentType,
      customer: mockCustomer,
    }

    // 生成 HTML 内容
    let htmlContent = generatePrintContent(previewData as any)
    
    // 将预览数据保存到 localStorage，以便刷新后恢复
    const previewDataKey = 'print_preview_data'
    localStorage.setItem(previewDataKey, JSON.stringify(previewData))
    localStorage.setItem(previewDataKey + '_html', htmlContent)
    
    // 在 HTML 中注入恢复脚本，确保刷新后能恢复内容
    const restoreScript = `
      <script>
        (function() {
          const previewDataKey = '${previewDataKey}';
          
          // 页面加载时，如果有保存的 HTML，恢复它
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', restoreContent);
          } else {
            restoreContent();
          }
          
          function restoreContent() {
            const savedHtml = localStorage.getItem(previewDataKey + '_html');
            if (savedHtml && !document.querySelector('.print-container')) {
              document.open();
              document.write(savedHtml);
              document.close();
            }
          }
          
          // 保存当前内容到 localStorage（在页面卸载前）
          window.addEventListener('beforeunload', function() {
            const currentContent = document.documentElement.outerHTML;
            localStorage.setItem(previewDataKey + '_html', currentContent);
          });
        })();
      </script>
    `
    
    // 将恢复脚本插入到 </head> 之前
    htmlContent = htmlContent.replace('</head>', restoreScript + '</head>')
    
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(htmlContent)
      previewWindow.document.close()
    }
  }

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      const currentImages = [...formData.otherElements.qrcodeImages]
      // 确保数组长度足够
      while (currentImages.length <= index) {
        currentImages.push('')
      }
      currentImages[index] = imageUrl
      
      setFormData({
        ...formData,
        otherElements: {
          ...formData.otherElements,
          qrcodeImages: currentImages,
        },
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (index: number) => {
    const currentImages = [...formData.otherElements.qrcodeImages]
    currentImages[index] = ''
    setFormData({
      ...formData,
      otherElements: {
        ...formData.otherElements,
        qrcodeImages: currentImages,
      },
    })
  }

  // 字段标签映射 - 使用真实的商品信息字段
  const fieldLabels: Record<string, Record<string, string>> = {
    basicInfoFields: {
      documentNumber: '单据编号',
      documentDate: '单据日期',
      customerName: '客户名称',
      contactPerson: '联系人',
      contactPhone: '联系电话',
      deliveryAddress: '送货地址',
      printDate: '打印日期',
    },
    productFields: {
      productName: '商品名称',
      productCode: '商品编码',
      colorName: '颜色名称',
      colorCode: '颜色代码',
      batchCode: '批次号/缸号',
      quantity: '数量',
      unit: '单位',
      price: '单价',
      amount: '金额',
      pieceCount: '件数',
      unitWeight: '单件重量',
      productionDate: '生产日期',
      stockLocation: '库存位置',
      remark: '备注',
    },
    summaryFields: {
      subtotal: '小计',
      totalAmount: '合计金额',
      paymentInfo: '付款信息',
      creator: '制单人',
      handler: '经手人',
      customerSign: '客户签名',
    },
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/print')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isNew ? '新建模板' : '编辑模板'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isNew ? '创建新的打印模板' : '编辑打印模板配置'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handlePreview}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            预览
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 所有配置在一个页面中，垂直滚动 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板名称 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入模板名称"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">模板类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4模板">A4模板</option>
                <option value="三联单">三联单</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单据类型</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="销售单">销售单</option>
                <option value="进货单">进货单</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入模板描述（可选）"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">纸张宽度 (mm)</label>
              <Input
                type="number"
                value={formData.pageSettings.width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      width: parseFloat(e.target.value) || 210,
                    },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">纸张高度 (mm)</label>
              <Input
                type="number"
                value={formData.pageSettings.height}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      height: parseFloat(e.target.value) || 297,
                    },
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
              <select
                value={formData.pageSettings.unit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      unit: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mm">毫米 (mm)</option>
                <option value="inch">英寸 (inch)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">上边距 (mm)</label>
              <Input
                type="text"
                value={String(formData.pageSettings.marginTop ?? '')}
                onChange={(e) => {
                  const value = e.target.value
                  // 允许空值、数字和小数点
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({
                      ...formData,
                      pageSettings: {
                        ...formData.pageSettings,
                        marginTop: value === '' ? 0 : parseFloat(value) || 0,
                      },
                    })
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value)
                  const finalValue = isNaN(numValue) || numValue < 0 ? 10 : numValue
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      marginTop: finalValue,
                    },
                  })
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">下边距 (mm)</label>
              <Input
                type="text"
                value={String(formData.pageSettings.marginBottom ?? '')}
                onChange={(e) => {
                  const value = e.target.value
                  // 允许空值、数字和小数点
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({
                      ...formData,
                      pageSettings: {
                        ...formData.pageSettings,
                        marginBottom: value === '' ? 0 : parseFloat(value) || 0,
                      },
                    })
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value)
                  const finalValue = isNaN(numValue) || numValue < 0 ? 10 : numValue
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      marginBottom: finalValue,
                    },
                  })
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">左边距 (mm)</label>
              <Input
                type="text"
                value={String(formData.pageSettings.marginLeft ?? '')}
                onChange={(e) => {
                  const value = e.target.value
                  // 允许空值、数字和小数点
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({
                      ...formData,
                      pageSettings: {
                        ...formData.pageSettings,
                        marginLeft: value === '' ? 0 : parseFloat(value) || 0,
                      },
                    })
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value)
                  const finalValue = isNaN(numValue) || numValue < 0 ? 10 : numValue
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      marginLeft: finalValue,
                    },
                  })
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">右边距 (mm)</label>
              <Input
                type="text"
                value={String(formData.pageSettings.marginRight ?? '')}
                onChange={(e) => {
                  const value = e.target.value
                  // 允许空值、数字和小数点
                  if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({
                      ...formData,
                      pageSettings: {
                        ...formData.pageSettings,
                        marginRight: value === '' ? 0 : parseFloat(value) || 0,
                      },
                    })
                  }
                }}
                onBlur={(e) => {
                  const numValue = parseFloat(e.target.value)
                  const finalValue = isNaN(numValue) || numValue < 0 ? 10 : numValue
                  setFormData({
                    ...formData,
                    pageSettings: {
                      ...formData.pageSettings,
                      marginRight: finalValue,
                    },
                  })
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 标题设置 */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">标题设置</h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="titleEnabled"
              checked={formData.titleSettings.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  titleSettings: {
                    ...formData.titleSettings,
                    enabled: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="titleEnabled" className="text-sm font-medium text-gray-700">
              启用标题
            </label>
          </div>

          {formData.titleSettings.enabled && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题文本</label>
                <Input
                  value={formData.titleSettings.text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titleSettings: {
                        ...formData.titleSettings,
                        text: e.target.value,
                      },
                    })
                  }
                  placeholder="请输入标题文本"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
                <Input
                  type="number"
                  value={formData.titleSettings.fontSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titleSettings: {
                        ...formData.titleSettings,
                        fontSize: parseInt(e.target.value) || 18,
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">对齐方式</label>
                <select
                  value={formData.titleSettings.align}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      titleSettings: {
                        ...formData.titleSettings,
                        align: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 基础信息字段 */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">基础信息字段</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(formData.basicInfoFields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`basicInfo_${key}`}
                  checked={value as boolean}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basicInfoFields: {
                        ...formData.basicInfoFields,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor={`basicInfo_${key}`} className="text-sm text-gray-700">
                  {fieldLabels.basicInfoFields[key] || key}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 商品字段 */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">商品字段</h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showTable"
              checked={formData.productFields.showTable}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productFields: {
                    ...formData.productFields,
                    showTable: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="showTable" className="text-sm font-medium text-gray-700">
              显示商品表格
            </label>
          </div>

          {formData.productFields.showTable && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pl-6 pt-2">
                {(() => {
                  // 确保productFields是对象，不是数组
                  let fields = formData.productFields || {}
                  
                  // 如果是数组，使用默认字段
                  if (Array.isArray(fields)) {
                    console.warn('productFields是数组，使用默认字段')
                    fields = {
                      showTable: true,
                      productName: true,
                      productCode: true,
                      colorName: true,
                      colorCode: true,
                      batchCode: true,
                      quantity: true,
                      unit: true,
                      price: true,
                      amount: true,
                      pieceCount: false,
                      unitWeight: false,
                      productionDate: false,
                      stockLocation: false,
                      remark: true,
                      textAlign: 'left',
                    }
                    // 更新formData
                    setFormData({
                      ...formData,
                      productFields: fields,
                    })
                  }
                  
                  const fieldEntries = Object.entries(fields)
                    .filter(([key]) => key !== 'showTable' && key !== 'textAlign')
                  
                  return fieldEntries.map(([key, value]) => {
                    // 确保字段标签存在，如果不存在则使用字段名
                    const label = fieldLabels?.productFields?.[key] || key
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`product_${key}`}
                          checked={value as boolean}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              productFields: {
                                ...formData.productFields,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`product_${key}`} className="text-sm text-gray-700 cursor-pointer">
                          {label}
                        </label>
                      </div>
                    )
                  })
                })()}
              </div>

              <div className="pl-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">文本对齐</label>
                <select
                  value={formData.productFields.textAlign}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productFields: {
                        ...formData.productFields,
                        textAlign: e.target.value,
                      },
                    })
                  }
                  className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* 汇总字段 */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">汇总字段</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(formData.summaryFields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`summary_${key}`}
                  checked={value as boolean}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      summaryFields: {
                        ...formData.summaryFields,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor={`summary_${key}`} className="text-sm text-gray-700">
                  {fieldLabels.summaryFields[key] || key}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 其他元素 */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">其他元素</h2>
          </div>

          <div className="space-y-4">
            {/* 二维码设置 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="qrcode"
                checked={formData.otherElements.qrcode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    otherElements: {
                      ...formData.otherElements,
                      qrcode: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="qrcode" className="text-sm font-medium text-gray-700">
                显示二维码
              </label>
            </div>

            {formData.otherElements.qrcode && (
              <div className="pl-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">二维码数量</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          const currentImages = [...formData.otherElements.qrcodeImages]
                          // 调整数组长度以匹配新的数量
                          while (currentImages.length < count) {
                            currentImages.push('')
                          }
                          while (currentImages.length > count) {
                            currentImages.pop()
                          }
                          setFormData({
                            ...formData,
                            otherElements: {
                              ...formData.otherElements,
                              qrcodeCount: count,
                              qrcodeImages: currentImages,
                            },
                          })
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.otherElements.qrcodeCount === count
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {count} 个
                      </button>
                    ))}
                  </div>
                </div>

                {/* 二维码上传 - 根据数量显示多个上传框 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">上传二维码图片</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: formData.otherElements.qrcodeCount || 1 }).map((_, index) => {
                      const imageUrl = formData.otherElements.qrcodeImages[index] || ''
                      return (
                        <div key={index} className="space-y-2">
                          <label className="block text-sm text-gray-600 mb-1">二维码 {index + 1}</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(index, e)}
                            className="hidden"
                            id={`qrcode-upload-${index}`}
                          />
                          {imageUrl ? (
                            <div className="relative group">
                              <img
                                src={imageUrl}
                                alt={`二维码 ${index + 1}`}
                                className="w-full h-32 object-contain border border-gray-200 rounded-lg"
                              />
                              <button
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor={`qrcode-upload-${index}`}
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600">点击上传</span>
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 其他选项 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="companyInfo"
                  checked={formData.otherElements.companyInfo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherElements: {
                        ...formData.otherElements,
                        companyInfo: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="companyInfo" className="text-sm text-gray-700">
                  显示公司信息
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cornerMark"
                  checked={formData.otherElements.cornerMark}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherElements: {
                        ...formData.otherElements,
                        cornerMark: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="cornerMark" className="text-sm text-gray-700">
                  显示角标
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pageNumber"
                  checked={formData.otherElements.pageNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherElements: {
                        ...formData.otherElements,
                        pageNumber: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="pageNumber" className="text-sm text-gray-700">
                  显示页码
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateEdit
