// 销售单状态枚举
export type SalesOrderStatus = '草稿' | '待审核' | '已审核' | '已出库' | '已作废'

// 销售单明细
export interface SalesOrderItem {
  id: string
  productId: string
  productName: string
  productCode: string
  colorId: string
  colorName: string
  colorCode: string
  batchId: string
  batchCode: string
  quantity: number
  unit: string
  price: number // 单价
  amount: number // 小计 = quantity * price
  // 双单位相关字段
  pieceCount?: number // 件数
  unitWeight?: number // 单件重量
  remark?: string // 备注
}

// 销售单
export interface SalesOrder {
  id: string
  orderNumber: string // 销售单号，如"XS20231128001"
  customerId: string
  customerName: string
  salesDate: string // 销售日期
  deliveryDate?: string // 交货日期
  deliveryAddress?: string // 交货地址
  contactPerson?: string // 联系人
  contactPhone?: string // 联系电话
  items: SalesOrderItem[]
  totalAmount: number // 总金额
  paidAmount: number // 已收金额
  unpaidAmount: number // 欠款金额 = totalAmount - paidAmount
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
  deliveryDate?: string
  deliveryAddress?: string
  contactPerson?: string
  contactPhone?: string
  items: Omit<SalesOrderItem, 'id' | 'amount'>[]
  paidAmount: number
  remark?: string
}
