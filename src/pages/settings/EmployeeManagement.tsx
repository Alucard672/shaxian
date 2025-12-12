import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import { Plus, Edit, Trash2, Save, ArrowLeft, Users } from 'lucide-react'
import { Employee } from '@/types/settings'

function EmployeeManagement() {
  const navigate = useNavigate()
  const { employees, loadEmployees, addEmployee, updateEmployee, deleteEmployee } = useSettingsStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    position: '',
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        name: employee.name,
        phone: employee.phone,
        email: employee.email || '',
        role: employee.role,
        position: employee.position || '',
        status: employee.status,
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: '',
        position: '',
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
      phone: '',
      email: '',
      role: '',
      position: '',
      status: 'active',
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('请填写姓名和手机号')
      return
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData)
      } else {
        await addEmployee(formData)
      }
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || '保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个员工吗？')) {
      try {
        await deleteEmployee(id)
      } catch (error: any) {
        alert(error.message || '删除失败')
      }
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const keyword = searchKeyword.toLowerCase()
    return (
      emp.name.toLowerCase().includes(keyword) ||
      emp.phone.includes(keyword) ||
      (emp.email && emp.email.toLowerCase().includes(keyword))
    )
  })

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
      key: 'phone',
      title: '手机号',
      dataIndex: 'phone' as const,
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
      dataIndex: 'role' as const,
    },
    {
      key: 'position',
      title: '职位',
      render: (_: any, record: Employee) => (
        <span className="text-sm text-gray-600">{record.position || '-'}</span>
      ),
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
          {record.status === 'active' ? '启用' : '禁用'}
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
            <h1 className="text-2xl font-semibold text-gray-900">员工管理</h1>
            <p className="text-sm text-gray-600 mt-1">管理系统员工信息</p>
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
        <Input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索姓名、手机号、邮箱..."
          className="w-full"
        />
      </div>

      {/* 员工列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <Table columns={columns} data={filteredEmployees} rowKey={(record) => record.id} />
      </div>

      {/* 新增/编辑员工弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingEmployee ? '编辑员工' : '新增员工'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="请输入角色"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">启用</option>
                  <option value="inactive">禁用</option>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
