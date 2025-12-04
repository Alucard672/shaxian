import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import ProductModal from '@/components/product/ProductModal'
import { Users, Plus, Edit, Trash2, Save, ArrowLeft, X } from 'lucide-react'
import { Employee } from '@/types/settings'

function EmployeeManagement() {
  const navigate = useNavigate()
  const { employees, addEmployee, updateEmployee, deleteEmployee, roles } = useSettingsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    role: '',
    status: 'active' as 'active' | 'inactive',
  })

  // 筛选员工
  const filteredEmployees = useMemo(() => {
    if (!searchKeyword) return employees
    const keyword = searchKeyword.toLowerCase()
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(keyword) ||
        e.position?.toLowerCase().includes(keyword) ||
        e.phone?.toLowerCase().includes(keyword) ||
        e.email?.toLowerCase().includes(keyword)
    )
  }, [employees, searchKeyword])

  // 分页数据
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, currentPage])

  // 角色选项
  const roleOptions = useMemo(() => {
    return roles.map((r) => ({ value: r.id, label: r.name }))
  }, [roles])

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        name: employee.name,
        position: employee.position || '',
        phone: employee.phone || '',
        email: employee.email || '',
        role: employee.role || '',
        status: employee.status,
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        name: '',
        position: '',
        phone: '',
        email: '',
        role: '',
        status: 'active',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
    setFormData({
      name: '',
      position: '',
      phone: '',
      email: '',
      role: '',
      status: 'active',
    })
  }

  const handleSave = () => {
    if (!formData.name) {
      alert('请输入员工姓名')
      return
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData)
    } else {
      addEmployee(formData)
    }
    handleCloseModal()
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个员工吗？')) {
      deleteEmployee(id)
    }
  }

  const columns = [
    {
      key: 'name',
      title: '姓名',
      render: (_: any, record: Employee) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'position',
      title: '职位',
      render: (_: any, record: Employee) => (
        <span className="text-sm text-gray-600">{record.position || '-'}</span>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      render: (_: any, record: Employee) => (
        <span className="text-sm text-gray-600">{record.phone || '-'}</span>
      ),
    },
    {
      key: 'email',
      title: '邮箱',
      render: (_: any, record: Employee) => (
        <span className="text-sm text-gray-600">{record.email || '-'}</span>
      ),
    },
    {
      key: 'role',
      title: '角色',
      render: (_: any, record: Employee) => {
        const role = roles.find((r) => r.id === record.role)
        return <span className="text-sm text-gray-600">{role?.name || '-'}</span>
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: Employee) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            record.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {record.status === 'active' ? '在职' : '离职'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: Employee) => (
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
            <h1 className="text-2xl font-semibold text-gray-900">人员列表</h1>
            <p className="text-sm text-gray-600 mt-1">管理员工信息，用于业务单据的制单人、经手人选择</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增员工
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
            placeholder="搜索员工姓名、职位、电话..."
            className="flex-1"
          />
        </div>
      </div>

      {/* 员工列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={paginatedEmployees} rowKey={(record) => record.id} />
        {filteredEmployees.length > pageSize && (
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
                第 {currentPage} 页，共 {Math.ceil(filteredEmployees.length / pageSize)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(Math.ceil(filteredEmployees.length / pageSize), p + 1))
                }
                disabled={currentPage >= Math.ceil(filteredEmployees.length / pageSize)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑员工弹窗 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? '编辑员工' : '新增员工'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              员工姓名 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入员工姓名"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">职位</label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="请输入职位"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入联系电话"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱地址"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择角色</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">在职</option>
              <option value="inactive">离职</option>
            </select>
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

export default EmployeeManagement

