import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, Color, Batch } from '@/types/product'
import { productApi } from '@/api/client'

type BatchCreateData = Omit<
  Batch,
  'id' | 'colorId' | 'createdAt' | 'updatedAt' | 'stockQuantity'
> & {
  stockQuantity?: number
}

// 前端特有字段的存储键
const FRONTEND_FIELDS_KEY = 'product-frontend-fields'

// 获取前端特有字段的存储
const getFrontendFields = (): Record<string, any> => {
  try {
    const stored = localStorage.getItem(FRONTEND_FIELDS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// 保存前端特有字段
const saveFrontendFields = (productId: string, fields: any) => {
  try {
    const stored = getFrontendFields()
    stored[productId] = { ...stored[productId], ...fields }
    localStorage.setItem(FRONTEND_FIELDS_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Failed to save frontend fields:', error)
  }
}

interface ProductState {
  products: Product[]
  colors: Color[]
  batches: Batch[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadProducts: () => Promise<void>
  loadColors: (productId?: string) => Promise<void>
  loadBatches: (colorId?: string) => Promise<void>
  loadAll: () => Promise<void>
  
  // 商品类型映射
  mapProductTypeToApi: (type: string) => string
  mapProductTypeFromApi: (type: string) => string
  
  // 色号状态映射
  mapColorStatusToApi: (status: string) => string
  mapColorStatusFromApi: (status: string) => string
  
  // 商品操作
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProduct: (id: string) => Product | undefined
  
  // 色号操作
  addColor: (productId: string, data: Omit<Color, 'id' | 'productId' | 'createdAt' | 'updatedAt'>) => Promise<Color>
  updateColor: (id: string, data: Partial<Color>) => Promise<void>
  deleteColor: (id: string) => Promise<void>
  getColor: (id: string) => Color | undefined
  getColorsByProduct: (productId: string) => Color[]
  
  // 缸号操作
  addBatch: (colorId: string, data: BatchCreateData) => Promise<Batch>
  updateBatch: (id: string, data: Partial<Batch>) => Promise<void>
  deleteBatch: (id: string) => Promise<void>
  getBatch: (id: string) => Batch | undefined
  updateBatchStock: (batchId: string, quantityChange: number) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  colors: [],
  batches: [],
  loading: false,
  error: null,

  // 加载所有商品
  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      const products = await productApi.getAll()
      const frontendFields = getFrontendFields()
      
      // 转换商品类型为前端显示值，并保留前端特有的字段
      const mappedProducts = products.map((p: any) => {
        const productId = String(p.id)
        const savedFields = frontendFields[productId] || {}
        
        const mappedProduct = {
          ...p,
          id: productId, // 确保 id 是字符串
          type: get().mapProductTypeFromApi(p.type),
          // 从 localStorage 恢复前端特有的字段（优先使用保存的字段，然后是后端返回的）
          manufacturer: savedFields.hasOwnProperty('manufacturer') ? savedFields.manufacturer : (p.manufacturer || undefined),
          needleType: savedFields.hasOwnProperty('needleType') ? savedFields.needleType : (p.needleType || undefined),
          colorCode: savedFields.hasOwnProperty('colorCode') ? savedFields.colorCode : (p.colorCode || undefined),
          width: savedFields.hasOwnProperty('width') ? savedFields.width : (p.width || undefined),
          weight: savedFields.hasOwnProperty('weight') ? savedFields.weight : (p.weight || undefined),
          images: savedFields.hasOwnProperty('images') ? savedFields.images : (p.images || undefined),
          // 确保规格字段也存在（这是后端字段，应该直接使用）
          specification: p.specification || undefined,
          composition: p.composition || undefined,
          count: p.count || undefined,
        } as Product
        
        return mappedProduct
      })
      set({ products: mappedProducts, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load products', loading: false })
      console.error('Failed to load products:', error)
    }
  },

  // 加载色号
  loadColors: async (productId?: string) => {
    try {
      if (productId) {
        const colors = await productApi.getColors(productId)
        // 转换后端返回的状态值为前端显示值
        const mappedColors = colors.map((c: any) => ({
          ...c,
          id: String(c.id),
          productId: String(c.productId || productId),
          status: get().mapColorStatusFromApi(c.status || 'ON_SALE'),
        }))
        set((state) => ({
          colors: [
            ...state.colors.filter((c) => c.productId !== productId),
            ...mappedColors,
          ],
        }))
      } else {
        // 加载所有商品的色号
        const { products } = get()
        const allColors: Color[] = []
        for (const product of products) {
          try {
            const colors = await productApi.getColors(product.id)
            const mappedColors = colors.map((c: any) => ({
              ...c,
              id: String(c.id),
              productId: String(c.productId || product.id),
              status: get().mapColorStatusFromApi(c.status || 'ON_SALE'),
            }))
            allColors.push(...mappedColors)
          } catch (error) {
            console.error(`Failed to load colors for product ${product.id}:`, error)
          }
        }
        set({ colors: allColors })
      }
    } catch (error: any) {
      console.error('Failed to load colors:', error)
      // 500错误通常是后端问题，保留现有数据，不清空色号列表
      const errorMessage = error?.message || ''
      if (errorMessage.includes('500') || errorMessage.includes('系统运行异常')) {
        console.warn('后端服务异常，保留现有色号数据。色号可能已创建成功，请稍后刷新页面查看')
        // 不清空现有数据，只设置错误状态
        set((state) => ({ ...state, error: '后端服务异常，无法加载色号列表。已创建的色号可能已保存成功。' }))
      } else {
        set((state) => ({ ...state, error: error.message || 'Failed to load colors' }))
      }
    }
  },

  // 加载缸号
  loadBatches: async (colorId?: string) => {
    try {
      if (colorId) {
        const batches = await productApi.getBatches(colorId)
        set((state) => ({
          batches: [
            ...state.batches.filter((b) => b.colorId !== colorId),
            ...batches,
          ],
        }))
      } else {
        // 加载所有色号的缸号
        const { colors } = get()
        const allBatches: Batch[] = []
        for (const color of colors) {
          try {
            const batches = await productApi.getBatches(color.id)
            allBatches.push(...batches)
          } catch (error) {
            console.error(`Failed to load batches for color ${color.id}:`, error)
          }
        }
        set({ batches: allBatches })
      }
    } catch (error: any) {
      console.error('Failed to load batches:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load batches' }))
    }
  },

  // 加载所有数据
  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      await get().loadProducts()
      await get().loadColors()
      await get().loadBatches()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load product data', loading: false })
    }
  },

  // 商品类型映射：前端中文 -> 后端枚举
  mapProductTypeToApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      '纱线': 'RAW_MATERIAL',
      '面料': 'SEMI_FINISHED',
    }
    return typeMap[type] || type
  },

  // 商品类型映射：后端枚举 -> 前端中文
  mapProductTypeFromApi: (type: string): string => {
    const typeMap: Record<string, string> = {
      'RAW_MATERIAL': '纱线',
      'SEMI_FINISHED': '面料',  // 半成品映射为面料
      'FINISHED': '面料',        // 成品也映射为面料
    }
    return typeMap[type] || type
  },

  // 色号状态映射：前端中文 -> 后端枚举
  mapColorStatusToApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      '在售': 'ON_SALE',
      '停售': 'DISCONTINUED',
    }
    return statusMap[status] || status
  },

  // 色号状态映射：后端枚举 -> 前端中文
  mapColorStatusFromApi: (status: string): string => {
    const statusMap: Record<string, string> = {
      'ON_SALE': '在售',
      'DISCONTINUED': '停售',
    }
    return statusMap[status] || status
  },

  // 商品操作
  addProduct: async (data) => {
    try {
      // 转换商品类型为后端枚举值，并只发送API文档中定义的字段
      const apiData: any = {
        name: data.name,
        code: data.code,
        type: get().mapProductTypeToApi(data.type),
      }
      // 可选字段
      if (data.specification) apiData.specification = data.specification
      if (data.composition) apiData.composition = data.composition
      if (data.count) apiData.count = data.count
      if (data.unit) apiData.unit = data.unit
      if (data.isWhiteYarn !== undefined) apiData.isWhiteYarn = data.isWhiteYarn
      if (data.description) apiData.description = data.description
      
      const newProduct = await productApi.create(apiData)
      // 转换返回的商品类型为前端显示值，并保留前端特有的字段
      const productId = String(newProduct.id)
      const frontendFields = {
        manufacturer: data.manufacturer,
        needleType: data.needleType,
        width: data.width,
        weight: data.weight,
        colorCode: data.colorCode,
        images: data.images,
      }
      
      // 保存前端特有字段到 localStorage
      saveFrontendFields(productId, frontendFields)
      
      const mappedProduct = {
        ...newProduct,
        id: productId,
        type: get().mapProductTypeFromApi(newProduct.type),
        // 保留前端特有的字段（不在API文档中）
        ...frontendFields,
      }
      set((state) => ({
        products: [...state.products, mappedProduct]
      }))
      return mappedProduct
    } catch (error: any) {
      console.error('Failed to add product:', error)
      throw error
    }
  },

  updateProduct: async (id, data) => {
    try {
      // 转换商品类型为后端枚举值，并只发送API文档中定义的字段
      const apiData: any = {}
      if (data.name) apiData.name = data.name
      if (data.code) apiData.code = data.code
      if (data.type) apiData.type = get().mapProductTypeToApi(data.type)
      if (data.specification !== undefined) apiData.specification = data.specification
      if (data.composition !== undefined) apiData.composition = data.composition
      if (data.count !== undefined) apiData.count = data.count
      if (data.unit !== undefined) apiData.unit = data.unit
      if (data.isWhiteYarn !== undefined) apiData.isWhiteYarn = data.isWhiteYarn
      if (data.description !== undefined) apiData.description = data.description
      
      const updated = await productApi.update(id, apiData)
      // 转换返回的商品类型为前端显示值，并保留前端特有的字段
      const currentProduct = get().products.find((p) => p.id === id)
      const frontendFields = {
        manufacturer: data.manufacturer !== undefined ? data.manufacturer : currentProduct?.manufacturer,
        needleType: data.needleType !== undefined ? data.needleType : currentProduct?.needleType,
        width: data.width !== undefined ? data.width : currentProduct?.width,
        weight: data.weight !== undefined ? data.weight : currentProduct?.weight,
        colorCode: data.colorCode !== undefined ? data.colorCode : currentProduct?.colorCode,
        images: data.images !== undefined ? data.images : currentProduct?.images,
      }
      
      // 保存前端特有字段到 localStorage
      saveFrontendFields(id, frontendFields)
      
      const mappedProduct = {
        ...updated,
        id: String(updated.id),
        type: get().mapProductTypeFromApi(updated.type),
        // 保留前端特有的字段（不在API文档中）
        ...frontendFields,
      }
      set((state) => ({
        products: state.products.map((p) => p.id === id ? mappedProduct : p)
      }))
    } catch (error: any) {
      console.error('Failed to update product:', error)
      throw error
    }
  },

  deleteProduct: async (id) => {
    try {
      await productApi.delete(id)
      // 清理 localStorage 中的前端特有字段
      try {
        const stored = getFrontendFields()
        delete stored[id]
        localStorage.setItem(FRONTEND_FIELDS_KEY, JSON.stringify(stored))
      } catch (error) {
        console.error('Failed to clean frontend fields:', error)
      }
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        colors: state.colors.filter((c) => c.productId !== id),
      }))
    } catch (error: any) {
      console.error('Failed to delete product:', error)
      throw error
    }
  },

  getProduct: (id) => {
    return get().products.find((p) => p.id === id)
  },

  // 色号操作
  addColor: async (productId, data) => {
    try {
      // 转换前端状态值为后端枚举值
      const apiData: any = {
        code: data.code,
        name: data.name,
        status: get().mapColorStatusToApi(data.status || '在售'),
      }
      if (data.colorValue) apiData.colorValue = data.colorValue
      if (data.description) apiData.description = data.description
      
      const newColor = await productApi.createColor(productId, apiData)
      // 转换返回的状态值为前端显示值
      const mappedColor = {
        ...newColor,
        id: String(newColor.id),
        productId: String(newColor.productId || productId),
        status: get().mapColorStatusFromApi(newColor.status || 'ON_SALE'),
      }
      set((state) => ({
        colors: [...state.colors, mappedColor]
      }))
      return mappedColor
    } catch (error: any) {
      console.error('Failed to add color:', error)
      throw error
    }
  },

  updateColor: async (id, data) => {
    try {
      // 转换前端状态值为后端枚举值
      const apiData: any = {}
      if (data.code !== undefined) apiData.code = data.code
      if (data.name !== undefined) apiData.name = data.name
      if (data.status !== undefined) apiData.status = get().mapColorStatusToApi(data.status)
      if (data.colorValue !== undefined) apiData.colorValue = data.colorValue
      if (data.description !== undefined) apiData.description = data.description
      
      const updated = await productApi.updateColor(id, apiData)
      // 转换返回的状态值为前端显示值
      const mappedColor = {
        ...updated,
        id: String(updated.id),
        status: get().mapColorStatusFromApi(updated.status || 'ON_SALE'),
      }
      set((state) => ({
        colors: state.colors.map((c) => c.id === id ? mappedColor : c)
      }))
    } catch (error: any) {
      console.error('Failed to update color:', error)
      throw error
    }
  },

  deleteColor: async (id) => {
    try {
      await productApi.deleteColor(id)
      set((state) => ({
        colors: state.colors.filter((c) => c.id !== id),
        batches: state.batches.filter((b) => b.colorId !== id),
      }))
    } catch (error: any) {
      console.error('Failed to delete color:', error)
      throw error
    }
  },

  getColor: (id) => {
    return get().colors.find((c) => c.id === id)
  },

  getColorsByProduct: (productId) => {
    return get().colors.filter((c) => c.productId === productId)
  },

  // 缸号操作
  addBatch: async (colorId, data) => {
    try {
      const payload = {
        ...data,
        stockQuantity: data.stockQuantity ?? data.initialQuantity,
      }
      const newBatch = await productApi.createBatch(colorId, payload)
      set((state) => ({
        batches: [...state.batches, newBatch]
      }))
      return newBatch
    } catch (error: any) {
      console.error('Failed to add batch:', error)
      throw error
    }
  },

  updateBatch: async (id, data) => {
    try {
      const updated = await productApi.updateBatch(id, data)
      set((state) => ({
        batches: state.batches.map((b) => b.id === id ? updated : b)
      }))
    } catch (error: any) {
      console.error('Failed to update batch:', error)
      throw error
    }
  },

  deleteBatch: async (id) => {
    try {
      await productApi.deleteBatch(id)
      set((state) => ({
        batches: state.batches.filter((b) => b.id !== id)
      }))
    } catch (error: any) {
      console.error('Failed to delete batch:', error)
      throw error
    }
  },

  getBatch: (id) => {
    return get().batches.find((b) => b.id === id)
  },

  // 更新缸号库存
  updateBatchStock: async (batchId, quantityChange) => {
    try {
      const batch = get().batches.find((b) => b.id === batchId)
      if (!batch) {
        throw new Error('Batch not found')
      }
      
      const newStockQuantity = Number(batch.stockQuantity) + quantityChange
      if (newStockQuantity < 0) {
        throw new Error('库存不足')
      }
      
      await productApi.updateBatch(batchId, {
        stockQuantity: newStockQuantity,
      })
      
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === batchId
            ? { ...b, stockQuantity: newStockQuantity }
            : b
        ),
      }))
    } catch (error: any) {
      console.error('Failed to update batch stock:', error)
      throw error
    }
  },
}))
