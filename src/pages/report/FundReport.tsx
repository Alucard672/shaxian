import { useState, useMemo } from 'react'
import { useAccountStore } from '@/store/accountStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { CreditCard, Download, Filter, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function FundReport() {
  const navigate = useNavigate()
  const { receivables, payables, receipts, payments } = useAccountStore()

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const stats = useMemo(() => {
    const totalReceivable = receivables.reduce((sum, r) => sum + r.unpaidAmount, 0)
    const totalPayable = payables.reduce((sum, p) => sum + p.unpaidAmount, 0)
    const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0)
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const netCash = totalReceipts - totalPayments

    return { totalReceivable, totalPayable, totalReceipts, totalPayments, netCash }
  }, [receivables, payables, receipts, payments])

  const allTransactions = useMemo(() => {
    const trans = [
      ...receipts.map((r) => ({ ...r, type: '收款' as const, date: r.receiptDate, amount: r.amount })),
      ...payments.map((p) => ({ ...p, type: '付款' as const, date: p.paymentDate, amount: -p.amount })),
    ]
    return trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [receipts, payments])

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allTransactions.slice(start, start + pageSize)
  }, [allTransactions, currentPage])

  const columns = [
    { key: 'date', title: '日期', render: (_: any, r: typeof allTransactions[0]) => <span>{r.date}</span> },
    { key: 'type', title: '类型', render: (_: any, r: typeof allTransactions[0]) => (
      <span className={`px-2 py-1 text-xs rounded-full ${r.type === '收款' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {r.type}
      </span>
    )},
    { key: 'amount', title: '金额', render: (_: any, r: typeof allTransactions[0]) => (
      <span className={r.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
        {r.amount > 0 ? '+' : ''}¥{Math.abs(r.amount).toLocaleString()}
      </span>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/report')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">资金报表</h1>
          <p className="text-gray-600 mt-1">查看资金流水和账务统计</p>
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">应收账款</div>
          <div className="text-2xl font-semibold text-green-600">¥{stats.totalReceivable.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">应付账款</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.totalPayable.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">累计收款</div>
          <div className="text-2xl font-semibold text-green-600">¥{stats.totalReceipts.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">累计付款</div>
          <div className="text-2xl font-semibold text-red-600">¥{stats.totalPayments.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">净现金流</div>
          <div className={`text-2xl font-semibold ${stats.netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.netCash >= 0 ? '+' : ''}¥{stats.netCash.toLocaleString()}
          </div>
        </Card>
      </div>

      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">资金流水</h2>
        </div>
        {paginatedTransactions.length === 0 ? (
          <p className="text-center py-8 text-gray-500">暂无数据</p>
        ) : (
          <>
            <Table columns={columns} data={paginatedTransactions} />
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-sm text-gray-600">共 {allTransactions.length} 条记录</span>
              <Pagination current={currentPage} total={allTransactions.length} pageSize={pageSize} onChange={setCurrentPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default FundReport

