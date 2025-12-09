// 模板类型
export type TemplateType = 'A4模板' | '三联单'

// 打印模板
export interface PrintTemplate {
  id: string
  name: string // 模板名称
  type: TemplateType // 模板类型
  description?: string // 模板描述
  isDefault: boolean // 是否为默认模板
  documentType: '销售单' | '进货单' // 适用的单据类型
  pageSettings: {
    width: number // 宽度
    height: number // 高度
    unit: 'mm' | 'inch' // 单位：毫米或英寸
    marginTop: number // 上边距
    marginRight: number // 右边距
    marginBottom: number // 下边距
    marginLeft: number // 左边距
  }
  titleSettings: {
    enabled: boolean // 是否显示标题
    text: string // 标题文字
    fontSize: number // 字体大小
    align: 'left' | 'center' | 'right' // 对齐方式
  }
  basicInfoFields: {
    documentNumber: boolean // 单据编号
    documentDate: boolean // 单据日期
    customerName: boolean // 客户名称/供应商名称
    contactPerson: boolean // 联系人
    contactPhone: boolean // 联系电话
    deliveryAddress: boolean // 送货地址
    printDate: boolean // 打印日期
  }
  productFields: {
    showTable: boolean // 显示表格
    productCode: boolean // 商品编号/货号
    productName: boolean // 商品名称
    specification: boolean // 规格
    colorName: boolean // 颜色名称
    colorCode: boolean // 色号
    quantity: boolean // 数量/重量
    unit: boolean // 单位
    unitPrice: boolean // 单价
    amount: boolean // 金额
    batchCode: boolean // 批号
    remark: boolean // 备注
    textAlign: 'left' | 'center' | 'right' // 明细文字对齐方式
  }
  summaryFields: {
    subtotal: boolean // 小计信息
    totalAmount: boolean // 总计金额
    paymentInfo: boolean // 付款信息
    creator: boolean // 制单人
    handler: boolean // 经手人
    customerSign: boolean // 客户签字
  }
  otherElements: {
    qrcode: boolean // 二维码
    qrcodeCount?: number // 二维码数量，默认为1
    companyInfo: boolean // 公司信息
    cornerMark: boolean // 四角标记
    pageNumber: boolean // 页码
  }
  qrcodeImages?: string[] // 二维码图片URL数组
  usageCount: number // 使用次数
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
}

export interface PrintTemplateFormData {
  name: string
  type: TemplateType
  description?: string
  documentType: '销售单' | '进货单'
  pageSettings: PrintTemplate['pageSettings']
  titleSettings: PrintTemplate['titleSettings']
  basicInfoFields: PrintTemplate['basicInfoFields']
  productFields: PrintTemplate['productFields']
  summaryFields: PrintTemplate['summaryFields']
  otherElements: PrintTemplate['otherElements']
  qrcodeImages?: string[]
}

