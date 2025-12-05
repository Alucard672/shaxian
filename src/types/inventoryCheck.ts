// 盘点单状态枚举
export type InventoryCheckStatus = '计划中' | '盘点中' | '已完成' | '已取消'

// 盘点明细
export interface InventoryCheckItem {
  id: string
  batchId: string // 缸号ID
  batchCode: string // 缸号编码
  productId: string
  productName: string
  colorId: string
  colorName: string
  colorCode: string
  systemQuantity: number // 系统库存数量
  actualQuantity?: number // 实际盘点数量
  difference?: number // 差异 = actualQuantity - systemQuantity (正数为盘盈,负数为盘亏)
  unit: string
  remark?: string // 备注
}

// 盘点单
export interface InventoryCheckOrder {
  id: string
  orderNumber: string // 盘点单号，如"PD20241201001"
  name: string // 盘点名称，如"12月月度盘点"
  warehouse: string // 盘点仓库，如"1号仓库"或"全部仓库"
  planDate: string // 计划日期
  items: InventoryCheckItem[]
  progress: {
    total: number // 总数量
    completed: number // 已完成数量
  }
  surplus: number // 盘盈总量 (kg)
  deficit: number // 盘亏总量 (kg)
  status: InventoryCheckStatus
  operator: string // 创建人
  remark?: string // 备注说明
  createdAt: string
  updatedAt: string
}

// 盘点单表单数据
export interface InventoryCheckOrderFormData {
  name: string
  warehouse: string
  planDate: string
  items: Omit<InventoryCheckItem, 'id' | 'difference'>[]
  remark?: string
}



