// 库存调整单类型枚举
export type AdjustmentType = '调增' | '调减' | '盘盈' | '盘亏' | '报损' | '其他'

// 库存调整单状态枚举
export type AdjustmentStatus = '草稿' | '已完成'

// 库存调整单明细
export interface AdjustmentItem {
  id: string
  batchId: string // 缸号ID
  batchCode: string // 缸号编码
  productId: string
  productName: string
  colorId: string
  colorName: string
  colorCode: string
  quantity: number // 调整数量 (正数表示增加,负数表示减少)
  unit: string
  remark?: string // 备注
}

// 库存调整单
export interface AdjustmentOrder {
  id: string
  orderNumber: string // 调整单号，如"TZ20241201001"
  type: AdjustmentType // 调整类型
  adjustmentDate: string // 调整日期
  items: AdjustmentItem[]
  totalQuantity: number // 调整总量 (所有明细的绝对值之和)
  status: AdjustmentStatus
  operator: string // 操作人
  remark?: string // 备注说明
  createdAt: string
  updatedAt: string
}

// 库存调整单表单数据
export interface AdjustmentOrderFormData {
  type: AdjustmentType
  adjustmentDate: string
  items: Omit<AdjustmentItem, 'id'>[]
  remark?: string
}







