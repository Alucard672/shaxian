import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTemplateStore } from '@/store/templateStore'
import { PrintTemplateFormData, TemplateType } from '@/types/template'
import Button from '../../components/ui/Button'
import TemplatePreview from '../../components/template/TemplatePreview'
import { ArrowLeft, Save, Eye } from 'lucide-react'

function TemplateEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getTemplate, addTemplate, updateTemplate } = useTemplateStore()

  const isEditMode = !!id
  const existingTemplate = isEditMode ? getTemplate(id!) : null

  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState<PrintTemplateFormData>({
    name: '',
    type: 'A4模板',
    description: '',
    documentType: '销售单',
    pageSettings: {
      width: 210,
      height: 297,
      unit: 'mm' as 'mm' | 'inch',
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    },
    titleSettings: {
      enabled: true,
      text: '',
      fontSize: 18,
      align: 'center',
    },
    basicInfoFields: {
      documentNumber: true,
      documentDate: true,
      customerName: true,
      contactPerson: false,
      contactPhone: false,
      deliveryAddress: false,
      printDate: true,
    },
    productFields: {
      showTable: true,
      productName: true,
      colorCode: true,
      quantity: true,
      unitPrice: true,
      amount: true,
      batchCode: true,
      remark: false,
      textAlign: 'left' as 'left' | 'center' | 'right',
    },
    summaryFields: {
      subtotal: false,
      totalAmount: true,
      paymentInfo: false,
      creator: true,
      handler: true,
      customerSign: false,
    },
    otherElements: {
      qrcode: false,
      qrcodeCount: 1,
      companyInfo: true,
      cornerMark: false,
      pageNumber: false,
    },
    qrcodeImages: [],
  })

  // 加载编辑模式的数据
  useEffect(() => {
    if (isEditMode && existingTemplate) {
      setFormData({
        name: existingTemplate.name,
        type: existingTemplate.type,
        description: existingTemplate.description || '',
        documentType: existingTemplate.documentType,
        pageSettings: {
          ...existingTemplate.pageSettings,
          unit: existingTemplate.pageSettings.unit || 'mm', // 兼容旧数据，默认使用mm
        },
        titleSettings: existingTemplate.titleSettings,
        basicInfoFields: existingTemplate.basicInfoFields,
        productFields: {
          ...existingTemplate.productFields,
          textAlign: existingTemplate.productFields.textAlign || 'left', // 兼容旧数据，默认左对齐
        },
        summaryFields: existingTemplate.summaryFields,
        otherElements: existingTemplate.otherElements,
        qrcodeImages: existingTemplate.qrcodeImages,
      })
    }
  }, [isEditMode, existingTemplate])

  // 处理保存
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入模板名称')
      return
    }

    if (isEditMode && id) {
      updateTemplate(id, formData)
    } else {
      addTemplate(formData)
    }

    navigate('/print')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/print')}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? '编辑模板' : '新建模板'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditMode ? '修改模板配置' : '创建新的打印模板'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="h-9 border-gray-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                预览
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                保存模板
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入模板名称"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板类型 *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as TemplateType })
                  }
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="A4模板">A4模板</option>
                  <option value="三联单">三联单</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单据类型 *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentType: e.target.value as '销售单' | '进货单',
                    })
                  }
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="销售单">销售单</option>
                  <option value="进货单">进货单</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模板描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入模板描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* 页面设置 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">页面设置</h2>
            <div className="space-y-6">
              {/* 单位选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单位 *
                </label>
                <select
                  value={formData.pageSettings.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pageSettings: {
                        ...formData.pageSettings,
                        unit: e.target.value as 'mm' | 'inch',
                      },
                    })
                  }
                  className="w-full max-w-xs px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="mm">毫米 (mm)</option>
                  <option value="inch">英寸 (inch)</option>
                </select>
              </div>
              
              {/* 纸张大小 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    宽度 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pageSettings.width}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pageSettings: {
                          ...formData.pageSettings,
                          width: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高度 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pageSettings.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pageSettings: {
                          ...formData.pageSettings,
                          height: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              
              {/* 边距设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  边距设置
                </label>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      上边距 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pageSettings.marginTop}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pageSettings: {
                            ...formData.pageSettings,
                            marginTop: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      右边距 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pageSettings.marginRight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pageSettings: {
                            ...formData.pageSettings,
                            marginRight: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      下边距 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pageSettings.marginBottom}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pageSettings: {
                            ...formData.pageSettings,
                            marginBottom: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      左边距 ({formData.pageSettings.unit === 'mm' ? 'mm' : 'inch'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pageSettings.marginLeft}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pageSettings: {
                            ...formData.pageSettings,
                            marginLeft: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 标题设置 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">标题设置</h2>
            <div className="space-y-4">
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
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="titleEnabled" className="text-sm font-medium text-gray-700">
                  显示标题
                </label>
              </div>
              {formData.titleSettings.enabled && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      标题文字
                    </label>
                    <input
                      type="text"
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
                      placeholder="请输入标题文字"
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字体大小
                    </label>
                    <input
                      type="number"
                      value={formData.titleSettings.fontSize}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          titleSettings: {
                            ...formData.titleSettings,
                            fontSize: parseFloat(e.target.value) || 18,
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      对齐方式
                    </label>
                    <select
                      value={formData.titleSettings.align}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          titleSettings: {
                            ...formData.titleSettings,
                            align: e.target.value as 'left' | 'center' | 'right',
                          },
                        })
                      }
                      className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 基础信息字段 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基础信息字段</h2>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(formData.basicInfoFields).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`basicInfo_${key}`}
                    checked={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basicInfoFields: {
                          ...formData.basicInfoFields,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor={`basicInfo_${key}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    {key === 'documentNumber'
                      ? '单据编号'
                      : key === 'documentDate'
                        ? '单据日期'
                        : key === 'customerName'
                          ? formData.documentType === '销售单'
                            ? '客户名称'
                            : '供应商名称'
                          : key === 'contactPerson'
                            ? '联系人'
                            : key === 'contactPhone'
                              ? '联系电话'
                              : key === 'deliveryAddress'
                                ? '送货地址'
                                : '打印日期'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 商品字段 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">商品字段</h2>
            <div className="space-y-4">
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
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="showTable" className="text-sm font-medium text-gray-700">
                  显示商品表格
                </label>
              </div>
              {formData.productFields.showTable && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(formData.productFields)
                      .filter(([key]) => key !== 'showTable' && key !== 'textAlign')
                      .map(([key, value]) => (
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
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <label
                            htmlFor={`product_${key}`}
                            className="text-sm font-medium text-gray-700"
                          >
                            {key === 'productName'
                              ? '商品名称'
                              : key === 'colorCode'
                                ? '色号'
                                : key === 'quantity'
                                  ? '数量/重量'
                                  : key === 'unitPrice'
                                    ? '单价'
                                    : key === 'amount'
                                      ? '金额'
                                      : key === 'batchCode'
                                        ? '批号'
                                        : '备注'}
                          </label>
                        </div>
                      ))}
                  </div>
                  {/* 明细文字对齐方式 */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      明细文字对齐方式
                    </label>
                    <select
                      value={formData.productFields.textAlign}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          productFields: {
                            ...formData.productFields,
                            textAlign: e.target.value as 'left' | 'center' | 'right',
                          },
                        })
                      }
                      className="w-full max-w-xs px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      注意：金额和单价字段始终右对齐，不受此设置影响
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 汇总信息字段 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">汇总信息字段</h2>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(formData.summaryFields).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`summary_${key}`}
                    checked={value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        summaryFields: {
                          ...formData.summaryFields,
                          [key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label
                    htmlFor={`summary_${key}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    {key === 'subtotal'
                      ? '小计信息'
                      : key === 'totalAmount'
                        ? '总计金额'
                        : key === 'paymentInfo'
                          ? '付款信息'
                          : key === 'creator'
                            ? '制单人'
                            : key === 'handler'
                              ? '经手人'
                              : '客户签字'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 其他元素 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">其他元素</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(formData.otherElements)
                  .filter(([key]) => key !== 'qrcodeCount')
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`other_${key}`}
                        checked={value as boolean}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otherElements: {
                              ...formData.otherElements,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor={`other_${key}`} className="text-sm font-medium text-gray-700">
                        {key === 'qrcode'
                          ? '二维码'
                          : key === 'companyInfo'
                            ? '公司信息'
                            : key === 'cornerMark'
                              ? '四角标记'
                              : '页码'}
                      </label>
                    </div>
                  ))}
              </div>
              {/* 二维码数量设置和上传 */}
              {formData.otherElements.qrcode && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      二维码数量
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.otherElements.qrcodeCount || 1}
                      onChange={(e) => {
                        const count = Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                        const currentImages = formData.qrcodeImages || []
                        // 调整二维码图片数组长度
                        const newImages = Array(count)
                          .fill(null)
                          .map((_, i) => currentImages[i] || '')
                        setFormData({
                          ...formData,
                          otherElements: {
                            ...formData.otherElements,
                            qrcodeCount: count,
                          },
                          qrcodeImages: newImages,
                        })
                      }}
                      className="w-32 px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">可以设置1-10个二维码</p>
                  </div>
                  
                  {/* 二维码上传 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      二维码图片上传
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {Array(formData.otherElements.qrcodeCount || 1)
                        .fill(null)
                        .map((_, index) => (
                          <div key={index} className="space-y-2">
                            <label className="block text-xs text-gray-500 mb-1">
                              二维码 {index + 1}
                            </label>
                            <div className="relative">
                              {formData.qrcodeImages?.[index] ? (
                                <div className="relative group">
                                  <img
                                    src={formData.qrcodeImages[index]}
                                    alt={`二维码 ${index + 1}`}
                                    className="w-full h-32 object-contain border border-gray-200 rounded-lg bg-gray-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = [...(formData.qrcodeImages || [])]
                                      newImages[index] = ''
                                      setFormData({
                                        ...formData,
                                        qrcodeImages: newImages,
                                      })
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg
                                      className="w-8 h-8 mb-2 text-gray-400"
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 20 16"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                      />
                                    </svg>
                                    <p className="mb-2 text-xs text-gray-500">
                                      <span className="font-semibold">点击上传</span> 或拖拽图片
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, SVG</p>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        const reader = new FileReader()
                                        reader.onload = (event) => {
                                          const result = event.target?.result as string
                                          const currentImages = formData.qrcodeImages || []
                                          const newImages = [...currentImages]
                                          newImages[index] = result
                                          // 确保数组长度匹配二维码数量
                                          while (newImages.length < (formData.otherElements.qrcodeCount || 1)) {
                                            newImages.push('')
                                          }
                                          setFormData({
                                            ...formData,
                                            qrcodeImages: newImages,
                                          })
                                        }
                                        reader.readAsDataURL(file)
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                            {formData.qrcodeImages?.[index] && (
                              <div className="mt-1">
                                <input
                                  type="text"
                                  placeholder="或输入图片URL"
                                  value={formData.qrcodeImages[index]}
                                  onChange={(e) => {
                                    const newImages = [...(formData.qrcodeImages || [])]
                                    newImages[index] = e.target.value
                                    setFormData({
                                      ...formData,
                                      qrcodeImages: newImages,
                                    })
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 预览模态窗口 */}
      <TemplatePreview
        template={formData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}

export default TemplateEdit

