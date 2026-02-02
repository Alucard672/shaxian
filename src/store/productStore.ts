import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, Color, Batch } from '@/types/product'
import { productApi } from '@/api/client'
import { useSettingsStore } from './settingsStore'

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

  // 加载所有商品（接口返回 HTML/404 等时为 null，按空数组处理）
  loadProducts: async () => {
    set({ loading: true, error: null })
    try {
      const raw = await productApi.getAll()
      const products = Array.isArray(raw) ? raw : []
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
        const raw = await productApi.getColors(productId)
        const colors = Array.isArray(raw) ? raw : []
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
        
        // 过滤掉无效的商品 ID（确保 ID 存在且有效）
        const validProducts = products.filter(p => {
          if (!p || !p.id) return false
          const productId = String(p.id).trim()
          // 过滤掉明显无效的 ID
          if (!productId || productId === 'undefined' || productId === 'null' || productId === '0') {
            return false
          }
          return true
        })
        
        // 使用 Promise.allSettled 并行加载，即使部分失败也不影响其他
        const colorPromises = validProducts.map(async (product) => {
          try {
            const productId = String(product.id).trim()
            const colors = await productApi.getColors(productId)
            
            // 确保返回的是数组
            if (Array.isArray(colors)) {
              return colors.map((c: any) => ({
                ...c,
                id: String(c.id),
                productId: String(c.productId || productId),
                status: get().mapColorStatusFromApi(c.status || 'ON_SALE'),
              }))
            }
            return []
          } catch (error: any) {
            // 静默处理 500 错误，不记录到控制台
            const errorMessage = error?.message || ''
            if (errorMessage.includes('500') || errorMessage.includes('系统运行异常')) {
              // 完全静默，不输出任何日志
              return []
            }
            // 其他错误才记录
            console.error(`Failed to load colors for product ${product.id}:`, error)
            return []
          }
        })
        
        // 等待所有请求完成（无论成功或失败）
        const results = await Promise.allSettled(colorPromises)
        
        // 收集所有成功的结果
        results.forEach((result) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allColors.push(...result.value)
          }
        })
        
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
        const raw = await productApi.getBatches(colorId)
        const batches = Array.isArray(raw) ? raw : []
        const mappedBatches = batches.map((b: any) => ({
          ...b,
          id: String(b.id),
          colorId: String(b.colorId || colorId),
          stockQuantity: Number(b.stockQuantity ?? 0),
          initialQuantity: Number(b.initialQuantity ?? 0),
        }))
        set((state) => ({
          batches: [
            ...state.batches.filter((b) => b.colorId !== colorId),
            ...mappedBatches,
          ],
        }))
      } else {
        // 加载所有色号的缸号
        const { colors } = get()
        const allBatches: Batch[] = []
        
        // 过滤掉无效的色号 ID
        const validColors = colors.filter(c => {
          if (!c || !c.id) return false
          const colorId = String(c.id).trim()
          if (!colorId || colorId === 'undefined' || colorId === 'null' || colorId === '0') {
            return false
          }
          return true
        })
        
        // 使用 Promise.allSettled 并行加载
        const batchPromises = validColors.map(async (color) => {
          try {
            const colorId = String(color.id).trim()
            const batches = await productApi.getBatches(colorId)
            
            if (Array.isArray(batches)) {
              return batches.map((b: any) => ({
                ...b,
                id: String(b.id),
                colorId: String(b.colorId || colorId),
                stockQuantity: Number(b.stockQuantity ?? 0),
                initialQuantity: Number(b.initialQuantity ?? 0),
              }))
            }
            return []
          } catch (error: any) {
            // 静默处理 500 错误
            const errorMessage = error?.message || ''
            if (errorMessage.includes('500') || errorMessage.includes('系统运行异常')) {
              // 完全静默，不输出任何日志
              return []
            }
            // 其他错误才记录
            console.error(`Failed to load batches for color ${color.id}:`, error)
            return []
          }
        })
        
        // 等待所有请求完成
        const results = await Promise.allSettled(batchPromises)
        
        // 收集所有成功的结果
        results.forEach((result) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allBatches.push(...result.value)
          }
        })
        
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
      // 先加载商品列表
      await get().loadProducts()
      
      // 加载色号和缸号时，即使部分失败也不影响整体
      try {
        await get().loadColors()
      } catch (error: any) {
        console.warn('部分色号加载失败，但不影响页面使用:', error)
        // 不设置全局错误，允许页面继续使用
      }
      
      try {
        await get().loadBatches()
      } catch (error: any) {
        console.warn('部分缸号加载失败，但不影响页面使用:', error)
        // 不设置全局错误，允许页面继续使用
      }
      
      set({ loading: false })
    } catch (error: any) {
      // 只有商品列表加载失败才设置错误
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
      if (!newProduct || typeof newProduct !== 'object' || newProduct.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
      // 转换返回的商品类型为前端显示值，并保留前端特有的字段
      const productId = String(newProduct.id)
      const frontendFields = {
        manufacturer: data.manufacturer,
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
      if (!updated || typeof updated !== 'object' || updated.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
      // 转换返回的商品类型为前端显示值，并保留前端特有的字段
      const currentProduct = get().products.find((p) => p.id === id)
      const frontendFields = {
        manufacturer: data.manufacturer !== undefined ? data.manufacturer : currentProduct?.manufacturer,
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
      if (!newColor || typeof newColor !== 'object' || newColor.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
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
      if (!updated || typeof updated !== 'object' || updated.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
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
      if (!newBatch || typeof newBatch !== 'object' || newBatch.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
      const mappedBatch = {
        ...newBatch,
        id: String((newBatch as any).id),
        colorId: String((newBatch as any).colorId || colorId),
        code: (newBatch as any).code ?? (newBatch as any).batchCode ?? (data as any).code ?? '',
        stockQuantity: Number((newBatch as any).stockQuantity ?? 0),
        initialQuantity: Number((newBatch as any).initialQuantity ?? 0),
      }
      set((state) => ({
        batches: [...state.batches, mappedBatch]
      }))
      return mappedBatch
    } catch (error: any) {
      console.error('Failed to add batch:', error)
      throw error
    }
  },

  updateBatch: async (id, data) => {
    try {
      const updated = await productApi.updateBatch(id, data)
      if (!updated || typeof updated !== 'object' || updated.id == null) {
        throw new Error('接口未返回有效数据，请检查网络或稍后重试；若已切换 API 地址，请重新登录后再操作。')
      }
      const mapped = {
        ...updated,
        id: String((updated as any).id),
        colorId: String((updated as any).colorId || ''),
        stockQuantity: Number((updated as any).stockQuantity ?? 0),
        initialQuantity: Number((updated as any).initialQuantity ?? 0),
      }
      set((state) => ({
        batches: state.batches.map((b) => b.id === String(id) ? mapped : b)
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
        batches: state.batches.filter((b) => b.id !== String(id))
      }))
    } catch (error: any) {
      console.error('Failed to delete batch:', error)
      throw error
    }
  },

  getBatch: (id) => {
    return get().batches.find((b) => b.id === String(id))
  },

  // 更新缸号库存（尊重系统参数 allowNegativeStock：启用时允许负库存）
  updateBatchStock: async (batchId, quantityChange) => {
    try {
      const batch = get().batches.find((b) => b.id === String(batchId))
      if (!batch) {
        throw new Error('Batch not found')
      }
      
      const newStockQuantity = Number(batch.stockQuantity) + quantityChange
      const allowNegativeStock = !!useSettingsStore.getState().systemParams?.allowNegativeStock
      if (newStockQuantity < 0 && !allowNegativeStock) {
        throw new Error('库存不足')
      }
      
      await productApi.updateBatch(batchId, {
        stockQuantity: newStockQuantity,
      })
      
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === String(batchId)
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
