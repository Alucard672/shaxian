import QRCode from 'qrcode'
import { Product, Color, Batch } from '@/types/product'
import { StoreInfo } from '@/types/settings'

interface SelectedItem {
  product: Product
  color?: Color
  batch?: Batch
  shareCode?: string
  quantity: number
}

export interface BarcodePaperSize {
  widthMm: number
  heightMm: number
}

/**
 * 生成条码值（编码）
 */
function generateBarcodeValue(item: SelectedItem): string {
  let code = item.product.code || item.product.id
  if (item.color) code += '-' + (item.color.code || item.color.id)
  if (item.batch) code += '-' + (item.batch.code || item.batch.id)
  return code
}

/**
 * 生成商品详情页URL（用于二维码扫描跳转）
 */
function buildProductDetailUrl(item: SelectedItem): string {
  // 使用当前页面的完整URL来推断base path
  const origin = window.location.origin
  const currentPath = window.location.pathname
  
  // 从当前路径推断base path
  // 例如：如果当前路径是 /shaxian/products/barcode-print，base path 是 /shaxian
  // 如果当前路径是 /products/barcode-print，base path 是 /
  let basePath = '/'
  
  // 方法1：从当前路径中提取（最可靠）
  if (currentPath.includes('/products/barcode-print')) {
    // 提取 /products 之前的部分作为 base path
    const match = currentPath.match(/^(.+?)\/products\/barcode-print/)
    if (match && match[1]) {
      basePath = match[1]
    }
  } else if (currentPath.includes('/products')) {
    // 如果在其他商品相关页面
    const match = currentPath.match(/^(.+?)\/products/)
    if (match && match[1]) {
      basePath = match[1]
    }
  } else {
    // 方法2：从 BASE_URL 获取（备用）
    const envBase = import.meta.env.BASE_URL || '/'
    basePath = envBase === '/' ? '/' : envBase.replace(/\/$/, '')
  }
  
  // 确保 basePath 格式正确：以 / 开头，不以 / 结尾（除非是根路径）
  if (!basePath.startsWith('/')) {
    basePath = '/' + basePath
  }
  if (basePath !== '/' && basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1)
  }
  
  const productId = item.product.id
  const params = new URLSearchParams()
  
  // 如果有色号，添加到参数中
  if (item.color) {
    params.set('color', item.color.id)
  }
  
  // 如果有缸号，添加到参数中
  if (item.batch) {
    params.set('batch', item.batch.id)
  }
  
  // 添加租户ID到URL参数中（如果存在），以便公开访问时也能正确加载数据
  // 优先 currentTenantId，其次 user.tenantId，最后从商品/缸号数据兜底
  let tenantId =
    localStorage.getItem('currentTenantId') ||
    item.product?.tenantId ||
    item.batch?.tenantId ||
    ''

  if (!tenantId) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.tenantId !== null && user.tenantId !== undefined) {
          tenantId = String(user.tenantId)
        }
      } catch {
        // ignore
      }
    }
  }
  if (tenantId) params.set('tenantId', tenantId)
  
  const queryString = params.toString()
  const qs = queryString ? `?${queryString}` : ''

  // 使用路径型 URL（非 hash），确保 BrowserRouter 能匹配，且 tenantId 在 query 以便公开接口正确解析
  // 分享码：/product/share/{code}?tenantId=... ；商品ID：/product/{id}?tenantId=...
  const base = basePath === '/' ? '' : basePath
  const shareCode = item.shareCode
  const pathPath = shareCode
    ? `/product/share/${encodeURIComponent(shareCode)}${qs}`
    : `/product/${productId}${qs}`
  const url = `${origin}${base}${pathPath}`

  return url
}

/**
 * 生成二维码内容（直接使用商品详情页URL，扫码后可直接跳转查看详情）
 */
function buildDetailText(item: SelectedItem, storeInfo?: StoreInfo): string {
  // 直接返回商品详情页URL，让扫码工具能够识别并直接跳转
  return buildProductDetailUrl(item)
}

/**
 * 生成固定样式的条码标签HTML（根据图片样式）
 * 在应用内生成二维码 base64 图片并嵌入，不依赖打印窗口加载脚本
 * @param items 已选商品
 * @param storeInfo 门店信息（公司名等）
 * @param paperSize 纸张尺寸（毫米），默认 100×50
 */
export async function generateFixedBarcodeHTML(
  items: SelectedItem[],
  storeInfo?: StoreInfo,
  paperSize?: BarcodePaperSize
): Promise<string> {
  const w = Math.max(40, paperSize?.widthMm ?? 100)
  const h = Math.max(30, paperSize?.heightMm ?? 50)

  // 增加二维码尺寸和容错级别，确保打印后也能清晰扫描
  const qrSize = 400 // 进一步增加尺寸以提高打印清晰度
  const qrDataUrls: string[] = []
  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      // 生成商品详情页URL，扫码后可直接跳转查看详情
      const text = buildDetailText(item, storeInfo)
      // 调试：输出二维码内容（URL）
      console.log('QR Code URL:', text)
      
      const dataUrl = await QRCode.toDataURL(text, {
        width: qrSize,
        margin: 4, // 增加边距，提高容错性
        errorCorrectionLevel: 'H', // 最高容错级别（30%）
        color: { 
          dark: '#000000', 
          light: '#FFFFFF' 
        },
        type: 'image/png', // 明确指定PNG格式
      })
      qrDataUrls.push(dataUrl)
    }
  }

  let qrIndex = 0
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>条码打印</title>
      <style>
        @media print {
          @page {
            size: ${w}mm ${h}mm;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }
        .label-page {
          width: ${w}mm;
          height: ${h}mm;
          position: relative;
          page-break-after: always;
          page-break-inside: avoid;
          background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px);
          padding: 3mm;
          box-sizing: border-box;
        }
        .label-content {
          width: 100%;
          height: 100%;
          background: white;
          border: 1px solid #ddd;
          border-radius: 2mm;
          padding: 4mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .label-header {
          text-align: center;
          font-size: 9pt;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 1.5mm;
          letter-spacing: 0.5px;
        }
        .label-body {
          flex: 1;
          display: flex;
          gap: 2mm;
        }
        .label-left {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .label-right {
          width: 25mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          line-height: 1.15;
        }
        .info-row {
          border-bottom: 0.5px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-cell-label {
          width: 35%;
          padding: 0.4mm 1mm;
          vertical-align: middle;
          border-right: 0.5px solid #e5e7eb;
        }
        .info-cell-value {
          padding: 0.4mm 1mm;
          vertical-align: middle;
          font-weight: 500;
        }
        .info-icon {
          width: 12px;
          height: 12px;
          display: inline-block;
          margin-right: 2px;
          vertical-align: middle;
        }
        .qrcode-container {
          width: 20mm;
          height: 20mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5mm;
        }
        .qrcode-img {
          display: block;
          width: 20mm;
          height: 20mm;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .qrcode-text {
          font-size: 5.5pt;
          color: #666;
          text-align: center;
          margin-top: 0.5mm;
          line-height: 1.15;
        }
        .label-footer {
          margin-top: 1mm;
          padding-top: 1mm;
          border-top: 0.5px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7pt;
          font-weight: bold;
        }
        .company-info {
          color: #1f2937;
        }
        .made-in-china {
          color: #1f2937;
        }
      </style>
    </head>
    <body>
      ${items
        .map((item, itemIndex) => {
          return Array.from({ length: item.quantity }, (_, qtyIndex) => {
            const articleNumber = item.product.code || item.product.id
            const colorNumber = item.color
              ? `${item.color.code || ''}${item.color.code && item.color.name ? ' (' : ''}${item.color.name || ''}${item.color.code && item.color.name ? ')' : ''}`.trim()
              : ''
            const countVal = item.product.count ?? ''
            const weight = item.product.weight ?? ''
            const companyName = storeInfo?.name || '公司名称'
            const qrSrc = qrDataUrls[qrIndex++]

            return `
              <div class="label-page">
                <div class="label-content">
                  <div class="label-header">
                    ${companyName}
                  </div>
                  <div class="label-body">
                    <div class="label-left">
                      <table class="info-table">
                        <tr class="info-row">
                          <td class="info-cell-label">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            款号<br/>Article No.:
                          </td>
                          <td class="info-cell-value">${articleNumber}</td>
                        </tr>
                        <tr class="info-row">
                          <td class="info-cell-label">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
                            </svg>
                            色号<br/>Color No.:
                          </td>
                          <td class="info-cell-value">${colorNumber || '-'}</td>
                        </tr>
                        <tr class="info-row">
                          <td class="info-cell-label">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                            </svg>
                            支数<br/>Count:
                          </td>
                          <td class="info-cell-value">${countVal || '-'}</td>
                        </tr>
                        <tr class="info-row">
                          <td class="info-cell-label">
                            <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M3 3h18v18H3zM9 9h6v6H9z"/>
                            </svg>
                            克重<br/>Weight:
                          </td>
                          <td class="info-cell-value">${weight || '-'}</td>
                        </tr>
                      </table>
                    </div>
                    <div class="label-right">
                      <div class="qrcode-container">
                        <img src="${qrSrc}" alt="QR" class="qrcode-img" />
                        <div class="qrcode-text">
                          扫描查看详细信息<br/>(Scan for Details)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `
          }).join('')
        })
        .join('')}
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

  // 二维码已内嵌为 img，稍等图片渲染后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 200)
  }
}
