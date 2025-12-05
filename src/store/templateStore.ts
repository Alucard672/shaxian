import { create } from 'zustand'
import { PrintTemplate, PrintTemplateFormData, TemplateType } from '@/types/template'
import { templateApi } from '@/api/client'

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
    set({ loading: true, error: null })
    try {
      const templates = await templateApi.getAll()
      set({ templates, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load templates', loading: false })
      console.error('Failed to load templates:', error)
    }
  },

  addTemplate: async (data) => {
    try {
      const newTemplate = await templateApi.create(data)
      set((state) => ({
        templates: [...state.templates, newTemplate]
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
        templates: state.templates.map((t) => t.id === id ? updated : t)
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
        templates: state.templates.map((t) => ({
          ...t,
          isDefault: t.id === id && t.documentType === template.documentType,
        }))
      }))
    } catch (error: any) {
      console.error('Failed to set default template:', error)
      throw error
    }
  },
}))
