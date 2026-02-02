/** 销售单状态：前端中文 -> 后端 Java 枚举 */
const salesToApi: Record<string, string> = {
  草稿: 'DRAFT',
  待审核: 'PENDING_REVIEW',
  已审核: 'APPROVED',
  已出库: 'SHIPPED',
  已作废: 'CANCELLED',
}

/** 后端枚举 -> 销售单中文 */
const salesApiToZh: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  APPROVED: '已审核',
  SHIPPED: '已出库',
  CANCELLED: '已作废',
}

/** 进货单状态：前端中文 -> 后端 Java 枚举 */
const purchaseToApi: Record<string, string> = {
  草稿: 'DRAFT',
  待审核: 'PENDING_REVIEW',
  已审核: 'APPROVED',
  已入库: 'RECEIVED',
  已作废: 'CANCELLED',
}

/** 后端枚举 -> 进货单中文 */
const purchaseApiToZh: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审核',
  APPROVED: '已审核',
  RECEIVED: '已入库',
  CANCELLED: '已作废',
}

export function mapSalesStatusToApi(status: string): string {
  return salesToApi[status] ?? status
}

export function mapPurchaseStatusToApi(status: string): string {
  return purchaseToApi[status] ?? status
}

export function mapSalesApiToZh(status: string): string {
  return salesApiToZh[String(status ?? '').toUpperCase()] ?? status
}

export function mapPurchaseApiToZh(status: string): string {
  return purchaseApiToZh[String(status ?? '').toUpperCase()] ?? status
}
