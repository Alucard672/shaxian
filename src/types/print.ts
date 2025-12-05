// 打印单据类型
export type PrintDocumentType = '销售单' | '进货单' | '出库单' | '入库单' | '收款收据' | '付款凭证'

// 打印状态
export type PrintStatus = '已打印' | '待打印'

// 打印记录
export interface PrintRecord {
  id: string
  documentType: PrintDocumentType
  documentNumber: string // 单据号
  documentId: string // 关联的单据ID
  printCount: number // 打印次数
  lastPrintTime?: string // 最后打印时间
  status: PrintStatus
  createdAt: string
}







