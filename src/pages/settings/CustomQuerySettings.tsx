import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import ProductModal from '@/components/product/ProductModal'
import { Search, Plus, Edit, Trash2, Save, ArrowLeft } from 'lucide-react'
import { CustomQuery } from '@/types/settings'

// 模块选项
const moduleOptions = [
  { value: 'product', label: '商品管理' },
  { value: 'purchase', label: '进货管理' },
  { value: 'sales', label: '销售管理' },
  { value: 'inventory', label: '库存管理' },
  { value: 'account', label: '账款管理' },
]

function CustomQuerySettings() {
  const navigate = useNavigate()
  const { customQueries, addCustomQuery, updateCustomQuery, deleteCustomQuery } = useSettingsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuery, setEditingQuery] = useState<CustomQuery | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [formData, setFormData] = useState({
    name: '',
    module: '',
    conditions: {} as Record<string, any>,
  })

  // 筛选查询
  const filteredQueries = useMemo(() => {
    if (!searchKeyword) return customQueries
    const keyword = searchKeyword.toLowerCase()
    return customQueries.filter(
      (q) =>
        q.name.toLowerCase().includes(keyword) ||
        q.module.toLowerCase().includes(keyword)
    )
  }, [customQueries, searchKeyword])

  // 分页数据
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredQueries.slice(start, start + pageSize)
  }, [filteredQueries, currentPage])

  const handleOpenModal = (query?: CustomQuery) => {
    if (query) {
      setEditingQuery(query)
      setFormData({
        name: query.name,
        module: query.module,
        conditions: query.conditions || {},
      })
    } else {
      setEditingQuery(null)
      setFormData({
        name: '',
        module: '',
        conditions: {},
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingQuery(null)
    setFormData({
      name: '',
      module: '',
      conditions: {},
    })
  }

  const handleSave = () => {
    if (!formData.name) {
      alert('请输入查询名称')
      return
    }

    if (!formData.module) {
      alert('请选择模块')
      return
    }

    if (editingQuery) {
      updateCustomQuery(editingQuery.id, formData)
    } else {
      addCustomQuery(formData)
    }
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个自定义查询吗？')) {
      deleteCustomQuery(id)
    }
  }

  const columns = [
    {
      key: 'name',
      title: '查询名称',
      render: (_: any, record: CustomQuery) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'module',
      title: '所属模块',
      render: (_: any, record: CustomQuery) => {
        const module = moduleOptions.find((m) => m.value === record.module)
        return <span className="text-sm text-gray-600">{module?.label || record.module}</span>
      },
    },
    {
      key: 'conditions',
      title: '查询条件',
      render: (_: any, record: CustomQuery) => (
        <span className="text-sm text-gray-600">
          {Object.keys(record.conditions || {}).length} 项条件
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: CustomQuery) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(record)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">自定义查询设置</h1>
            <p className="text-sm text-gray-600 mt-1">配置自定义查询条件，方便快速查找数据</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增查询
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <Input
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="搜索查询名称、模块..."
            className="flex-1"
          />
        </div>
      </div>

      {/* 查询列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={paginatedQueries} rowKey={(record) => record.id} />
        {filteredQueries.length > pageSize && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {currentPage} 页，共 {Math.ceil(filteredQueries.length / pageSize)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(Math.ceil(filteredQueries.length / pageSize), p + 1))
                }
                disabled={currentPage >= Math.ceil(filteredQueries.length / pageSize)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑查询弹窗 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingQuery ? '编辑查询' : '新增查询'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              查询名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入查询名称"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属模块 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择模块</option>
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">查询条件</label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm text-gray-600">
                查询条件配置功能正在开发中，当前版本暂不支持自定义条件配置。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        </div>
      </ProductModal>
    </div>
  )
}

export default CustomQuerySettings







