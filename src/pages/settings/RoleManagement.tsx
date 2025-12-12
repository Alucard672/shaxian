import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { Plus, Edit, Trash2, Save, ArrowLeft, Shield } from 'lucide-react'
import { Role } from '@/types/settings'

function RoleManagement() {
  const navigate = useNavigate()
  const { roles, loadRoles, addRole, updateRole, deleteRole } = useSettingsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as Record<string, any>,
  })

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || {},
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permissions: {},
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(null)
    setFormData({
      name: '',
      description: '',
      permissions: {},
    })
  }

  const handleSave = async () => {
    if (!formData.name) {
      alert('请填写角色名称')
      return
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData)
      } else {
        await addRole(formData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || '保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个角色吗？')) {
      try {
        await deleteRole(id)
      } catch (error: any) {
        alert(error.message || '删除失败')
      }
    }
  }

  const filteredRoles = roles.filter((role) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      role.name.toLowerCase().includes(keyword) ||
      (role.description && role.description.toLowerCase().includes(keyword))
    )
  })

  const columns = [
    {
      key: 'name',
      title: '角色名称',
      render: (_: any, record: Role) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      render: (_: any, record: Role) => (
        <span className="text-sm text-gray-600">{record.description || '-'}</span>
      ),
    },
    {
      key: 'permissions',
      title: '权限',
      render: (_: any, record: Role) => (
        <span className="text-sm text-gray-600">
          {Object.keys(record.permissions || {}).length} 项权限
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Role) => (
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
            <h1 className="text-2xl font-semibold text-gray-900">角色管理</h1>
            <p className="text-sm text-gray-600 mt-1">管理系统角色和权限</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增角色
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200">
        <Input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索角色名称、描述..."
          className="w-full"
        />
      </div>

      {/* 角色列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={filteredRoles} rowKey={(record) => record.id} />
      </div>

      {/* 新增/编辑角色弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingRole ? '编辑角色' : '新增角色'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入角色名称"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入角色描述"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">权限配置</label>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm text-gray-600">
                    权限配置功能正在开发中，当前版本暂不支持权限配置。
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
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
