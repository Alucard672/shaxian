import { create } from 'zustand'
import { Product, Color, Batch } from '@/types/product'
import { productApi } from '@/api/client'

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
  addBatch: (colorId: string, data: Omit<Batch, 'id' | 'colorId' | 'createdAt' | 'updatedAt'>) => Promise<Batch>
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
      set({ products, loading: false })
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
        set((state) => ({
          colors: [
            ...state.colors.filter((c) => c.productId !== productId),
            ...colors,
          ],
        }))
      } else {
        // 加载所有商品的色号
        const { products } = get()
        const allColors: Color[] = []
        for (const product of products) {
          try {
            const colors = await productApi.getColors(product.id)
            allColors.push(...colors)
          } catch (error) {
            console.error(`Failed to load colors for product ${product.id}:`, error)
          }
        }
        set({ colors: allColors })
      }
    } catch (error: any) {
      console.error('Failed to load colors:', error)
      set((state) => ({ ...state, error: error.message || 'Failed to load colors' }))
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
      const newColor = await productApi.createColor(productId, data)
      set((state) => ({
        colors: [...state.colors, newColor]
      }))
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
