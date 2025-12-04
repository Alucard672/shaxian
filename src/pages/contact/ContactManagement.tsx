import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '@/store/contactStore'
import { useAccountStore } from '@/store/accountStore'
import { useSalesStore } from '@/store/salesStore'
import { usePurchaseStore } from '@/store/purchaseStore'
import { Customer, Supplier } from '@/types/contact'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import ContactDetail from '../../components/contact/ContactDetail'
import {
  Plus,
  Edit,
  Eye,
  Users,
  Building2,
  Download,
  Filter,
  Search,
  Phone,
  Mail,
} from 'lucide-react'

type ContactType = '全部' | '客户' | '供应商' | 'VIP客户'

function ContactManagement() {
  const navigate = useNavigate()
  const { customers, suppliers, deleteCustomer, deleteSupplier, getCustomer, getSupplier } = useContactStore()
  const { receivables, payables } = useAccountStore()
  const { orders: salesOrders } = useSalesStore()
  const { orders: purchaseOrders } = usePurchaseStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [tabType, setTabType] = useState<ContactType>('全部')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedContact, setSelectedContact] = useState<{ contact: Customer | Supplier; type: 'customer' | 'supplier' } | null>(null)
  const pageSize = 10

  // 统计数据
  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const totalSuppliers = suppliers.length
    const activeCustomers = customers.filter((c) => c.status === '正常').length
    const thisMonthNew = customers.filter((c) => {
      const createdDate = new Date(c.createdAt)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    }).length + suppliers.filter((s) => {
      const createdDate = new Date(s.createdAt)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    }).length

    return {
      totalCustomers,
      totalSuppliers,
      activeCustomers,
      thisMonthNew,
    }
  }, [customers, suppliers])

  // 合并客户和供应商数据
  const allContacts = useMemo(() => {
    const customerList = customers.map((c) => ({
      id: c.id,
      type: '客户' as const,
      code: c.code,
      name: c.name,
      contactPerson: c.contactPerson || '',
      phone: c.phone || '',
      email: '',
      address: c.address || '',
      tags: [] as string[],
      contact: c,
    }))

    const supplierList = suppliers.map((s) => ({
      id: s.id,
      type: '供应商' as const,
      code: s.code,
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: '',
      address: s.address || '',
      tags: [] as string[],
      contact: s,
    }))

    return [...customerList, ...supplierList]
  }, [customers, suppliers])

  // 筛选联系人
  const filteredContacts = useMemo(() => {
    let result = allContacts

    // 按类型筛选
    if (tabType === '客户') {
      result = result.filter((c) => c.type === '客户')
    } else if (tabType === '供应商') {
      result = result.filter((c) => c.type === '供应商')
    } else if (tabType === 'VIP客户') {
      // TODO: VIP客户筛选逻辑
      result = result.filter((c) => c.type === '客户')
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          c.code.toLowerCase().includes(keyword) ||
          c.contactPerson.toLowerCase().includes(keyword) ||
          c.phone.toLowerCase().includes(keyword)
      )
    }

    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [allContacts, tabType, searchKeyword])

  // 分页数据
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredContacts.slice(start, end)
  }, [filteredContacts, currentPage])

  // 获取交易统计
  const getTransactionStats = (contactId: string, type: '客户' | '供应商') => {
    if (type === '客户') {
      const customerOrders = salesOrders.filter((o) => o.customerId === contactId)
      const customerReceivables = receivables.filter((r) => r.customerId === contactId)
      const totalAmount = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      const unpaidAmount = customerReceivables
        .filter((r) => r.status === '未结清')
        .reduce((sum, r) => sum + r.unpaidAmount, 0)

      return {
        transactionCount: customerOrders.length,
        totalAmount,
        unpaidAmount,
      }
    } else {
      const supplierOrders = purchaseOrders.filter((o) => o.supplierId === contactId)
      const supplierPayables = payables.filter((p) => p.supplierId === contactId)
      const totalAmount = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      const unpaidAmount = supplierPayables
        .filter((p) => p.status === '未结清')
        .reduce((sum, p) => sum + p.unpaidAmount, 0)

      return {
        transactionCount: supplierOrders.length,
        totalAmount,
        unpaidAmount,
      }
    }
  }

  // 统计卡片
  const statCards = [
    {
      label: '客户总数',
      value: stats.totalCustomers,
      change: '+12',
      icon: Users,
      iconBg: 'bg-primary-100',
      bgColor: 'bg-primary-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '供应商总数',
      value: stats.totalSuppliers,
      change: '+3',
      icon: Building2,
      iconBg: 'bg-purple-100',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '活跃客户',
      value: stats.activeCustomers,
      change: '+8',
      icon: Users,
      iconBg: 'bg-success-100',
      bgColor: 'bg-success-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '本月新增',
      value: stats.thisMonthNew,
      change: '+5',
      icon: Plus,
      iconBg: 'bg-warning-100',
      bgColor: 'bg-warning-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
  ]

  // 标签页
  const tabs = [
    { key: '全部', label: '全部' },
    { key: '客户', label: '客户' },
    { key: '供应商', label: '供应商' },
    { key: 'VIP客户', label: 'VIP客户' },
  ]

  // 表格列定义
  const contactColumns = [
    {
      key: 'type',
      title: '类型',
      render: (_: any, record: typeof allContacts[0]) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            record.type === '客户' ? 'bg-primary-100' : 'bg-purple-100'
          }`}>
            {record.type === '客户' ? (
              <Users className="w-4 h-4 text-primary-600" />
            ) : (
              <Building2 className="w-4 h-4 text-purple-600" />
            )}
          </div>
          <span className={`text-sm font-medium ${
            record.type === '客户' ? 'text-primary-600' : 'text-purple-600'
          }`}>
            {record.type}
          </span>
        </div>
      ),
    },
    {
      key: 'code',
      title: '编号',
      render: (_: any, record: typeof allContacts[0]) => (
        <span className="text-gray-600 text-sm">{record.code}</span>
      ),
    },
    {
      key: 'name',
      title: '名称',
      render: (_: any, record: typeof allContacts[0]) => (
        <span className="text-gray-900 font-medium text-base">{record.name}</span>
      ),
    },
    {
      key: 'contactPerson',
      title: '联系人',
      render: (_: any, record: typeof allContacts[0]) => (
        <span className="text-gray-900 text-sm">{record.contactPerson || '-'}</span>
      ),
    },
    {
      key: 'contactInfo',
      title: '联系方式',
      render: (_: any, record: typeof allContacts[0]) => (
        <div className="flex flex-col gap-1">
          {record.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 text-sm">{record.phone}</span>
            </div>
          )}
          {record.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500 text-xs">{record.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tags',
      title: '标签',
      render: (_: any, record: typeof allContacts[0]) => {
        // 根据类型和状态生成标签
        const tags: string[] = []
        if (record.type === '客户') {
          const customer = record.contact as Customer
          if (customer.status === '正常') {
            // 可以根据交易次数判断是否为VIP
            const stats = getTransactionStats(record.id, record.type)
            if (stats.transactionCount > 50) {
              tags.push('VIP客户')
            }
            if (stats.transactionCount > 20) {
              tags.push('长期合作')
            }
          }
        } else {
          const supplier = record.contact as Supplier
          if (supplier.status === '合作中') {
            tags.push('核心供应商')
            tags.push('质量稳定')
          }
        }
        
        return (
          <div className="flex flex-wrap items-center gap-1">
            {tags.length > 0 ? (
              tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-900 text-xs font-medium rounded-full flex items-center gap-1"
                >
                  <span className="w-2 h-2 bg-gray-900 rounded-full" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'transactionCount',
      title: '交易次数',
      render: (_: any, record: typeof allContacts[0]) => {
        const stats = getTransactionStats(record.id, record.type)
        return <span className="text-gray-900 text-sm">{stats.transactionCount} 次</span>
      },
    },
    {
      key: 'totalAmount',
      title: '交易总额',
      render: (_: any, record: typeof allContacts[0]) => {
        const stats = getTransactionStats(record.id, record.type)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-900 font-medium text-base">
              ¥{stats.totalAmount.toLocaleString()}
            </span>
            {stats.unpaidAmount > 0 && (
              <span className="text-danger-600 text-xs">
                欠款 ¥{stats.unpaidAmount.toLocaleString()}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (_: any, record: typeof allContacts[0]) => {
        const status = record.type === '客户'
          ? (record.contact as Customer).status
          : (record.contact as Supplier).status
        const isActive = status === '正常' || status === '合作中'
        return (
          <span className={`px-2.5 py-1 ${
            isActive ? 'bg-success-100' : 'bg-gray-100'
          } ${
            isActive ? 'text-success-700' : 'text-gray-700'
          } text-sm font-medium rounded-full`}>
            {status}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof allContacts[0]) => {
        const handleView = () => {
          const contact = record.type === '客户' 
            ? getCustomer(record.id)
            : getSupplier(record.id)
          if (contact) {
            setSelectedContact({
              contact,
              type: record.type === '客户' ? 'customer' : 'supplier'
            })
            setShowDetail(true)
          }
        }
        
        const handleEdit = () => {
          navigate(`/contact/${record.type === '客户' ? 'customer' : 'supplier'}/${record.id}/edit`)
        }
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleView}
              title="查看"
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleEdit}
              title="编辑"
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">往来单位</h1>
        <p className="text-gray-600">
          管理往来单位信息,维护客户和供应商关系
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const changeBgColor = 'bg-success-100'
          return (
            <Card key={index} className={`p-4 border ${card.borderColor} ${card.bgColor} rounded-xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">{card.label}</div>
                  <div className="text-lg font-semibold text-gray-900">{card.value}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className={`px-1.5 py-0.5 ${changeBgColor} ${card.changeColor} text-xs font-medium rounded`}>
                    {card.change}
                  </div>
                  <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 搜索和筛选栏 */}
      <Card className="p-4 rounded-xl">
        <div className="space-y-4">
          {/* 第一行：筛选按钮 + 搜索框 + 导出 + 新增 */}
          <div className="flex items-center gap-4">
            {/* 筛选按钮 */}
            <Button variant="outline" className="h-[39px] rounded-xl border-gray-200">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索客户或供应商..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 h-[39px] border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {/* 导出按钮 */}
            <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
            {/* 新增往来单位按钮 */}
            <Button 
              className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
              onClick={() => {
                const contactType = tabType === '供应商' ? 'supplier' : 'customer'
                navigate(`/contact/${contactType}/create`)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              新增往来单位
            </Button>
          </div>

          {/* 第二行：状态标签页 */}
          <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setTabType(tab.key as ContactType)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tabType === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 往来单位列表表格 */}
      <Card className="rounded-xl overflow-hidden">
        {paginatedContacts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || tabType !== '全部'
              ? '未找到匹配的往来单位'
              : '暂无往来单位，请添加'}
          </p>
        ) : (
          <>
            <Table columns={contactColumns} data={paginatedContacts} />
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">共 {filteredContacts.length} 条记录</span>
              <Pagination
                current={currentPage}
                total={filteredContacts.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* 详情弹窗 */}
      {showDetail && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <ContactDetail
            contact={selectedContact.contact}
            type={selectedContact.type}
            onEdit={() => {
              setShowDetail(false)
              navigate(`/contact/${selectedContact.type}/${selectedContact.contact.id}/edit`)
            }}
            onClose={() => {
              setShowDetail(false)
              setSelectedContact(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ContactManagement



