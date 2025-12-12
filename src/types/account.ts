// 账款状态枚举
export type AccountStatus = '未结清' | '已结清'

// 收款方式枚举
export type PaymentMethod = '现金' | '转账' | '支票' | '其他'

// 应收账款
export interface AccountReceivable {
  id: string
  customerId: string
  customerName: string
  salesOrderId: string
  salesOrderNumber: string
  receivableAmount: number // 应收金额
  receivedAmount: number // 已收金额
  unpaidAmount: number // 欠款金额 = receivableAmount - receivedAmount
  accountDate: string // 账款日期（销售单日期）
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

// 收款记录
export interface ReceiptRecord {
  id: string
  accountReceivableId: string
  amount: number // 本次收款金额
  paymentMethod: PaymentMethod
  receiptDate: string // 收款日期
  operator: string // 经办人
  remark?: string // 备注
  createdAt: string
}

// 应付账款
export interface AccountPayable {
  id: string
  supplierId: string
  supplierName: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  payableAmount: number // 应付金额
  paidAmount: number // 已付金额
  unpaidAmount: number // 欠款金额 = payableAmount - paidAmount
  accountDate: string // 账款日期（进货单日期）
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

// 付款记录
export interface PaymentRecord {
  id: string
  accountPayableId: string
  amount: number // 本次付款金额
  paymentMethod: PaymentMethod
  paymentDate: string // 付款日期
  operator: string // 经办人
  remark?: string // 备注
  createdAt: string
}












