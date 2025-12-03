// 进货单状态枚举
export type PurchaseOrderStatus = '草稿' | '待审核' | '已审核' | '已入库' | '已作废'

// 进货单明细
export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  productCode: string
  colorId: string
  colorName: string
  colorCode: string
  batchCode: string // 新缸号编码
  quantity: number
  unit: string
  price: number // 单价
  amount: number // 小计 = quantity * price
  productionDate?: string // 生产日期
  stockLocation?: string // 库存位置
  remark?: string // 备注
}

// 进货单
export interface PurchaseOrder {
  id: string
  orderNumber: string // 进货单号，如"CG20231128001"
  supplierId: string
  supplierName: string
  purchaseDate: string // 进货日期
  expectedDate?: string // 预计到货日期
  items: PurchaseOrderItem[]
  totalAmount: number // 总金额
  paidAmount: number // 已付金额
  unpaidAmount: number // 欠款金额 = totalAmount - paidAmount
  status: PurchaseOrderStatus
  operator: string // 经办人
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

// 进货单表单数据
export interface PurchaseOrderFormData {
  supplierId: string
  supplierName: string
  purchaseDate: string
  expectedDate?: string
  items: Omit<PurchaseOrderItem, 'id' | 'amount'>[]
  paidAmount: number
  remark?: string
}




