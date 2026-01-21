import { Product, Color, Batch } from '@/types/product'
import { BarcodeTemplate, BarcodeElement, DataSourceType } from '@/types/barcodeTemplate'

interface SelectedItem {
  product: Product
  color?: Color
  batch?: Batch
  quantity: number
}

interface BarcodeSettings {
  width: number
  height: number
  format: 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39'
  displayValue: boolean
  fontSize: number
  textMargin: number
  margin: number
}

/**
 * 生成条码值
 */
function generateBarcodeValue(item: SelectedItem): string {
  // 使用商品编码作为基础
  let code = item.product.code || item.product.id
  
  // 如果有色号，添加到编码
  if (item.color) {
    code += '-' + (item.color.code || item.color.id)
  }
  
  // 如果有缸号，添加到编码
  if (item.batch) {
    code += '-' + (item.batch.code || item.batch.id)
  }
  
  return code
}

/**
 * 生成条码HTML内容
 */
export function generateBarcodeHTML(
  items: SelectedItem[],
  settings: BarcodeSettings
): string {
  // 使用JsBarcode库生成条码
  // 注意：需要在HTML中引入JsBarcode库
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>条码打印</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <style>
        @media print {
          @page {
            size: A4;
            margin: ${settings.margin}mm;
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
          padding: ${settings.margin}mm;
        }
        .barcode-container {
          display: inline-block;
          margin: 10px;
          padding: 10px;
          border: 1px solid #ddd;
          text-align: center;
          page-break-inside: avoid;
        }
        .barcode-label {
          font-size: ${settings.fontSize}px;
          margin-top: ${settings.textMargin}px;
          word-break: break-all;
          max-width: 200px;
        }
        .barcode-svg {
          display: block;
          margin: 0 auto;
        }
        .product-info {
          font-size: 10px;
          color: #666;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      ${items
        .map((item, itemIndex) => {
          // 为每个商品生成指定数量的条码
          return Array.from({ length: item.quantity }, (_, qtyIndex) => {
            const barcodeValue = generateBarcodeValue(item)
            const uniqueId = `barcode-${itemIndex}-${qtyIndex}`
            
            return `
              <div class="barcode-container">
                <svg id="${uniqueId}" class="barcode-svg"></svg>
                ${settings.displayValue ? `<div class="barcode-label">${barcodeValue}</div>` : ''}
                <div class="product-info">
                  ${item.product.name}
                  ${item.color ? `<br/>色号：${item.color.code} - ${item.color.name}` : ''}
                  ${item.batch ? `<br/>缸号：${item.batch.code}` : ''}
                </div>
              </div>
            `
          }).join('')
        })
        .join('')}
      
      <script>
        // 生成所有条码
        const items = ${JSON.stringify(items.map((item) => ({
          product: { code: item.product.code, name: item.product.name },
          color: item.color ? { code: item.color.code, name: item.color.name } : null,
          batch: item.batch ? { code: item.batch.code } : null,
          quantity: item.quantity,
        })))};
        
        let index = 0;
        items.forEach((item, itemIndex) => {
          for (let qtyIndex = 0; qtyIndex < item.quantity; qtyIndex++) {
            const barcodeValue = generateBarcodeValue(item);
            const uniqueId = 'barcode-' + itemIndex + '-' + qtyIndex;
            const svg = document.getElementById(uniqueId);
            
            if (svg && typeof JsBarcode !== 'undefined') {
              JsBarcode(svg, barcodeValue, {
                format: '${settings.format}',
                width: ${settings.width},
                height: ${settings.height},
                displayValue: ${settings.displayValue},
                fontSize: ${settings.fontSize},
                textMargin: ${settings.textMargin},
                margin: ${settings.margin},
              });
            }
          }
        });
        
        function generateBarcodeValue(item) {
          let code = item.product.code || '';
          if (item.color) {
            code += '-' + (item.color.code || '');
          }
          if (item.batch) {
            code += '-' + (item.batch.code || '');
          }
          return code;
        }
      </script>
    </body>
    </html>
  `
  
  return html
}

/**
 * 获取数据源值
 */
function getDataSourceValue(
  dataSource: DataSourceType,
  item: SelectedItem
): string {
  switch (dataSource) {
    case 'productCode':
      return item.product.code || item.product.id
    case 'productName':
      return item.product.name || ''
    case 'colorCode':
      return item.color?.code || item.color?.id || ''
    case 'colorName':
      return item.color?.name || ''
    case 'batchCode':
      return item.batch?.code || item.batch?.id || ''
    case 'barcodeValue':
      return generateBarcodeValue(item)
    case 'static':
    default:
      return ''
  }
}

/**
 * 基于模板生成条码HTML
 */
export function generateBarcodeHTMLFromTemplate(
  items: SelectedItem[],
  template: BarcodeTemplate
): string {
  // 毫米转像素（96 DPI）
  const mmToPx = (mm: number) => mm * 3.779527559
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>条码打印</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <style>
        @media print {
          @page {
            size: ${template.pageWidth}mm ${template.pageHeight}mm;
            margin: ${template.marginTop}mm ${template.marginRight}mm ${template.marginBottom}mm ${template.marginLeft}mm;
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
        }
        .label-page {
          width: ${mmToPx(template.pageWidth)}px;
          height: ${mmToPx(template.pageHeight)}px;
          position: relative;
          page-break-after: always;
          page-break-inside: avoid;
        }
        .label-element {
          position: absolute;
        }
        .label-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .label-barcode svg {
          display: block;
        }
      </style>
    </head>
    <body>
      ${items
        .map((item, itemIndex) => {
          return Array.from({ length: item.quantity }, (_, qtyIndex) => {
            const uniqueId = `label-${itemIndex}-${qtyIndex}`
            
            // 生成元素HTML
            const elementsHTML = template.elements
              .filter(el => el.visible !== false)
              .map((element, elIndex) => {
                const elementId = `${uniqueId}-element-${elIndex}`
                let elementHTML = ''
                
                if (element.type === 'text') {
                  // 兼容旧版本：如果没有textParts，从dataSource和text创建
                  let textParts = element.textParts || []
                  if (textParts.length === 0) {
                    if (element.dataSource === 'static') {
                      textParts = [{ type: 'static', content: element.text || '' }]
                    } else if (element.dataSource) {
                      textParts = [{ type: 'field', content: element.dataSource }]
                    } else {
                      textParts = [{ type: 'static', content: '' }]
                    }
                  }
                  
                  // 生成文本内容
                  const textValue = textParts.map(part => {
                    if (part.type === 'static') {
                      return part.content
                    } else {
                      return getDataSourceValue(part.content as DataSourceType, item)
                    }
                  }).join('')
                  
                  elementHTML = `
                    <div
                      id="${elementId}"
                      class="label-element label-text"
                      style="
                        left: ${mmToPx(element.x)}px;
                        top: ${mmToPx(element.y)}px;
                        width: ${mmToPx(element.width)}px;
                        height: ${mmToPx(element.height)}px;
                        font-size: ${(element.fontSize || 12) * 0.75}px;
                        font-family: ${element.fontFamily || 'Arial'};
                        font-weight: ${element.fontStyle === 'bold' || element.fontStyle === 'bold italic' ? 'bold' : 'normal'};
                        font-style: ${element.fontStyle === 'italic' || element.fontStyle === 'bold italic' ? 'italic' : 'normal'};
                        color: ${element.color || '#000000'};
                        text-align: ${element.textAlign || 'left'};
                        display: flex;
                        align-items: center;
                        ${element.textAlign === 'center' ? 'justify-content: center;' : ''}
                        ${element.textAlign === 'right' ? 'justify-content: flex-end;' : ''}
                      "
                    >${textValue}</div>
                  `
                } else if (element.type === 'barcode') {
                  const barcodeValue = getDataSourceValue(element.dataSource || 'barcodeValue', item)
                  const barcodeId = `${elementId}-barcode`
                  const barcodeFormat = element.barcodeFormat || 'CODE128'
                  
                  if (barcodeFormat === 'QRCODE') {
                    // QR码使用专门的库
                    elementHTML = `
                      <div
                        id="${elementId}"
                        class="label-element label-barcode"
                        style="
                          left: ${mmToPx(element.x)}px;
                          top: ${mmToPx(element.y)}px;
                          width: ${mmToPx(element.width)}px;
                          height: ${mmToPx(element.height)}px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        "
                      >
                        <canvas id="${barcodeId}"></canvas>
                      </div>
                      <script>
                        (function() {
                          const canvas = document.getElementById('${barcodeId}');
                          if (canvas && typeof QRCode !== 'undefined') {
                            const size = Math.min(${mmToPx(element.width)}, ${mmToPx(element.height)});
                            canvas.width = size;
                            canvas.height = size;
                            QRCode.toCanvas(canvas, '${barcodeValue}', {
                              width: size,
                              margin: 1,
                              color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                              }
                            }, function (error) {
                              if (error) console.error('QR Code generation error:', error);
                            });
                          }
                        })();
                      </script>
                    `
                  } else {
                    // 一维条码使用JsBarcode
                    elementHTML = `
                      <div
                        id="${elementId}"
                        class="label-element label-barcode"
                        style="
                          left: ${mmToPx(element.x)}px;
                          top: ${mmToPx(element.y)}px;
                          width: ${mmToPx(element.width)}px;
                          height: ${mmToPx(element.height)}px;
                        "
                      >
                        <svg id="${barcodeId}"></svg>
                      </div>
                      <script>
                        (function() {
                          const svg = document.getElementById('${barcodeId}');
                          if (svg && typeof JsBarcode !== 'undefined') {
                            JsBarcode(svg, '${barcodeValue}', {
                              format: '${barcodeFormat}',
                              width: ${element.barcodeWidth || 2},
                              height: ${element.barcodeHeight || 20},
                              displayValue: ${element.displayValue !== false},
                              fontSize: ${element.fontSizeBarcode || 10},
                            });
                          }
                        })();
                      </script>
                    `
                  }
                } else if (element.type === 'image' && element.imageUrl) {
                  elementHTML = `
                    <img
                      id="${elementId}"
                      class="label-element"
                      src="${element.imageUrl}"
                      style="
                        left: ${mmToPx(element.x)}px;
                        top: ${mmToPx(element.y)}px;
                        width: ${mmToPx(element.width)}px;
                        height: ${mmToPx(element.height)}px;
                      "
                      alt=""
                    />
                  `
                } else if (element.type === 'line') {
                  elementHTML = `
                    <svg
                      id="${elementId}"
                      class="label-element"
                      style="
                        left: ${mmToPx(element.x)}px;
                        top: ${mmToPx(element.y)}px;
                        width: ${mmToPx(element.width)}px;
                        height: ${mmToPx(element.height)}px;
                      "
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="100%"
                        y2="100%"
                        stroke="${element.strokeColor || '#000000'}"
                        stroke-width="${element.strokeWidth || 1}"
                      />
                    </svg>
                  `
                } else if (element.type === 'rectangle') {
                  elementHTML = `
                    <div
                      id="${elementId}"
                      class="label-element"
                      style="
                        left: ${mmToPx(element.x)}px;
                        top: ${mmToPx(element.y)}px;
                        width: ${mmToPx(element.width)}px;
                        height: ${mmToPx(element.height)}px;
                        border: ${element.strokeWidth || 1}px solid ${element.strokeColor || '#000000'};
                        background-color: ${element.fillColor || 'transparent'};
                      "
                    ></div>
                  `
                }
                
                return elementHTML
              })
              .join('')
            
            return `
              <div class="label-page" id="${uniqueId}">
                ${elementsHTML}
              </div>
            `
          }).join('')
        })
        .join('')}
      
      <script>
        // 等待JsBarcode加载完成
        if (typeof JsBarcode !== 'undefined') {
          // 所有条码已在元素HTML中生成
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              // 重新生成条码（如果JsBarcode已加载）
              if (typeof JsBarcode !== 'undefined') {
                // 条码已在元素HTML中生成
              }
            }, 1000);
          });
        }
      </script>
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

  // 等待JsBarcode加载完成后再打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}

