import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { Unit } from '@/types/unit'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { Plus, Edit, Trash2, Save, Ruler, Search } from 'lucide-react'

function UnitManagement() {
  const {
    units,
    loading,
    loadUnits,
    addUnit,
    updateUnit,
    deleteUnit,
  } = useSettingsStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    remark: '',
    sortOrder: 0,
    isEnabled: true,
  })

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const handleOpenModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({
        name: unit.name,
        code: unit.code || '',
        category: unit.category || '',
        remark: unit.remark || '',
        sortOrder: unit.sortOrder || 0,
        isEnabled: unit.isEnabled,
      })
    } else {
      setEditingUnit(null)
      setFormData({
        name: '',
        code: '',
        category: '',
        remark: '',
        sortOrder: 0,
        isEnabled: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUnit(null)
    setFormData({
      name: '',
      code: '',
      category: '',
      remark: '',
      sortOrder: 0,
      isEnabled: true,
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请填写单位名称')
      return
    }

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, formData)
        alert('单位更新成功')
      } else {
        await addUnit(formData)
        alert('单位创建成功')
      }
      handleCloseModal()
    } catch (error: any) {
      alert('保存失败：' + (error.message || '未知错误'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个单位吗？删除后无法恢复。')) {
      return
    }

    try {
      await deleteUnit(id)
      alert('单位已删除')
    } catch (error: any) {
      alert('删除失败：' + (error.message || '未知错误'))
    }
  }

  const filteredUnits = units.filter((unit) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      unit.name.toLowerCase().includes(keyword) ||
      (unit.code && unit.code.toLowerCase().includes(keyword)) ||
      (unit.category && unit.category.toLowerCase().includes(keyword))
    )
  })

  const columns = [
    {
      key: 'name',
      title: '单位名称',
      render: (_: any, record: Unit) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      title: '单位编码',
      render: (_: any, record: Unit) => (
        <span className="text-sm text-gray-600">{record.code || '-'}</span>
      ),
    },
    {
      key: 'category',
      title: '分类',
      render: (_: any, record: Unit) => (
        <span className="text-sm text-gray-600">{record.category || '-'}</span>
      ),
    },
    {
      key: 'sortOrder',
      title: '排序',
      render: (_: any, record: Unit) => (
        <span className="text-sm text-gray-600">{record.sortOrder || 0}</span>
      ),
    },
    {
      key: 'isEnabled',
      title: '状态',
      render: (_: any, record: Unit) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          record.isEnabled 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {record.isEnabled ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Unit) => (
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
            className="p-1.5 hover:bg-red-50 rounded-xl"
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">单位管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理系统使用的单位信息</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建单位
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索单位名称、编码、分类..."
            className="flex-1"
          />
        </div>
      </div>

      {/* 单位列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredUnits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Ruler className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无单位，点击"新建单位"创建第一个单位</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredUnits} rowKey={(record) => record.id} />
        )}
      </div>

      {/* 新增/编辑单位弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingUnit ? '编辑单位' : '新建单位'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单位名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入单位名称，如：kg、g、打、支"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位编码</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="请输入单位编码"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="如：重量、长度、数量"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="排序顺序，数字越小越靠前"
                    className="w-full"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    placeholder="请输入备注"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">启用</span>
                  </label>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default UnitManagement



