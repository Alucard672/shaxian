import { useState, useMemo } from 'react'
import { X, Edit, Trash2, Star, Plus } from 'lucide-react'
import { useTemplateStore } from '@/store/templateStore'
import { TemplateType } from '@/types/template'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface TemplateManagementProps {
  isOpen: boolean
  onClose: () => void
}

function TemplateManagement({ isOpen, onClose }: TemplateManagementProps) {
  const navigate = useNavigate()
  const {
    templates,
    getTemplatesByType,
    setDefaultTemplate,
    deleteTemplate,
  } = useTemplateStore()

  const [filterType, setFilterType] = useState<TemplateType | '全部'>('全部')

  // 统计数据
  const stats = useMemo(() => {
    const totalCount = templates.length
    const defaultCount = templates.filter((t) => t.isDefault).length
    const a4Count = templates.filter((t) => t.type === 'A4模板').length
    const tripleCount = templates.filter((t) => t.type === '三联单').length

    return {
      totalCount,
      defaultCount,
      a4Count,
      tripleCount,
    }
  }, [templates])

  // 筛选后的模板列表
  const filteredTemplates = useMemo(() => {
    return getTemplatesByType(filterType)
  }, [filterType, templates])

  // 处理设为默认
  const handleSetDefault = (id: string) => {
    setDefaultTemplate(id)
  }

  // 处理编辑
  const handleEdit = (id: string) => {
    navigate(`/print/template/${id}/edit`)
    onClose()
  }

  // 处理删除
  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      deleteTemplate(id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-[1200px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">模板管理</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                navigate('/print/template/create')
                onClose()
              }}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建模板
            </Button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">总模板数</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.totalCount}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">默认模板</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.defaultCount}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">A4模板</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.a4Count}</div>
            </Card>
            <Card className="p-4 border border-gray-200 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">三联单模板</div>
              <div className="text-2xl font-semibold text-gray-900">{stats.tripleCount}</div>
            </Card>
          </div>

          {/* 筛选标签 */}
          <div className="flex gap-2 mb-6">
            {(['全部', 'A4模板', '三联单'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* 模板列表 */}
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <Badge variant="warning" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          默认模板
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={template.type === 'A4模板' ? 'primary' : 'success'}
                        className="text-xs"
                      >
                        {template.type}
                      </Badge>
                      <Badge variant="gray" className="text-xs">
                        {template.documentType}
                      </Badge>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">尺寸：</span>
                    {template.pageSettings.width} × {template.pageSettings.height} mm
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">创建时间：</span>
                    {format(new Date(template.createdAt), 'yyyy-MM-dd')}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">使用次数：</span>
                    {template.usageCount} 次
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  {!template.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(template.id)}
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      设为默认
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template.id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-danger-600 hover:text-danger-700 hover:border-danger-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无模板数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateManagement

