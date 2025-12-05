import { SalesOrder } from '@/types/sales'
import { PurchaseOrder } from '@/types/purchase'
import { useTemplateStore } from '@/store/templateStore'
import { useContactStore } from '@/store/contactStore'
import { generatePrintContent, openPrintDialog } from './printService'

/**
 * 打印销售单或进货单
 */
export function printOrder(
  documentType: '销售单' | '进货单',
  order: SalesOrder | PurchaseOrder
) {
  const { getDefaultTemplate } = useTemplateStore.getState()
  const { getCustomer, getSupplier } = useContactStore.getState()
  
  // 获取默认模板
  const template = getDefaultTemplate(documentType)
  if (!template) {
    alert('未找到默认打印模板，请先在模板管理中设置默认模板')
    return false
  }
  
  // 获取客户/供应商信息
  let customer, supplier
  if (documentType === '销售单') {
    const salesOrder = order as SalesOrder
    customer = getCustomer(salesOrder.customerId)
  } else {
    const purchaseOrder = order as PurchaseOrder
    supplier = getSupplier(purchaseOrder.supplierId)
  }
  
  // 生成打印内容
  const htmlContent = generatePrintContent({
    template,
    order,
    documentType,
    customer,
    supplier,
  })
  
  // 打开打印对话框
  openPrintDialog(htmlContent)
  
  return true
}



