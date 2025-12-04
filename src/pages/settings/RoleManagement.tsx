import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Table from '@/components/ui/Table'
import ProductModal from '@/components/product/ProductModal'
import { Shield, Plus, Edit, Trash2, Save, ArrowLeft } from 'lucide-react'
import { Role } from '@/types/settings'

// 权限选项
const permissionOptions = [
  { value: 'product.view', label: '商品查看' },
  { value: 'product.create', label: '商品创建' },
  { value: 'product.edit', label: '商品编辑' },
  { value: 'product.delete', label: '商品删除' },
  { value: 'purchase.view', label: '进货查看' },
  { value: 'purchase.create', label: '进货创建' },
  { value: 'purchase.edit', label: '进货编辑' },
  { value: 'purchase.delete', label: '进货删除' },
  { value: 'sales.view', label: '销售查看' },
  { value: 'sales.create', label: '销售创建' },
  { value: 'sales.edit', label: '销售编辑' },
  { value: 'sales.delete', label: '销售删除' },
  { value: 'inventory.view', label: '库存查看' },
  { value: 'inventory.edit', label: '库存编辑' },
  { value: 'account.view', label: '账款查看' },
  { value: 'account.edit', label: '账款编辑' },
  { value: 'report.view', label: '报表查看' },
  { value: 'settings.edit', label: '系统设置编辑' },
]

function RoleManagement() {
  const navigate = useNavigate()
  const { roles, addRole, updateRole, deleteRole } = useSettingsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })

  // 筛选角色
  const filteredRoles = useMemo(() => {
    if (!searchKeyword) return roles
    const keyword = searchKeyword.toLowerCase()
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(keyword) ||
        r.description?.toLowerCase().includes(keyword)
    )
  }, [roles, searchKeyword])

  // 分页数据
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRoles.slice(start, start + pageSize)
  }, [filteredRoles, currentPage])

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permissions: [],
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
      permissions: [],
    })
  }

  const handleSave = () => {
    if (!formData.name) {
      alert('请输入角色名称')
      return
    }

    if (editingRole) {
      updateRole(editingRole.id, formData)
    } else {
      addRole(formData)
    }
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个角色吗？删除后使用该角色的员工将失去相关权限。')) {
      deleteRole(id)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

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
      title: '角色描述',
      render: (_: any, record: Role) => (
        <span className="text-sm text-gray-600">{record.description || '-'}</span>
      ),
    },
    {
      key: 'permissions',
      title: '权限数量',
      render: (_: any, record: Role) => (
        <span className="text-sm text-gray-600">{record.permissions?.length || 0} 项</span>
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
            <p className="text-sm text-gray-600 mt-1">管理系统角色和权限配置</p>
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
        <div className="flex items-center gap-4">
          <Input
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="搜索角色名称、描述..."
            className="flex-1"
          />
        </div>
      </div>

      {/* 角色列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={paginatedRoles} rowKey={(record) => record.id} />
        {filteredRoles.length > pageSize && (
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
                第 {currentPage} 页，共 {Math.ceil(filteredRoles.length / pageSize)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(Math.ceil(filteredRoles.length / pageSize), p + 1))
                }
                disabled={currentPage >= Math.ceil(filteredRoles.length / pageSize)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑角色弹窗 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? '编辑角色' : '新增角色'}
        size="lg"
      >
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
            <label className="block text-sm font-medium text-gray-700 mb-2">角色描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入角色描述"
              rows={3}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">权限配置</label>
            <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {permissionOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(option.value)}
                      onChange={() => togglePermission(option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              已选择 {formData.permissions.length} 项权限
            </p>
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

export default RoleManagement

