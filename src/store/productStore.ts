import { create } from 'zustand'
import { Product, Color, Batch, ProductFormData, ColorFormData, BatchFormData } from '@/types/product'
import { productApi } from '@/api/client'

interface ProductState {
  products: Product[]
  colors: Color[]
  batches: Batch[]
  loading: boolean
  error: string | null
  
  // 数据加载
  loadProducts: () => Promise<void>
  loadColors: () => Promise<void>
  loadBatches: () => Promise<void>
  loadAll: () => Promise<void>
  
  // 商品操作
  addProduct: (data: ProductFormData) => Promise<Product>
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProduct: (id: string) => Product | undefined
  
  // 色号操作
  addColor: (productId: string, data: ColorFormData) => Promise<Color>
  updateColor: (id: string, data: Partial<ColorFormData>) => Promise<void>
  deleteColor: (id: string) => Promise<void>
  getColorsByProduct: (productId: string) => Color[]
  loadColorsByProduct: (productId: string) => Promise<void>
  
  // 缸号操作
  addBatch: (colorId: string, data: BatchFormData) => Promise<Batch>
  updateBatch: (id: string, data: Partial<BatchFormData>) => Promise<void>
  deleteBatch: (id: string) => Promise<void>
  getBatchesByColor: (colorId: string) => Batch[]
  loadBatchesByColor: (colorId: string) => Promise<void>
  updateBatchStock: (id: string, quantity: number) => Promise<void>
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
      set({ products, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Failed to load products', loading: false })
      console.error('Failed to load products:', error)
    }
  },

  // 加载所有色号
  loadColors: async () => {
    try {
      // 确保商品列表已加载
      const products = get().products
      if (products.length === 0) {
        // 如果商品列表为空，先加载商品
        await get().loadProducts()
      }
      const allProducts = get().products
      const allColors: Color[] = []
      for (const product of allProducts) {
        try {
          const colors = await productApi.getColors(product.id)
          allColors.push(...colors)
        } catch (error) {
          console.error(`Failed to load colors for product ${product.id}:`, error)
        }
      }
      set({ colors: allColors })
    } catch (error: any) {
      console.error('Failed to load colors:', error)
    }
  },

  // 加载所有缸号
  loadBatches: async () => {
    try {
      const colors = get().colors
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
    } catch (error: any) {
      console.error('Failed to load batches:', error)
    }
  },

  // 加载所有数据
  loadAll: async () => {
    await get().loadProducts()
    await get().loadColors()
    await get().loadBatches()
  },

  // 商品操作
  addProduct: async (data) => {
    try {
      const newProduct = await productApi.create(data)
      set((state) => ({
        products: [...state.products, newProduct]
      }))
      return newProduct
    } catch (error: any) {
      console.error('Failed to add product:', error)
      throw error
    }
  },

  updateProduct: async (id, data) => {
    try {
      const updated = await productApi.update(id, data)
      set((state) => ({
        products: state.products.map((p) => p.id === id ? updated : p)
      }))
    } catch (error: any) {
      console.error('Failed to update product:', error)
      throw error
    }
  },

  deleteProduct: async (id) => {
    try {
      await productApi.delete(id)
      set((state) => {
        // 删除商品时，同时删除关联的色号和缸号
        const productColors = state.colors.filter((c) => c.productId === id)
        const colorIds = productColors.map((c) => c.id)
        
        return {
          products: state.products.filter((p) => p.id !== id),
          colors: state.colors.filter((c) => c.productId !== id),
          batches: state.batches.filter((b) => !colorIds.includes(b.colorId))
        }
      })
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
      const newColor = await productApi.createColor(productId, data)
      set((state) => {
        // 检查是否已存在（避免重复）
        const exists = state.colors.some(c => c.id === newColor.id)
        if (exists) {
          // 如果已存在，更新它
          return {
            colors: state.colors.map(c => c.id === newColor.id ? newColor : c)
          }
        }
        return {
          colors: [...state.colors, newColor]
        }
      })
      return newColor
    } catch (error: any) {
      console.error('Failed to add color:', error)
      throw error
    }
  },

  updateColor: async (id, data) => {
    try {
      const updated = await productApi.updateColor(id, data)
      set((state) => ({
        colors: state.colors.map((c) => c.id === id ? updated : c)
      }))
    } catch (error: any) {
      console.error('Failed to update color:', error)
      throw error
    }
  },

  deleteColor: async (id) => {
    try {
      await productApi.deleteColor(id)
      set((state) => {
        // 删除色号时，同时删除关联的缸号
        return {
          colors: state.colors.filter((c) => c.id !== id),
          batches: state.batches.filter((b) => b.colorId !== id)
        }
      })
    } catch (error: any) {
      console.error('Failed to delete color:', error)
      throw error
    }
  },

  getColorsByProduct: (productId) => {
    return get().colors.filter((c) => c.productId === productId)
  },

  loadColorsByProduct: async (productId) => {
    try {
      const colors = await productApi.getColors(productId)
      set((state) => {
        // 替换该商品的所有色号，而不是只添加新的
        const otherColors = state.colors.filter(c => c.productId !== productId)
        return {
          colors: [...otherColors, ...colors]
        }
      })
    } catch (error: any) {
      console.error('Failed to load colors by product:', error)
      throw error
    }
  },

  // 缸号操作
  addBatch: async (colorId, data) => {
    try {
      const newBatch = await productApi.createBatch(colorId, data)
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

  getBatchesByColor: (colorId) => {
    return get().batches.filter((b) => b.colorId === colorId)
  },

  loadBatchesByColor: async (colorId) => {
    try {
      const batches = await productApi.getBatches(colorId)
      set((state) => {
        // 合并新加载的缸号，避免重复
        const existingIds = new Set(state.batches.map(b => b.id))
        const newBatches = batches.filter(b => !existingIds.has(b.id))
        return {
          batches: [...state.batches, ...newBatches]
        }
      })
    } catch (error: any) {
      console.error('Failed to load batches by color:', error)
      throw error
    }
  },

  updateBatchStock: async (id, quantity) => {
    try {
      const batch = get().batches.find(b => b.id === id)
      if (!batch) throw new Error('Batch not found')
      
      await productApi.updateBatch(id, { stockQuantity: quantity })
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, stockQuantity: quantity } : b
        )
      }))
    } catch (error: any) {
      console.error('Failed to update batch stock:', error)
      throw error
    }
  },
}))
