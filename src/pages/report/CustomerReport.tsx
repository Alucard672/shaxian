import { useState, useMemo } from 'react'
import { useContactStore } from '@/store/contactStore'
import { useSalesStore } from '@/store/salesStore'
import { useAccountStore } from '@/store/accountStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { Users, Download, Filter, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function CustomerReport() {
  const navigate = useNavigate()
  const { customers } = useContactStore()
  const { orders: salesOrders } = useSalesStore()
  const { receivables } = useAccountStore()

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const customerStats = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders = salesOrders.filter((o) => o.customerId === customer.id)
      const customerReceivables = receivables.filter((r) => r.customerId === customer.id)
      const totalAmount = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      const unpaidAmount = customerReceivables
        .filter((r) => r.status === '未结清')
        .reduce((sum, r) => sum + r.unpaidAmount, 0)

      return {
        ...customer,
        orderCount: customerOrders.length,
        totalAmount,
        unpaidAmount,
        lastOrderDate: customerOrders.length > 0
          ? customerOrders.sort((a, b) => new Date(b.salesDate).getTime() - new Date(a.salesDate).getTime())[0].salesDate
          : '-',
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount)
  }, [customers, salesOrders, receivables])

  const topCustomers = useMemo(() => {
    return customerStats.slice(0, 10).map((item) => ({
      name: item.name,
      amount: item.totalAmount,
      orderCount: item.orderCount,
    }))
  }, [customerStats])

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return customerStats.slice(start, start + pageSize)
  }, [customerStats, currentPage])

  const columns = [
    { key: 'name', title: '客户名称', render: (_: any, r: typeof customerStats[0]) => <span className="font-medium">{r.name}</span> },
    { key: 'code', title: '客户编码', render: (_: any, r: typeof customerStats[0]) => <span>{r.code}</span> },
    { key: 'orderCount', title: '订单数量', render: (_: any, r: typeof customerStats[0]) => <span>{r.orderCount} 笔</span> },
    { key: 'totalAmount', title: '交易总额', render: (_: any, r: typeof customerStats[0]) => <span className="font-medium">¥{r.totalAmount.toLocaleString()}</span> },
    { key: 'unpaidAmount', title: '未收金额', render: (_: any, r: typeof customerStats[0]) => <span className={r.unpaidAmount > 0 ? 'text-red-600' : ''}>¥{r.unpaidAmount.toLocaleString()}</span> },
    { key: 'lastOrderDate', title: '最后交易', render: (_: any, r: typeof customerStats[0]) => <span className="text-gray-600">{r.lastOrderDate}</span> },
  ]

  const stats = useMemo(() => {
    const totalCustomers = customers.length
    const activeCustomers = customers.filter((c) => c.status === '正常').length
    const totalAmount = customerStats.reduce((sum, c) => sum + c.totalAmount, 0)
    const totalUnpaid = customerStats.reduce((sum, c) => sum + c.unpaidAmount, 0)

    return { totalCustomers, activeCustomers, totalAmount, totalUnpaid }
  }, [customers, customerStats])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/report')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">客户报表</h1>
          <p className="text-gray-600 mt-1">查看客户交易数据统计和分析</p>
        </div>
      </div>

      <Card className="p-4 rounded-xl">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="h-[38px]">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
          <Button className="h-[38px] bg-primary-600">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">客户总数</div>
          <div className="text-2xl font-semibold">{stats.totalCustomers} 个</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">活跃客户</div>
          <div className="text-2xl font-semibold">{stats.activeCustomers} 个</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">交易总额</div>
          <div className="text-2xl font-semibold">¥{stats.totalAmount.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">未收总额</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.totalUnpaid.toLocaleString()}</div>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">客户交易TOP10</h2>
        <div className="h-80">
          {topCustomers.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`¥${value.toLocaleString()}`, '交易额']} />
                <Bar dataKey="amount" fill="#3b82f6" name="交易额" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
          )}
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">客户明细</h2>
        </div>
        {paginatedCustomers.length === 0 ? (
          <p className="text-center py-8 text-gray-500">暂无数据</p>
        ) : (
          <>
            <Table columns={columns} data={paginatedCustomers} />
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-gray-600">共 {customerStats.length} 条记录</span>
              <Pagination current={currentPage} total={customerStats.length} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default CustomerReport



