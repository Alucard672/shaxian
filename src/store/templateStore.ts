import { create } from 'zustand'
import { PrintTemplate, PrintTemplateFormData, TemplateType } from '@/types/template'
import { templateApi } from '@/api/client'

// 解析后端返回的字符串字段为对象，并补充默认值
const parseJSON = <T>(value: any, fallback: T): T => {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'object') return value as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const normalizeFields = <T extends Record<string, any>>(raw: any, defaults: T): T => {
  // 兼容老数据：如果是字符串数组，转为布尔对象
  if (Array.isArray(raw)) {
    const result: Record<string, any> = { ...defaults }
    Object.keys(defaults).forEach((k) => {
      result[k] = raw.includes(k)
    })
    // textAlign 等非布尔字段保持默认
    return result as T
  }
  // 如果是对象，合并默认值
  if (raw && typeof raw === 'object') {
    return { ...defaults, ...raw } as T
  }
  return defaults
}

const defaultPageSettings = {
  width: 210,
  height: 297,
  unit: 'mm' as const,
  marginTop: 10,
  marginRight: 10,
  marginBottom: 10,
  marginLeft: 10,
}

const defaultBasicInfoFields = {
  documentNumber: true,
  documentDate: true,
  customerName: true,
  contactPerson: false,
  contactPhone: false,
  deliveryAddress: false,
  printDate: true,
}

const defaultProductFields = {
  showTable: true,
  productCode: true,
  productName: true,
  specification: true,
  colorName: true,
  colorCode: true,
  quantity: true,
  unit: true,
  unitPrice: true,
  amount: true,
  batchCode: true,
  remark: false,
  textAlign: 'left' as const,
}

const defaultSummaryFields = {
  subtotal: false,
  totalAmount: true,
  paymentInfo: false,
  creator: true,
  handler: true,
  customerSign: false,
}

const defaultOtherElements = {
  qrcode: false,
  qrcodeCount: 1,
  companyInfo: true,
  cornerMark: false,
  pageNumber: false,
}

const normalizeTemplate = (t: any): PrintTemplate => ({
  ...t,
  // 兼容旧版 pageSettings: { pageSize, orientation, margins }
  pageSettings: (() => {
    const raw = parseJSON<any>(t.pageSettings, defaultPageSettings)
    if ('width' in raw && 'height' in raw) {
      return { ...defaultPageSettings, ...raw }
    }
    const { pageSize, orientation, margins } = raw
    // 默认 A4 纵向
    const size = pageSize === 'A4' || !pageSize ? { width: 210, height: 297 } : defaultPageSettings
    const isLandscape = orientation === 'landscape'
    const width = isLandscape ? size.height : size.width
    const height = isLandscape ? size.width : size.height
    const margin = margins === '10mm' || !margins ? 10 : 10
    return {
      ...defaultPageSettings,
      width,
      height,
      marginTop: margin,
      marginRight: margin,
      marginBottom: margin,
      marginLeft: margin,
    }
  })(),
  titleSettings: parseJSON(t.titleSettings, {
    enabled: true,
    text: t.name || '',
    fontSize: 18,
    align: 'center',
  }),
  basicInfoFields: normalizeFields(parseJSON(t.basicInfoFields, defaultBasicInfoFields), defaultBasicInfoFields),
  productFields: normalizeFields(parseJSON(t.productFields, defaultProductFields), defaultProductFields),
  summaryFields: normalizeFields(parseJSON(t.summaryFields, defaultSummaryFields), defaultSummaryFields),
  otherElements: normalizeFields(parseJSON(t.otherElements, defaultOtherElements), defaultOtherElements),
  qrcodeImages: t.qrcodeImages || [],
})

interface TemplateState {
  templates: PrintTemplate[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadTemplates: () => Promise<void>
  
  // 模板操作
  addTemplate: (data: PrintTemplateFormData) => Promise<string> // 返回模板ID
  updateTemplate: (id: string, data: Partial<PrintTemplateFormData>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  getTemplate: (id: string) => PrintTemplate | undefined
  getTemplatesByType: (type: TemplateType | '全部') => PrintTemplate[]
  getDefaultTemplate: (documentType: '销售单' | '进货单') => PrintTemplate | undefined
  setDefaultTemplate: (id: string) => Promise<void>
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  // 加载所有模板
  loadTemplates: async () => {
    // 如果正在加载中，直接返回，避免重复请求
    if (get().loading) {
      return
    }
    
    // 如果已有数据且不在加载中，可以选择跳过（可选）
    // if (get().templates.length > 0 && !get().loading) {
    //   return
    // }
    
    set({ loading: true, error: null })
    try {
      const templates = await templateApi.getAll()
      set({ templates: templates.map(normalizeTemplate), loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load templates', loading: false })
      console.error('Failed to load templates:', error)
    }
  },

  addTemplate: async (data) => {
    try {
      const newTemplate = await templateApi.create(data)
      set((state) => ({
        templates: [...state.templates, normalizeTemplate(newTemplate)]
      }))
      return newTemplate.id
    } catch (error: any) {
      console.error('Failed to add template:', error)
      throw error
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const updated = await templateApi.update(id, data)
      set((state) => ({
        templates: state.templates.map((t) => t.id === id ? normalizeTemplate(updated) : t)
      }))
    } catch (error: any) {
      console.error('Failed to update template:', error)
      throw error
    }
  },

  deleteTemplate: async (id) => {
    try {
      await templateApi.delete(id)
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete template:', error)
      throw error
    }
  },

  getTemplate: (id) => {
    return get().templates.find((t) => t.id === id)
  },

  getTemplatesByType: (type) => {
    const templates = get().templates
    if (type === '全部') return templates
    return templates.filter((t) => t.type === type)
  },

  getDefaultTemplate: (documentType) => {
    return get().templates.find(
      (t) => t.isDefault && t.documentType === documentType
    )
  },

  setDefaultTemplate: async (id) => {
    const template = get().getTemplate(id)
    if (!template) return

    try {
      // 先取消同类型模板的默认状态
      const sameTypeTemplates = get().templates.filter(
        (t) => t.documentType === template.documentType && t.id !== id
      )
      
      // 更新所有同类型模板
      for (const t of sameTypeTemplates) {
        if (t.isDefault) {
          await templateApi.update(t.id, { isDefault: false })
        }
      }
      
      // 设置当前模板为默认
      await templateApi.update(id, { isDefault: true })
      
      // 更新本地状态
      set((state) => ({
        templates: state.templates.map((t) => {
          if (t.id === id && t.documentType === template.documentType) {
            return { ...t, isDefault: true }
          }
          if (t.documentType === template.documentType) {
            return { ...t, isDefault: false }
          }
          return t
        })
      }))
    } catch (error: any) {
      console.error('Failed to set default template:', error)
      throw error
    }
  },
}))
