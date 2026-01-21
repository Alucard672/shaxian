export type PrintTemplateUnit = 'mm' | 'inch'
export type PrintTextAlign = 'left' | 'center' | 'right'

export interface PrintTemplate {
  id: string
  name: string
  type?: string
  documentType?: string
  description?: string
  isDefault?: boolean
  usageCount?: number
  createdAt?: string
  updatedAt?: string

  pageSettings: {
    width: number
    height: number
    unit?: PrintTemplateUnit
    marginTop: number
    marginRight: number
    marginBottom: number
    marginLeft: number
  }

  titleSettings: {
    enabled: boolean
    text?: string
    fontSize: number
    align: PrintTextAlign
  }

  basicInfoFields: Record<string, boolean>

  productFields: Record<string, boolean | string> & {
    showTable: boolean
    textAlign?: PrintTextAlign
  }

  summaryFields: Record<string, boolean>

  otherElements: Record<string, boolean | number | string[] | undefined> & {
    qrcode?: boolean
    qrcodeCount?: number
    qrcodeImages?: string[]
    companyInfo?: boolean
    cornerMark?: boolean
    pageNumber?: boolean
  }

  barcodeSettings?: {
    width: number
    height: number
    format: string
    displayValue: boolean
    fontSize: number
    textMargin: number
    margin: number
  }

  // legacy compatibility (some templates may store qrcode images on root)
  qrcodeImages?: string[]
}

