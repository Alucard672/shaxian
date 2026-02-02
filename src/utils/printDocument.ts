import { templateApi } from '@/api/client'
import { useContactStore } from '@/store/contactStore'
import { usePrintStore } from '@/store/printStore'
import { useSalesStore } from '@/store/salesStore'
import { PurchaseOrder } from '@/types/purchase'
import { SalesOrder } from '@/types/sales'
import { PrintTemplate } from '@/types/template'
import { getCustomerOrderNumber } from '@/utils/customerOrderNumber'
import { generatePrintContent, openPrintDialog } from '@/utils/printService'

type DocumentType = '销售单' | '进货单'
type Order = SalesOrder | PurchaseOrder

function getFallbackTemplate(documentType: DocumentType): PrintTemplate {
  return {
    id: 'fallback-template',
    name: '默认打印模板',
    type: 'A4模板',
    documentType,
    description: '本地默认模板（无法加载远端模板时使用）',
    isDefault: true,
    usageCount: 0,
    pageSettings: {
      width: 210,
      height: 297,
      unit: 'mm',
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    },
    titleSettings: {
      enabled: true,
      text: documentType === '销售单' ? '销售单' : '进货单',
      fontSize: 18,
      align: 'center',
    },
    basicInfoFields: {
      documentNumber: true,
      documentDate: true,
      customerName: true,
      supplierName: true,
      contactPerson: true,
      contactPhone: true,
      deliveryAddress: true,
      printDate: true,
    },
    productFields: {
      showTable: true,
      productName: true,
      productCode: true,
      colorName: true,
      colorCode: true,
      batchCode: true,
      quantity: true,
      unit: true,
      price: true,
      amount: true,
      remark: true,
      textAlign: 'left',
    },
    summaryFields: {
      subtotal: true,
      totalAmount: true,
      paymentInfo: true,
      creator: true,
      handler: true,
      customerSign: true,
    },
    otherElements: {
      qrcode: true,
      qrcodeCount: 1,
      companyInfo: true,
      cornerMark: false,
      pageNumber: true,
      qrcodeImages: [],
    },
    barcodeSettings: {
      width: 2,
      height: 60,
      format: 'CODE128',
      displayValue: true,
      fontSize: 14,
      textMargin: 2,
      margin: 10,
    },
  }
}

function pickTemplate(templates: any[], documentType: DocumentType): PrintTemplate | null {
  if (!Array.isArray(templates) || templates.length === 0) return null

  const byType = templates.filter(
    (t) => (t?.documentType || t?.document_type) === documentType
  )
  const defaultOne = byType.find((t) => t?.isDefault) || byType[0]
  return (defaultOne as PrintTemplate) || null
}

/**
 * 统一打印入口（在详情弹窗直接使用）
 */
export function printOrder(documentType: DocumentType, order: Order) {
  void (async () => {
    try {
      // 1) 获取模板（优先远端；失败则使用本地默认模板）
      let template: PrintTemplate | null = null
      try {
        const templates = await templateApi.getAll()
        template = pickTemplate(templates, documentType)
      } catch {
        template = null
      }

      if (!template) {
        template = getFallbackTemplate(documentType)
      }

      // 2) 获取客户/供应商（用于打印页展示）
      const contactStore = useContactStore.getState()
      const customer =
        documentType === '销售单' ? contactStore.getCustomer((order as SalesOrder).customerId) : undefined
      const supplier =
        documentType === '进货单' ? contactStore.getSupplier((order as PurchaseOrder).supplierId) : undefined

      let customerOrderNumber: number | undefined
      if (documentType === '销售单') {
        const orders = useSalesStore.getState().orders
        customerOrderNumber = getCustomerOrderNumber(orders, order as SalesOrder) || undefined
      }

      // 3) 生成并打开打印页
      const html = generatePrintContent({
        template,
        order,
        documentType,
        customer,
        supplier,
        customerOrderNumber,
      })
      openPrintDialog(html)

      // 4) 记录打印
      const printStore = usePrintStore.getState()
      printStore.printDocument(documentType, order.id, (order as any).orderNumber)
    } catch (e: any) {
      console.error('Print failed:', e)
      alert('打印失败：' + (e?.message || '未知错误'))
    }
  })()
}

