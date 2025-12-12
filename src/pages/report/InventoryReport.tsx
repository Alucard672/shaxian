import { useMemo } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import { Warehouse, Download, Filter, ArrowLeft, AlertTriangle } from 'lucide-react'
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

function InventoryReport() {
  const navigate = useNavigate()
  const inventoryData = useInventoryStore((state) => state.getInventoryByProduct())
  const inventoryDetails = useInventoryStore((state) => state.getInventoryDetails())
  const lowStockAlerts = useInventoryStore((state) => state.getLowStockAlerts(100))

  const stats = useMemo(() => {
    const totalProducts = inventoryData.length
    const totalStock = inventoryData.reduce((sum, p) => sum + p.totalStock, 0)
    const totalBatches = inventoryDetails.length
    const totalValue = inventoryDetails.reduce((sum, d) => {
      const batchValue = d.batch.stockQuantity * (d.batch.purchasePrice || 0)
      return sum + batchValue
    }, 0)
    const lowStockCount = lowStockAlerts.length

    return { totalProducts, totalStock, totalBatches, totalValue, lowStockCount }
  }, [inventoryData, inventoryDetails, lowStockAlerts])

  const topProducts = useMemo(() => {
    return [...inventoryData]
      .sort((a, b) => b.totalStock - a.totalStock)
      .slice(0, 10)
      .map((item) => ({
        name: item.productName,
        stock: item.totalStock,
        unit: item.unit,
      }))
  }, [inventoryData])

  const columns = [
    { key: 'productName', title: '商品名称', render: (_: any, r: typeof inventoryData[0]) => <span className="font-medium">{r.productName}</span> },
    { key: 'productCode', title: '商品编码', render: (_: any, r: typeof inventoryData[0]) => <span>{r.productCode}</span> },
    { key: 'totalStock', title: '库存数量', render: (_: any, r: typeof inventoryData[0]) => <span>{r.totalStock} {r.unit}</span> },
    { key: 'colors', title: '色号数量', render: (_: any, r: typeof inventoryData[0]) => <span>{r.colors.length} 个</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/report')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">库存报表</h1>
          <p className="text-gray-600 mt-1">查看库存数据统计和分析</p>
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
          <div className="text-sm text-gray-600 mb-1">商品种类</div>
          <div className="text-2xl font-semibold">{stats.totalProducts} 种</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">库存总量</div>
          <div className="text-2xl font-semibold">{stats.totalStock.toLocaleString()} kg</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">缸号数量</div>
          <div className="text-2xl font-semibold">{stats.totalBatches} 个</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">库存总值</div>
          <div className="text-2xl font-semibold">¥{stats.totalValue.toLocaleString()}</div>
        </Card>
        <Card className="p-5 border rounded-2xl">
          <div className="text-sm text-gray-600 mb-1">低库存预警</div>
          <div className="text-2xl font-semibold text-red-600">{stats.lowStockCount} 个</div>
        </Card>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">库存TOP10</h2>
        <div className="h-80">
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" name="库存数量" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
          )}
        </div>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">库存明细</h2>
        </div>
        {inventoryData.length === 0 ? (
          <p className="text-center py-8 text-gray-500">暂无数据</p>
        ) : (
          <Table columns={columns} data={inventoryData} />
        )}
      </Card>
    </div>
  )
}

export default InventoryReport







