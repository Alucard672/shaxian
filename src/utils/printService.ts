import { PrintTemplate } from '@/types/template'
import { SalesOrder } from '@/types/sales'
import { PurchaseOrder } from '@/types/purchase'
import { Customer, Supplier } from '@/types/contact'
import { format } from 'date-fns'

export interface PrintData {
  template: PrintTemplate
  order: SalesOrder | PurchaseOrder
  documentType: '销售单' | '进货单'
  customer?: Customer
  supplier?: Supplier
}

/**
 * 生成打印内容
 */
export function generatePrintContent(data: PrintData): string {
  const { template, order, documentType, customer, supplier } = data

  // 单位转换：英寸转毫米（用于CSS）
  const unit = template.pageSettings.unit || 'mm'
  const convertToMm = (value: number) => {
    return unit === 'inch' ? value * 25.4 : value
  }

  const widthMm = convertToMm(template.pageSettings.width)
  const heightMm = convertToMm(template.pageSettings.height)
  const marginTopMm = convertToMm(template.pageSettings.marginTop)
  const marginRightMm = convertToMm(template.pageSettings.marginRight)
  const marginBottomMm = convertToMm(template.pageSettings.marginBottom)
  const marginLeftMm = convertToMm(template.pageSettings.marginLeft)

  // 计算页面尺寸（像素）
  const mmToPx = (mm: number) => mm * 3.779527559
  const pageWidth = mmToPx(widthMm)
  const pageHeight = mmToPx(heightMm)

  // 客户/供应商信息
  const customerName = documentType === '销售单'
    ? (order as SalesOrder).customerName
    : (order as PurchaseOrder).supplierName

  const contactPerson = documentType === '销售单'
    ? customer?.contactPerson || ''
    : supplier?.contactPerson || ''

  const contactPhone = documentType === '销售单'
    ? customer?.phone || ''
    : supplier?.phone || ''

  const deliveryAddress = documentType === '销售单'
    ? customer?.address || ''
    : supplier?.address || ''

  const documentDate = documentType === '销售单'
    ? (order as SalesOrder).salesDate
    : (order as PurchaseOrder).purchaseDate

  const items = order.items

  // 生成HTML内容
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>打印 - ${order.orderNumber}</title>
      <style>
        @media print {
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            width: ${widthMm}mm;
            height: ${heightMm}mm;
          }
          .print-container {
            width: ${widthMm}mm;
            min-height: ${heightMm}mm;
            padding: ${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm;
            box-sizing: border-box;
            page-break-inside: avoid;
            page-break-after: avoid;
            margin: 0;
          }
        }
        body {
          font-family: Arial, "Microsoft YaHei", sans-serif;
          font-size: 12px;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .print-container {
          width: ${pageWidth}px;
          padding: ${mmToPx(marginTopMm)}px ${mmToPx(marginRightMm)}px ${mmToPx(marginBottomMm)}px ${mmToPx(marginLeftMm)}px;
          box-sizing: border-box;
          page-break-inside: avoid;
        }
        .title {
          font-size: ${template.titleSettings.fontSize}px;
          font-weight: bold;
          text-align: ${template.titleSettings.align};
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .info-left {
          flex: 1;
        }
        .info-right {
          text-align: right;
        }
        .info-item {
          margin-bottom: 2px;
          line-height: 1.4;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
          font-size: 12px;
          page-break-inside: avoid;
        }
        table th,
        table td {
          border: 1px solid #000;
          padding: 4px 3px;
          text-align: left;
          line-height: 1.2;
        }
        table th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center !important;
        }
        table th:first-child {
          text-align: left !important;
        }
        table td {
          text-align: ${template.productFields.textAlign || 'left'};
        }
        table td:first-child {
          text-align: left;
        }
        table td.align-right {
          text-align: right !important;
        }
        table td.align-center {
          text-align: center !important;
        }
        .summary {
          text-align: right;
          margin: 6px 0;
          line-height: 1.4;
        }
        .signature-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
          page-break-inside: avoid;
          line-height: 1.4;
        }
        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid #666;
          gap: 16px;
        }
        .company-info {
          font-size: 11px;
          line-height: 1.4;
          flex: 1;
        }
        .qrcode-container {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          flex-shrink: 0;
        }
        .qrcode {
          width: 64px;
          height: 64px;
          border: 2px solid #ef4444;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
  `

  // 标题
  if (template.titleSettings.enabled && template.titleSettings.text) {
    html += `<div class="title">${template.titleSettings.text}</div>`
  }

  // 基础信息
  html += '<div class="info-row">'
  html += '<div class="info-left">'

  if (template.basicInfoFields.customerName) {
    html += `<div class="info-item"><strong>${documentType === '销售单' ? '客户' : '供应商'}：</strong>${customerName}</div>`
  }

  if (template.basicInfoFields.contactPerson && contactPerson) {
    html += `<div class="info-item"><strong>联系人：</strong>${contactPerson}</div>`
  }

  if (template.basicInfoFields.contactPhone && contactPhone) {
    html += `<div class="info-item"><strong>电话：</strong>${contactPhone}</div>`
  }

  if (template.basicInfoFields.deliveryAddress && deliveryAddress) {
    html += `<div class="info-item"><strong>地址：</strong>${deliveryAddress}</div>`
  }

  html += '</div>'
  html += '<div class="info-right">'

  if (template.basicInfoFields.documentDate) {
    html += `<div class="info-item"><strong>单据日期：</strong>${documentDate}</div>`
  }

  if (template.basicInfoFields.printDate) {
    html += `<div class="info-item"><strong>打印：</strong>${format(new Date(), 'yyyy/MM/dd')}</div>`
  }

  if (template.basicInfoFields.documentNumber) {
    html += `<div class="info-item"><strong>NO：</strong>${order.orderNumber}</div>`
  }

  html += '</div>'
  html += '</div>'

  // 商品表格
  if (template.productFields.showTable) {
    const textAlign = template.productFields.textAlign || 'left'

    html += '<table>'
    html += '<thead><tr>'
    html += '<th style="text-align: left;">序号</th>'

    // 字段标签映射
    const labelMap: Record<string, string> = {
      productName: '商品名称',
      productCode: '商品编码',
      colorName: '颜色名称',
      colorCode: '颜色代码',
      batchCode: '批次号/缸号',
      quantity: '数量',
      unit: '单位',
      price: '单价',
      amount: '金额',
      pieceCount: '件数',
      unitWeight: '单件重量',
      productionDate: '生产日期',
      stockLocation: '库存位置',
      remark: '备注',
    }

    // 字段对齐方式（表头和数据行都使用）
    const alignMap: Record<string, string> = {
      quantity: 'center',
      unit: 'center',
      price: 'right',
      amount: 'right',
      pieceCount: 'center',
      unitWeight: 'right',
    }
    
    // 表头对齐方式（默认居中，但某些字段需要特殊对齐）
    const headerAlignMap: Record<string, string> = {
      quantity: 'center',
      unit: 'center',
      price: 'right',
      amount: 'right',
      pieceCount: 'center',
      unitWeight: 'right',
    }

    // 根据配置的字段动态生成表头（按固定顺序）
    const fieldOrder = [
      'productCode',
      'productName',
      'colorName',
      'colorCode',
      'batchCode',
      'quantity',
      'unit',
      'price',
      'amount',
      'pieceCount',
      'unitWeight',
      'productionDate',
      'stockLocation',
      'remark',
    ]

    fieldOrder.forEach((key) => {
      // 检查字段是否启用（排除 showTable 和 textAlign）
      const fieldEnabled = key !== 'showTable' && key !== 'textAlign' && 
        template.productFields[key as keyof typeof template.productFields] === true
      
      if (fieldEnabled) {
        // 表头对齐：优先使用 headerAlignMap，否则使用 alignMap，最后默认居中
        const headerAlign = headerAlignMap[key] || alignMap[key] || 'center'
        html += `<th style="text-align: ${headerAlign} !important;">${labelMap[key] || key}</th>`
      }
    })

    html += '</tr></thead>'
    html += '<tbody>'

    items.forEach((item, index) => {
      html += '<tr>'
      html += `<td style="text-align: left;">${index + 1}</td>`

      fieldOrder.forEach((key) => {
        // 检查字段是否启用（排除 showTable 和 textAlign）
        const fieldEnabled = key !== 'showTable' && key !== 'textAlign' && 
          template.productFields[key as keyof typeof template.productFields] === true
        
        if (fieldEnabled) {
          const align = alignMap[key] || textAlign
          let content = ''

          switch (key) {
            case 'productCode': 
              content = (item as any).productCode || (item as any).productId || ''; 
              break;
            case 'productName': 
              content = item.productName || ''; 
              break;
            case 'colorName': 
              content = (item as any).colorName || ''; 
              break;
            case 'colorCode': 
              content = (item as any).colorCode || ''; 
              break;
            case 'batchCode': 
              content = (item as any).batchCode || ''; 
              break;
            case 'quantity': 
              content = (item.quantity ?? 0).toString(); 
              break;
            case 'unit': 
              content = (item as any).unit || ''; 
              break;
            case 'price': 
              content = `¥${((item as any).price ?? (item as any).unitPrice ?? 0).toFixed(2)}`; 
              break;
            case 'amount': 
              content = `¥${(item.amount ?? 0).toFixed(2)}`; 
              break;
            case 'pieceCount': 
              content = ((item as any).pieceCount ?? '').toString(); 
              break;
            case 'unitWeight': 
              content = ((item as any).unitWeight ?? '').toString(); 
              break;
            case 'productionDate': 
              content = (item as any).productionDate || ''; 
              break;
            case 'stockLocation': 
              content = (item as any).stockLocation || ''; 
              break;
            case 'remark': 
              content = (item as any).remark || ''; 
              break;
            default:
              content = (item as any)[key] || '';
          }

          html += `<td style="text-align: ${align};">${content}</td>`
        }
      })

      html += '</tr>'
    })

    html += '</tbody>'
    html += '</table>'
  }

  // 汇总信息
  html += '<div class="summary">'

  if (template.summaryFields.totalAmount) {
    html += `<div style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">合计：¥${order.totalAmount.toFixed(2)}</div>`
  }

  if (template.summaryFields.paymentInfo) {
    if (documentType === '销售单') {
      const salesOrder = order as SalesOrder
      html += `<div style="margin-bottom: 2px;">已付：¥${(salesOrder.receivedAmount || 0).toFixed(2)} | 欠款：¥${(salesOrder.unpaidAmount || 0).toFixed(2)} | 付款方式：现金支付</div>`
    } else {
      const purchaseOrder = order as PurchaseOrder
      html += `<div style="margin-bottom: 2px;">已付：¥${(purchaseOrder.paidAmount || 0).toFixed(2)} | 欠款：¥${(purchaseOrder.unpaidAmount || 0).toFixed(2)} | 付款方式：现金支付</div>`
    }
  }

  html += '</div>'

  // 签名区域
  html += '<div class="signature-row">'

  if (template.summaryFields.creator) {
    html += `<div><strong>制单：</strong>${order.operator}</div>`
  }

  if (template.summaryFields.handler) {
    html += `<div><strong>经手：</strong>${order.operator}</div>`
  }

  if (template.summaryFields.customerSign) {
    html += '<div><strong>客户签收：</strong><div style="margin-top: 12px; border-bottom: 1px solid #000;"></div></div>'
  }

  html += '</div>'

  // 门店信息和二维码（底部，同一行）
  if (template.otherElements.companyInfo || template.otherElements.qrcode) {
    html += '<div class="footer-section">'

    // 门店信息（左侧）
    if (template.otherElements.companyInfo) {
      html += `
        <div class="company-info">
          <div>织云ERP纺织门店：浙江省杭州市余杭区创新路99号</div>
          <div>电话：0571-88888888</div>
          <div>联系人：李经理</div>
          <div style="font-weight: bold; margin-top: 4px;">织云ERP·本单具有合同效力</div>
        </div>
      `
    }

    // 二维码（右侧）
    if (template.otherElements.qrcode) {
      const qrcodeCount = template.otherElements.qrcodeCount || 1
      const qrcodeImages = template.qrcodeImages || []
      html += '<div class="qrcode-container">'
      for (let i = 0; i < qrcodeCount; i++) {
        const imageUrl = qrcodeImages[i]
        if (imageUrl) {
          html += `<img src="${imageUrl}" alt="二维码 ${i + 1}" class="qrcode" style="width: 64px; height: 64px; object-fit: contain;" />`
        } else {
          html += '<div class="qrcode"></div>'
        }
      }
      html += '</div>'
    }

    html += '</div>'
  }

  // 页码
  if (template.otherElements.pageNumber) {
    html += '<div style="text-align: center; font-size: 10px; color: #666; margin-top: 8px;">第 1 页</div>'
  }

  html += `
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * 打开打印对话框
 */
export function openPrintDialog(htmlContent: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('无法打开打印窗口，请检查浏览器弹窗设置')
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // 等待内容加载完成后打印
  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
    // 打印完成后关闭窗口
    printWindow.onafterprint = () => {
      setTimeout(() => {
        printWindow.close()
      }, 100)
    }
  }, 500)
}

