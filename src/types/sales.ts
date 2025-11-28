// 销售单状态枚举
export type SalesOrderStatus = '待审核' | '已审核' | '已出库' | '已作废'

// 销售单明细
export interface SalesOrderItem {
  id: string
  productId: string
  productName: string
  productCode: string
  colorId: string
  colorName: string
  colorCode: string
  batchId: string // 缸号ID（从现有库存选择）
  batchCode: string // 缸号编码
  quantity: number
  unit: string
  price: number // 单价
  amount: number // 小计 = quantity * price
  remark?: string // 备注
}

// 销售单
export interface SalesOrder {
  id: string
  orderNumber: string // 销售单号，如"XS20231128001"
  customerId: string
  customerName: string
  salesDate: string // 销售日期
  expectedDate?: string // 预计发货日期
  items: SalesOrderItem[]
  totalAmount: number // 总金额
  receivedAmount: number // 已收金额
  unpaidAmount: number // 欠款金额 = totalAmount - receivedAmount
  status: SalesOrderStatus
  operator: string // 经办人
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

// 销售单表单数据
export interface SalesOrderFormData {
  customerId: string
  customerName: string
  salesDate: string
  expectedDate?: string
  items: Omit<SalesOrderItem, 'id' | 'amount'>[]
  receivedAmount: number
  remark?: string
}


