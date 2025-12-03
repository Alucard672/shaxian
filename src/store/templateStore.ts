import { create } from 'zustand'
import { PrintTemplate, PrintTemplateFormData, TemplateType } from '@/types/template'
import { initPrintTemplates } from './initData'

interface TemplateState {
  templates: PrintTemplate[]
  
  // 模板操作
  addTemplate: (data: PrintTemplateFormData) => string // 返回模板ID
  updateTemplate: (id: string, data: Partial<PrintTemplateFormData>) => void
  deleteTemplate: (id: string) => void
  getTemplate: (id: string) => PrintTemplate | undefined
  getTemplatesByType: (type: TemplateType | '全部') => PrintTemplate[]
  getDefaultTemplate: (documentType: '销售单' | '进货单') => PrintTemplate | undefined
  setDefaultTemplate: (id: string) => void
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      const parsed = JSON.parse(item)
      return parsed
    }
    
    // 如果没有数据且未初始化过，使用初始数据
    const initializedKey = `${key}_initialized`
    const initialized = localStorage.getItem(initializedKey)
    if (!initialized) {
      const initData = defaultValue()
      localStorage.setItem(key, JSON.stringify(initData))
      localStorage.setItem(initializedKey, 'true')
      return initData
    }
    
    return defaultValue()
  } catch {
    return defaultValue()
  }
}

// 保存到localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadFromStorage('printTemplates', initPrintTemplates),

  addTemplate: (data) => {
    const newTemplate: PrintTemplate = {
      id: generateId(),
      ...data,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => {
      const templates = [...state.templates, newTemplate]
      saveToStorage('printTemplates', templates)
      return { templates }
    })

    return newTemplate.id
  },

  updateTemplate: (id, data) => {
    set((state) => {
      const templates = state.templates.map((t) =>
        t.id === id
          ? {
              ...t,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
      saveToStorage('printTemplates', templates)
      return { templates }
    })
  },

  deleteTemplate: (id) => {
    set((state) => {
      const templates = state.templates.filter((t) => t.id !== id)
      saveToStorage('printTemplates', templates)
      return { templates }
    })
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

  setDefaultTemplate: (id) => {
    const template = get().getTemplate(id)
    if (!template) return

    set((state) => {
      const templates = state.templates.map((t) => ({
        ...t,
        isDefault: t.id === id && t.documentType === template.documentType,
      }))
      saveToStorage('printTemplates', templates)
      return { templates }
    })
  },
}))

