import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductStore } from '@/store/productStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Download,
  Filter,
  Search,
  Edit,
  Settings,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import InventoryDetail from '../../components/inventory/InventoryDetail'

function Inventory() {
  const navigate = useNavigate()
  const { getInventoryDetails } = useInventoryStore()
  const { products, colors, batches } = useProductStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterType, setFilterType] = useState<'全部库存' | '低库存预警' | '库存异常'>('全部库存')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState<typeof inventoryDetails[0] | null>(null)
  const pageSize = 10

  // 获取库存明细
  const inventoryDetails = useMemo(() => {
    return getInventoryDetails()
  }, [products, colors, batches])

  // 统计数据
  const stats = useMemo(() => {
    const totalValue = inventoryDetails.reduce(
      (sum, item) => sum + (item.batch.purchasePrice || 0) * item.batch.stockQuantity,
      0
    )
    
    const uniqueProducts = new Set(inventoryDetails.map((item) => item.productId))
    const productCount = uniqueProducts.size
    
    // 低库存预警（假设最低库存为当前库存的50%）
    const lowStockItems = inventoryDetails.filter((item) => {
      const minStock = item.batch.initialQuantity * 0.5 // 简化：最低库存为初始数量的50%
      return item.batch.stockQuantity < minStock
    })
    
    // 库存周转率（简化计算）
    const turnoverRate = 3.8
    
    return {
      totalValue,
      productCount,
      lowStockCount: lowStockItems.length,
      turnoverRate,
    }
  }, [inventoryDetails])

  // 筛选库存
  const filteredInventory = useMemo(() => {
    let result = inventoryDetails

    // 按类型筛选
    if (filterType === '低库存预警') {
      result = result.filter((item) => {
        const minStock = item.batch.initialQuantity * 0.5
        return item.batch.stockQuantity < minStock
      })
    } else if (filterType === '库存异常') {
      // 库存异常：库存为0或负数
      result = result.filter((item) => item.batch.stockQuantity <= 0)
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (item) =>
          item.productName.toLowerCase().includes(keyword) ||
          item.colorName.toLowerCase().includes(keyword) ||
          item.colorCode.toLowerCase().includes(keyword) ||
          item.batch.code.toLowerCase().includes(keyword)
      )
    }

    return result.sort(
      (a, b) => new Date(b.batch.productionDate || '').getTime() - new Date(a.batch.productionDate || '').getTime()
    )
  }, [inventoryDetails, filterType, searchKeyword])

  // 分页数据
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredInventory.slice(start, end)
  }, [filteredInventory, currentPage])

  // 统计卡片
  const statCards = [
    {
      label: '库存总值',
      value: `¥${stats.totalValue.toLocaleString()}`,
      change: '-2.1%',
      icon: Package,
      iconBg: 'bg-primary-100',
      bgColor: 'bg-primary-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-danger-600',
    },
    {
      label: '商品种类',
      value: stats.productCount,
      change: '+5',
      icon: Package,
      iconBg: 'bg-purple-100',
      bgColor: 'bg-purple-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '低库存预警',
      value: stats.lowStockCount,
      change: '+3',
      icon: AlertTriangle,
      iconBg: 'bg-warning-100',
      bgColor: 'bg-warning-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
    {
      label: '库存周转率',
      value: `${stats.turnoverRate} 次/月`,
      change: '+0.5',
      icon: TrendingUp,
      iconBg: 'bg-success-100',
      bgColor: 'bg-success-50/50',
      borderColor: 'border-gray-200',
      changeColor: 'text-success-600',
    },
  ]

  // 表格列定义
  const inventoryColumns = [
    {
      key: 'product',
      title: '商品信息',
      render: (_: any, record: typeof inventoryDetails[0]) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-500" />
          <span className="font-medium">{record.productName}</span>
        </div>
      ),
    },
    {
      key: 'color',
      title: '色号',
      render: (_: any, record: typeof inventoryDetails[0]) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-gray-900 font-medium text-base">{record.colorCode}</span>
          <span className="text-gray-600 text-sm">{record.colorName}</span>
        </div>
      ),
    },
    {
      key: 'batch',
      title: '缸号',
      render: (_: any, record: typeof inventoryDetails[0]) => (
        <span className="text-gray-600 text-sm">{record.batch.code}</span>
      ),
    },
    {
      key: 'stock',
      title: '当前库存',
      render: (_: any, record: typeof inventoryDetails[0]) => {
        const product = products.find((p) => p.id === record.productId)
        const minStock = record.batch.initialQuantity * 0.5 // 简化：最低库存为初始数量的50%
        const isLowStock = record.batch.stockQuantity < minStock
        
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className={`font-medium text-base ${isLowStock ? 'text-danger-600' : 'text-gray-900'}`}>
                {record.batch.stockQuantity} {product?.unit || 'kg'}
              </span>
              {isLowStock && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-900 text-xs font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  低库存
                </span>
              )}
            </div>
            <span className="text-gray-600 text-xs">
              最低: {minStock.toFixed(0)} {product?.unit || 'kg'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'price',
      title: '单价',
      render: (_: any, record: typeof inventoryDetails[0]) => (
        <span className="text-gray-900 font-medium text-base">
          ¥{record.batch.purchasePrice?.toFixed(1) || '0.0'}
        </span>
      ),
    },
    {
      key: 'totalValue',
      title: '库存总值',
      render: (_: any, record: typeof inventoryDetails[0]) => {
        const totalValue = (record.batch.purchasePrice || 0) * record.batch.stockQuantity
        return (
          <span className="text-gray-900 font-medium text-base">
            ¥{totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        )
      },
    },
    {
      key: 'location',
      title: '仓位',
      render: (_: any, record: typeof inventoryDetails[0]) => {
        const location = record.batch.stockLocation || '-'
        // 假设格式为 "仓库名称-位置" 或 "位置"
        const parts = location.split('-')
        const warehouse = parts.length > 1 ? parts[0] : '1号仓库'
        const position = parts.length > 1 ? parts.slice(1).join('-') : location
        
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-900 text-sm">{warehouse}</span>
            <span className="text-gray-600 text-xs">{position}</span>
          </div>
        )
      },
    },
    {
      key: 'updateTime',
      title: '更新时间',
      render: (_: any, record: typeof inventoryDetails[0]) => {
        // 使用生产日期或创建时间作为更新时间
        const updateDate = record.batch.productionDate
          ? format(new Date(record.batch.productionDate), 'yyyy-MM-dd HH:mm')
          : format(new Date(), 'yyyy-MM-dd HH:mm')
        return <span className="text-gray-600 text-sm">{updateDate}</span>
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: typeof inventoryDetails[0]) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedInventory(record)
              setShowDetail(true)
            }}
            title="查看详情"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // 库存编辑功能暂未实现，可通过库存调整功能进行库存修改
              alert('库存编辑功能暂未实现，请使用"库存调整"功能进行库存修改')
            }}
            title="编辑"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">库存管理</h1>
        <p className="text-gray-600">
          实时追踪库存状态,支持按商品、色号、缸号三级查询和库存预警
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const changeBgColor = card.change.startsWith('-') ? 'bg-danger-100' : 'bg-success-100'
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
          {/* 第一行：筛选按钮、搜索框、导出、库存调整 */}
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
                placeholder="搜索商品、色号、缸号..."
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
            {/* 库存调整按钮 */}
            <Button
              onClick={() => navigate('/inventory/adjustment')}
              className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              库存调整
            </Button>
            {/* 库存盘点按钮 */}
            <Button
              onClick={() => navigate('/inventory/check')}
              className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              库存盘点
            </Button>
          </div>

          {/* 第二行：状态标签页 */}
          <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
            {(['全部库存', '低库存预警', '库存异常'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 库存明细表格 */}
      <Card className="rounded-xl overflow-hidden">
        {paginatedInventory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {searchKeyword || filterType !== '全部库存'
              ? '未找到匹配的库存记录'
              : '暂无库存记录'}
          </p>
        ) : (
          <>
            <Table columns={inventoryColumns} data={paginatedInventory} />
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">共 {filteredInventory.length} 条记录</span>
              <Pagination
                current={currentPage}
                total={filteredInventory.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* 库存详情弹窗 */}
      {showDetail && selectedInventory && (
        <InventoryDetail
          inventoryItem={selectedInventory}
          onClose={() => {
            setShowDetail(false)
            setSelectedInventory(null)
          }}
        />
      )}
    </div>
  )
}

export default Inventory
