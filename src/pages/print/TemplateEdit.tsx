import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { templateApi } from '@/api/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Save, ArrowLeft, FileText } from 'lucide-react'

function TemplateEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
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
  })

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate(id)
    }
  }, [id, isNew])

  const loadTemplate = async (templateId: string) => {
    setLoading(true)
    try {
      const data = await templateApi.getById(templateId)
      setFormData({
        name: data.name || '',
        documentType: data.documentType || '销售单',
        description: data.description || '',
        pageSettings: data.pageSettings || formData.pageSettings,
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
      navigate('/print')
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/print')}
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
        <Button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* 模板基本信息 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
        </div>

        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              单据类型
            </label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="销售单">销售单</option>
              <option value="进货单">进货单</option>
              <option value="出库单">出库单</option>
              <option value="入库单">入库单</option>
              <option value="收款收据">收款收据</option>
              <option value="付款凭证">付款凭证</option>
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
      </div>

      {/* 页面设置 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">页面设置</h2>
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">上边距 (mm)</label>
            <Input
              type="number"
              value={formData.pageSettings.marginTop}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pageSettings: {
                    ...formData.pageSettings,
                    marginTop: parseFloat(e.target.value) || 10,
                  },
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">下边距 (mm)</label>
            <Input
              type="number"
              value={formData.pageSettings.marginBottom}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pageSettings: {
                    ...formData.pageSettings,
                    marginBottom: parseFloat(e.target.value) || 10,
                  },
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">左边距 (mm)</label>
            <Input
              type="number"
              value={formData.pageSettings.marginLeft}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pageSettings: {
                    ...formData.pageSettings,
                    marginLeft: parseFloat(e.target.value) || 10,
                  },
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">右边距 (mm)</label>
            <Input
              type="number"
              value={formData.pageSettings.marginRight}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pageSettings: {
                    ...formData.pageSettings,
                    marginRight: parseFloat(e.target.value) || 10,
                  },
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>提示：</strong>模板的高级配置功能（如字段显示、样式设置等）正在开发中，当前版本支持基本的页面设置。
        </p>
      </div>
    </div>
  )
}

export default TemplateEdit
