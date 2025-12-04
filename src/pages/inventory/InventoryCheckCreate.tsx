import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInventoryCheckStore } from '@/store/inventoryCheckStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useProductStore } from '@/store/productStore'
import { InventoryCheckOrderFormData } from '@/types/inventoryCheck'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import InventoryCheckPreview from '../../components/inventory/InventoryCheckPreview'
import { X, Plus, FileText, AlertCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'

const WAREHOUSE_OPTIONS = [
  { value: '1号仓库', label: '1号仓库' },
  { value: '2号仓库', label: '2号仓库' },
  { value: '3号仓库', label: '3号仓库' },
  { value: '全部仓库', label: '全部仓库' },
]

function InventoryCheckCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { addOrder, updateOrder, getOrder } = useInventoryCheckStore()
  const { getInventoryDetails } = useInventoryStore()
  const { products } = useProductStore()

  const isEditMode = !!id
  const existingOrder = isEditMode ? getOrder(id!) : null

  const [name, setName] = useState(existingOrder?.name || '')
  const [warehouse, setWarehouse] = useState(existingOrder?.warehouse || '')
  const [planDate, setPlanDate] = useState(
    existingOrder?.planDate || format(new Date(), 'yyyy-MM-dd')
  )
  const [remark, setRemark] = useState(existingOrder?.remark || '')
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [items, setItems] = useState(
    existingOrder?.items.map((item) => ({
      batchId: item.batchId,
      productName: item.productName,
      colorName: item.colorName,
      batchCode: item.batchCode,
      systemQuantity: item.systemQuantity,
      actualQuantity: item.actualQuantity,
      unit: item.unit,
    })) || []
  )

  // 加载编辑模式数据
  useEffect(() => {
    if (isEditMode && existingOrder) {
      if (existingOrder.status !== '计划中') {
        alert('只能编辑计划中的盘点单')
        navigate('/inventory/check')
        return
      }
      setName(existingOrder.name)
      setWarehouse(existingOrder.warehouse)
      setPlanDate(existingOrder.planDate)
      setRemark(existingOrder.remark || '')
      setItems(
        existingOrder.items.map((item) => ({
          batchId: item.batchId,
          productName: item.productName,
          colorName: item.colorName,
          batchCode: item.batchCode,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          unit: item.unit,
        }))
      )
    }
  }, [isEditMode, existingOrder, navigate])

  // 生成盘点明细
  const handleGenerateItems = () => {
    if (!warehouse) {
      alert('请先选择盘点仓库')
      return
    }

    const inventoryDetails = getInventoryDetails()
    
    // 根据仓库筛选库存
    const warehouseInventory = inventoryDetails.filter((item) => {
      if (warehouse === '全部仓库') return true
      return item.batch.stockLocation?.startsWith(warehouse) || false
    })

    if (warehouseInventory.length === 0) {
      alert('该仓库暂无库存')
      return
    }

    const generatedItems = warehouseInventory.map((item) => {
      const product = products.find((p) => p.id === item.productId)
      return {
        batchId: item.batch.id,
        productName: item.productName,
        colorName: item.colorName,
        batchCode: item.batch.code,
        systemQuantity: item.batch.stockQuantity,
        actualQuantity: undefined as number | undefined,
        unit: product?.unit || 'kg',
      }
    })

    setItems(generatedItems)
  }

  // 更新盘点明细的实际数量
  const handleUpdateActualQuantity = (batchId: string, actualQuantity: number) => {
    setItems(
      items.map((item) =>
        item.batchId === batchId
          ? { ...item, actualQuantity: actualQuantity >= 0 ? actualQuantity : 0 }
          : item
      )
    )
  }

  // 提交表单
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入盘点名称')
      return
    }
    if (!warehouse) {
      alert('请选择盘点仓库')
      return
    }
    if (!planDate) {
      alert('请选择计划日期')
      return
    }
    if (items.length === 0) {
      alert('请先生成盘点明细')
      return
    }

    // 获取库存明细以获取完整信息
    const inventoryDetails = getInventoryDetails()
    
    const orderData: InventoryCheckOrderFormData = {
      name: name.trim(),
      warehouse,
      planDate,
      items: items.map((item) => {
        const inventoryItem = inventoryDetails.find((detail) => detail.batch.id === item.batchId)
        
        return {
          batchId: item.batchId,
          batchCode: item.batchCode,
          productId: inventoryItem?.productId || '',
          productName: item.productName,
          colorId: inventoryItem?.colorId || '',
          colorName: item.colorName,
          colorCode: inventoryItem?.colorCode || '',
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity || item.systemQuantity,
          unit: item.unit,
        }
      }),
      remark: remark.trim() || undefined,
    }

    if (isEditMode && existingOrder) {
      updateOrder(existingOrder.id, orderData)
    } else {
      addOrder(orderData)
    }

    navigate('/inventory/check')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => navigate('/inventory/check')}
      />

      {/* 表单内容 */}
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[1200px] h-[calc(100vh-48px)] mx-auto my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? '编辑库存盘点' : '新建库存盘点'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              创建盘点计划并生成盘点明细
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={items.length === 0}
              className="h-9 border-gray-300 rounded-lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              预览
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/inventory/check')}
              className="h-9 border-gray-300 rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-9 rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isEditMode ? '保存修改' : '创建盘点计划'}
            </Button>
            <button
              onClick={() => navigate('/inventory/check')}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
              基本信息
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="盘点名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：12月月度盘点"
                required
                className="col-span-1"
              />
              <Select
                label="盘点仓库"
                options={[{ value: '', label: '请选择仓库' }, ...WAREHOUSE_OPTIONS]}
                value={warehouse}
                onChange={(e) => {
                  setWarehouse(e.target.value)
                  if (autoGenerate && e.target.value) {
                    // 如果启用了自动生成，仓库改变时重新生成明细
                    setTimeout(() => handleGenerateItems(), 100)
                  }
                }}
                required
                className="col-span-1"
              />
              <Input
                label="计划日期"
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                required
                className="col-span-1"
              />
              <Textarea
                label="备注说明"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="填写盘点说明..."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>

          {/* 盘点明细 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">盘点明细</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">自动生成（根据仓库库存）</span>
                </label>
                <Button
                  onClick={handleGenerateItems}
                  className="h-8 rounded-lg bg-primary-600 hover:bg-primary-700"
                  disabled={!warehouse}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  生成明细
                </Button>
              </div>
            </div>

            {/* 明细列表 */}
            {items.length === 0 ? (
              <Card className="p-12 border-2 border-dashed border-gray-200 rounded-xl text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">暂无盘点明细</p>
                <Button
                  onClick={handleGenerateItems}
                  className="h-8 rounded-lg bg-primary-600 hover:bg-primary-700"
                  disabled={!warehouse}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  生成盘点明细
                </Button>
              </Card>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                        商品信息
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">色号</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">缸号</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        系统库存
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        实际盘点
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900">差异</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const difference = (item.actualQuantity || item.systemQuantity) - item.systemQuantity
                      return (
                        <tr key={item.batchId} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              {item.productName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.colorName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.batchCode}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {item.systemQuantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              value={item.actualQuantity ?? item.systemQuantity}
                              onChange={(e) =>
                                handleUpdateActualQuantity(
                                  item.batchId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2 py-1 text-sm text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            <span
                              className={cn({
                                'text-success-600': difference > 0,
                                'text-danger-600': difference < 0,
                                'text-gray-600': difference === 0,
                              })}
                            >
                              {difference > 0 ? '+' : ''}
                              {difference.toFixed(2)} {item.unit}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 预览模态窗口 */}
      {showPreview && (
        <InventoryCheckPreview
          name={name}
          warehouse={warehouse}
          planDate={planDate}
          remark={remark}
          items={items}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

export default InventoryCheckCreate

