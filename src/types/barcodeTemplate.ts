// 条码模板元素类型
export type BarcodeElementType = 'text' | 'barcode' | 'image' | 'line' | 'rectangle' | 'table'

// 数据源类型
export type DataSourceType = 
  | 'productCode'      // 商品编码
  | 'productName'       // 商品名称
  | 'colorCode'         // 色号编码
  | 'colorName'          // 色号名称
  | 'batchCode'         // 缸号编码
  | 'barcodeValue'       // 条码值（商品编码-色号-缸号）
  | 'static'             // 静态文本

// 条码格式
export type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'CODE39' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar' | 'QRCODE'

// 文本对齐方式
export type TextAlign = 'left' | 'center' | 'right'

// 字体样式
export type FontStyle = 'normal' | 'bold' | 'italic' | 'bold italic'

// 条码模板元素
export interface BarcodeElement {
  id: string
  type: BarcodeElementType
  x: number              // X坐标（毫米）
  y: number              // Y坐标（毫米）
  width: number          // 宽度（毫米）
  height: number         // 高度（毫米）
  rotation?: number      // 旋转角度（度）
  
  // 文本元素属性
  text?: string          // 文本内容（静态文本）- 兼容旧版本
  dataSource?: DataSourceType  // 数据源（动态文本）- 兼容旧版本
  textParts?: Array<{ type: 'static' | 'field', content: string }>  // 文本片段数组（支持混合内容）
  fontSize?: number      // 字体大小（磅）
  fontFamily?: string    // 字体
  fontStyle?: FontStyle   // 字体样式
  color?: string         // 文字颜色
  textAlign?: TextAlign  // 文本对齐
  
  // 条码元素属性
  barcodeFormat?: BarcodeFormat  // 条码格式
  barcodeWidth?: number   // 条码宽度
  barcodeHeight?: number  // 条码高度
  displayValue?: boolean  // 是否显示条码值
  fontSizeBarcode?: number // 条码值字体大小
  
  // 图片元素属性
  imageUrl?: string       // 图片URL
  
  // 线条/矩形元素属性
  strokeColor?: string   // 线条颜色
  strokeWidth?: number   // 线条宽度
  fillColor?: string     // 填充颜色
  lineAngle?: number     // 线条角度（度，0=水平，90=垂直）
  
  // 表格元素属性（用于条码标签表格）
  tableColumns?: string[]
  tableColumnWidths?: number[]
  tableRows?: number
  tableRowHeights?: number[]
  showHeader?: boolean
  borderWidth?: number
  borderColor?: string

  // 通用属性
  visible?: boolean       // 是否可见
  zIndex?: number        // 层级
}

// 条码模板
export interface BarcodeTemplate {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  
  // 页面设置
  pageWidth: number      // 页面宽度（毫米）
  pageHeight: number     // 页面高度（毫米）
  marginTop: number      // 上边距（毫米）
  marginRight: number    // 右边距（毫米）
  marginBottom: number   // 下边距（毫米）
  marginLeft: number     // 左边距（毫米）
  
  // 元素列表
  elements: BarcodeElement[]
  
  // 元数据
  createdAt: string
  updatedAt: string
}

