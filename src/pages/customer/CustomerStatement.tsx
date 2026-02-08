import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '@/store/contactStore'
import { useAccountStore } from '@/store/accountStore'
import { useSalesStore } from '@/store/salesStore'
import { Customer } from '@/types/contact'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ModernTable from '../../components/ui/ModernTable'
import Pagination from '../../components/ui/Pagination'
import BaseCard from '../../components/ui/BaseCard'
import { Users, DollarSign, Calendar, FileText, X } from 'lucide-react'
import { differenceInDays } from 'date-fns'

function CustomerStatement() {
  const navigate = useNavigate()
  const { customers, loading: loadingContacts, loadAll: loadContacts } = useContactStore()
  const { receivables, loading: loadingAccounts, loadAll: loadAccounts } = useAccountStore()
  const { orders: salesOrders, loading: loadingOrders, loadOrders } = useSalesStore()

  useEffect(() => {
    loadContacts()
    loadAccounts()
    loadOrders()
  }, [loadContacts, loadAccounts, loadOrders])

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loading = loadingContacts || loadingAccounts || loadingOrders

  // 计算每个客户的账款、未拿货天数等信息
  const customerStatements = useMemo(() => {
    const customerList = customers ?? []
    const accountList = receivables ?? []
    const orderList = salesOrders ?? []

    return customerList.map((customer) => {
      // 计算客户账款
      const customerAccounts = accountList.filter((a) => a.customerId === customer.id)
      const totalUnpaidAmount = customerAccounts
        .filter((a) => a.status === '未结清')
        .reduce((sum, a) => sum + a.unpaidAmount, 0)

      // 计算未拿货天数（找到最早的未完成订单）
      const customerOrders = orderList.filter((o) => o.customerId === customer.id && o.status !== '已作废')
      const pendingOrders = customerOrders.filter((o) => {
        if (o.status === '已完成') return false
        const deliveryDate = o.deliveryDate || o.expectedDate
        if (!deliveryDate) return false
        const today = new Date()
        const delivery = new Date(deliveryDate)
        const daysDiff = differenceInDays(today, delivery)
        return daysDiff > 0
      })

      let undeliveredDays = 0
      if (pendingOrders.length > 0) {
        const daysList = pendingOrders.map((o) => {
          const deliveryDate = o.deliveryDate || o.expectedDate
          if (!deliveryDate) return 0
          const today = new Date()
          const delivery = new Date(deliveryDate)
          return differenceInDays(today, delivery)
        }).filter((d) => d > 0)

        undeliveredDays = daysList.length > 0 ? Math.max(...daysList) : 0
      }

      // 订单数量
      const totalOrders = customerOrders.length

      return {
        ...customer,
        totalUnpaidAmount,
        undeliveredDays,
        totalOrders,
        accountCount: customerAccounts.length,
      }
    }).filter((cs) => cs.status === '正常')
  }, [customers, receivables, salesOrders])

  // 分页
  const paginatedStatements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return customerStatements.slice(start, end)
  }, [customerStatements, currentPage])

  // 获取客户的拿货记录
  const getCustomerOrders = (customerId: string) => {
    const orderList = salesOrders ?? []
    return orderList.filter((o) => o.customerId === customerId && o.status !== '已作废')
      .sort((a, b) => new Date(b.salesDate).getTime() - new Date(a.salesDate).getTime())
  }

  // 处理查看详情
  const handleViewDetail = (customer: any) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '客户名称',
      key: 'name',
      render: (_: any, record: any) => (
        <button
          onClick={() => handleViewDetail(record)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {record.name}
        </button>
      ),
    },
    {
      title: '客户账款',
      key: 'totalUnpaidAmount',
      render: (_: any, record: any) => (
        <span className={record.totalUnpaidAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          ¥{record.totalUnpaidAmount.toFixed(2)}
        </span>
      ),
    },
    {
      title: '未拿货天数',
      key: 'undeliveredDays',
      render: (_: any, record: any) => (
        <span className={record.undeliveredDays > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
          {record.undeliveredDays > 0 ? `${record.undeliveredDays}天` : '无'}
        </span>
      ),
    },
    {
      title: '订单数量',
      key: 'totalOrders',
      render: (_: any, record: any) => <span className="text-gray-600">{record.totalOrders}单</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleViewDetail(record)}
          className="text-blue-600 hover:text-blue-800"
        >
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">客户对账</h1>
        <p className="text-gray-600">查看客户账款、未拿货天数和拿货记录</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-gray-200 bg-blue-50/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-600">正常客户</div>
              <div className="text-lg font-semibold text-gray-900">{customerStatements.length}</div>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200 bg-red-50/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-600">总欠款</div>
              <div className="text-lg font-semibold text-red-600">
                ¥{customerStatements.reduce((sum, cs) => sum + cs.totalUnpaidAmount, 0).toFixed(2)}
              </div>
            </div>
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-gray-200 bg-orange-50/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-gray-600">超期未拿货客户</div>
              <div className="text-lg font-semibold text-orange-600">
                {customerStatements.filter((cs) => cs.undeliveredDays > 0).length}
              </div>
            </div>
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* 客户列表 */}
      <Card className="border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : customerStatements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>暂无客户数据</p>
          </div>
        ) : (
          <>
            <ModernTable
              columns={columns}
              data={paginatedStatements}
              rowKey={(record) => record.id}
            />
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={customerStatements.length}
                onChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* 详情弹窗 */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 弹窗标题 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">客户拿货记录 - {selectedCustomer.name}</span>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedCustomer(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 客户信息 */}
              <BaseCard padding="md" className="bg-blue-50/50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">客户名称</div>
                    <div className="text-sm font-medium text-gray-900">{selectedCustomer.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">联系电话</div>
                    <div className="text-sm text-gray-600">{selectedCustomer.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">客户账款</div>
                    <div className={`text-sm font-medium ${selectedCustomer.totalUnpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ¥{selectedCustomer.totalUnpaidAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </BaseCard>

              {/* 拿货记录 */}
              <BaseCard padding="none">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-900">拿货记录</h3>
                    <span className="text-xs text-gray-500">共 {getCustomerOrders(selectedCustomer.id).length} 条</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">销售单号</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">销售日期</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">交货日期</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">总金额</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">已收金额</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">欠款金额</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getCustomerOrders(selectedCustomer.id).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/sales/${order.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{order.salesDate}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {order.deliveryDate || order.expectedDate || '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">¥{order.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">¥{order.paidAmount.toFixed(2)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${order.unpaidAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ¥{order.unpaidAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === '已完成' ? 'bg-green-100 text-green-700' :
                              order.status === '草稿' ? 'bg-gray-100 text-gray-700' :
                              order.status === '待审核' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {getCustomerOrders(selectedCustomer.id).length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            暂无拿货记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </BaseCard>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerStatement
