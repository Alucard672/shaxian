import { useMemo } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductStore } from '@/store/productStore'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { X, Package, AlertTriangle, MapPin, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

interface InventoryDetailProps {
  inventoryItem: {
    productId: string
    productName: string
    productCode: string
    colorId: string
    colorName: string
    colorCode: string
    batch: {
      id: string
      code: string
      productionDate?: string
      supplierId?: string
      supplierName?: string
      purchasePrice?: number
      stockQuantity: number
      initialQuantity: number
      stockLocation?: string
      remark?: string
    }
  }
  onClose: () => void
}

function InventoryDetail({ inventoryItem, onClose }: InventoryDetailProps) {
  const { products, colors } = useProductStore()
  const { getInventoryByProductId } = useInventoryStore()

  const product = products.find(p => p.id === inventoryItem.productId)
  const color = colors.find(c => c.id === inventoryItem.colorId)

  // 获取该商品的所有库存信息
  const inventoryInfo = useMemo(() => {
    return getInventoryByProductId(inventoryItem.productId)
  }, [inventoryItem.productId, getInventoryByProductId])

  // 计算库存状态
  const stockStatus = useMemo(() => {
    const minStock = inventoryItem.batch.initialQuantity * 0.5
    if (inventoryItem.batch.stockQuantity <= 0) {
      return { label: '缺货', variant: 'danger' as const, bgColor: 'bg-red-100', textColor: 'text-red-700' }
    } else if (inventoryItem.batch.stockQuantity < minStock) {
      return { label: '低库存', variant: 'warning' as const, bgColor: 'bg-orange-100', textColor: 'text-orange-700' }
    } else {
      return { label: '正常', variant: 'success' as const, bgColor: 'bg-green-100', textColor: 'text-green-700' }
    }
  }, [inventoryItem.batch])

  // 统计信息
  const stats = useMemo(() => {
    if (!inventoryInfo) return null

    const colorInfo = inventoryInfo.colors.find(c => c.color.id === inventoryItem.colorId)
    const colorTotalStock = colorInfo?.totalStock || 0
    const productTotalStock = inventoryInfo.totalStock

    return {
      colorTotalStock,
      productTotalStock,
      stockValue: (inventoryItem.batch.purchasePrice || 0) * inventoryItem.batch.stockQuantity,
      totalValue: productTotalStock * (inventoryItem.batch.purchasePrice || 0),
    }
  }, [inventoryInfo, inventoryItem])

  // 同色号的其他缸号
  const otherBatches = useMemo(() => {
    if (!inventoryInfo) return []
    const colorInfo = inventoryInfo.colors.find(c => c.color.id === inventoryItem.colorId)
    return colorInfo?.batches.filter(b => b.id !== inventoryItem.batch.id) || []
  }, [inventoryInfo, inventoryItem])

  // 表格列定义（其他缸号）
  const batchColumns = [
    {
      key: 'code',
      title: '缸号',
      render: (_: any, record: typeof otherBatches[0]) => (
        <span className="text-gray-900 font-medium">{record.code}</span>
      ),
    },
    {
      key: 'productionDate',
      title: '生产日期',
      render: (_: any, record: typeof otherBatches[0]) => (
        <span className="text-gray-600 text-sm">
          {record.productionDate ? format(new Date(record.productionDate), 'yyyy-MM-dd') : '-'}
        </span>
      ),
    },
    {
      key: 'stockQuantity',
      title: '库存数量',
      render: (_: any, record: typeof otherBatches[0]) => (
        <span className="text-gray-900 font-medium">{record.stockQuantity} {product?.unit || 'kg'}</span>
      ),
    },
    {
      key: 'purchasePrice',
      title: '单价',
      render: (_: any, record: typeof otherBatches[0]) => (
        <span className="text-gray-600">¥{record.purchasePrice?.toFixed(1) || '0.0'}</span>
      ),
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">库存详情</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {inventoryItem.productName} - {inventoryItem.colorCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <div className="w-full px-3 py-2 h-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
                  {inventoryItem.productName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品编码</label>
                <div className="w-full px-3 py-2 h-9 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  {inventoryItem.productCode}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">色号</label>
                <div className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-900 flex items-center gap-2">
                  <span className="font-medium">{inventoryItem.colorCode}</span>
                  <span className="text-gray-600">({inventoryItem.colorName})</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">缸号</label>
                <div className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-900 font-medium">
                  {inventoryItem.batch.code}
                </div>
              </div>
            </div>
          </div>

          {/* 库存信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">库存信息</h3>
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">当前库存</span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {inventoryItem.batch.stockQuantity} {product?.unit || 'kg'}
                </div>
                <div className="mt-2">
                  <Badge
                    variant={stockStatus.variant}
                    className={`${stockStatus.bgColor} ${stockStatus.textColor}`}
                  >
                    {stockStatus.label}
                  </Badge>
                </div>
              </Card>
              <Card className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">初始数量</span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  {inventoryItem.batch.initialQuantity} {product?.unit || 'kg'}
                </div>
              </Card>
              <Card className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">采购单价</span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  ¥{inventoryItem.batch.purchasePrice?.toFixed(2) || '0.00'}
                </div>
              </Card>
              <Card className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">库存价值</span>
                </div>
                <div className="text-xl font-semibold text-gray-900">
                  ¥{stats?.stockValue.toLocaleString() || '0'}
                </div>
              </Card>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">其他信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">生产日期</label>
                <div className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {inventoryItem.batch.productionDate
                    ? format(new Date(inventoryItem.batch.productionDate), 'yyyy-MM-dd')
                    : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">供应商</label>
                <div className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-600">
                  {inventoryItem.batch.supplierName || '-'}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">库存位置</label>
                <div className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {inventoryItem.batch.stockLocation || '-'}
                </div>
              </div>
              {inventoryItem.batch.remark && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                  <div className="w-full px-3 py-2 min-h-[72px] border border-gray-200 rounded-xl text-sm text-gray-600">
                    {inventoryItem.batch.remark}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 同色号其他缸号 */}
          {otherBatches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">同色号其他缸号</h3>
              <Card className="rounded-xl overflow-hidden">
                <Table columns={batchColumns} data={otherBatches} />
              </Card>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InventoryDetail



