import type { SalesOrder } from '@/types/sales'

/**
 * 按客户分组的订单，按开单顺序（createdAt、id）排序后，
 * 每个订单在该客户内的 1-based 序号（客户单号）。
 * 与系统单号 orderNumber 互不冲突。
 */
export function getCustomerOrderNumberMap(orders: SalesOrder[]): Map<string, number> {
  const map = new Map<string, number>()
  const byCustomer = new Map<string, SalesOrder[]>()
  for (const o of orders ?? []) {
    const list = byCustomer.get(o.customerId) ?? []
    list.push(o)
    byCustomer.set(o.customerId, list)
  }
  byCustomer.forEach((list) => {
    list.sort((a, b) => {
      const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (t !== 0) return t
      return String(a.id).localeCompare(String(b.id))
    })
    list.forEach((o, i) => map.set(o.id, i + 1))
  })
  return map
}

export function getCustomerOrderNumber(orders: SalesOrder[], order: SalesOrder): number {
  return getCustomerOrderNumberMap(orders).get(order.id) ?? 0
}
