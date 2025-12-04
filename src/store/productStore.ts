import { create } from 'zustand'
import { Product, Color, Batch, ProductFormData, ColorFormData, BatchFormData } from '@/types/product'
// 移除硬编码数据，使用空数组作为初始值

interface ProductState {
  products: Product[]
  colors: Color[]
  batches: Batch[]
  
  // 商品操作
  addProduct: (data: ProductFormData) => Product
  updateProduct: (id: string, data: Partial<ProductFormData>) => void
  deleteProduct: (id: string) => void
  getProduct: (id: string) => Product | undefined
  
  // 色号操作
  addColor: (productId: string, data: ColorFormData) => Color
  updateColor: (id: string, data: Partial<ColorFormData>) => void
  deleteColor: (id: string) => void
  getColorsByProduct: (productId: string) => Color[]
  
  // 缸号操作
  addBatch: (colorId: string, data: BatchFormData) => Batch
  updateBatch: (id: string, data: Partial<BatchFormData>) => void
  deleteBatch: (id: string) => void
  getBatchesByColor: (colorId: string) => Batch[]
  updateBatchStock: (id: string, quantity: number) => void
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据，如果为空则使用初始数据
const loadFromStorage = (key: string, initData: any) => {
  try {
    const item = localStorage.getItem(key)
    if (item) {
      const data = JSON.parse(item)
      // 如果数据不为空，返回数据
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
      // 如果数据为空数组，检查是否已初始化过
      if (Array.isArray(data) && data.length === 0) {
        const initialized = localStorage.getItem(`${key}_initialized`)
        if (initialized === 'true') {
          return data // 已初始化过，返回空数组
        }
      }
    }
    // 使用初始数据并标记为已初始化
    localStorage.setItem(key, JSON.stringify(initData))
    localStorage.setItem(`${key}_initialized`, 'true')
    return initData
  } catch {
    return initData
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

export const useProductStore = create<ProductState>((set, get) => ({
  products: loadFromStorage('products', []),
  colors: loadFromStorage('colors', []),
  batches: loadFromStorage('batches', []),

  // 商品操作
  addProduct: (data) => {
    const newProduct: Product = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => {
      const products = [...state.products, newProduct]
      saveToStorage('products', products)
      return { products }
    })
    return newProduct
  },

  updateProduct: (id, data) => {
    set((state) => {
      const products = state.products.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      )
      saveToStorage('products', products)
      return { products }
    })
  },

  deleteProduct: (id) => {
    set((state) => {
      // 删除商品时，同时删除关联的色号和缸号
      const productColors = state.colors.filter((c) => c.productId === id)
      const colorIds = productColors.map((c) => c.id)
      
      const products = state.products.filter((p) => p.id !== id)
      const colors = state.colors.filter((c) => c.productId !== id)
      const batches = state.batches.filter((b) => !colorIds.includes(b.colorId))
      
      saveToStorage('products', products)
      saveToStorage('colors', colors)
      saveToStorage('batches', batches)
      
      return { products, colors, batches }
    })
  },

  getProduct: (id) => {
    return get().products.find((p) => p.id === id)
  },

  // 色号操作
  addColor: (productId, data) => {
    const newColor: Color = {
      id: generateId(),
      productId,
      ...data,
    }
    set((state) => {
      const colors = [...state.colors, newColor]
      saveToStorage('colors', colors)
      return { colors }
    })
    return newColor
  },

  updateColor: (id, data) => {
    set((state) => {
      const colors = state.colors.map((c) =>
        c.id === id ? { ...c, ...data } : c
      )
      saveToStorage('colors', colors)
      return { colors }
    })
  },

  deleteColor: (id) => {
    set((state) => {
      // 删除色号时，同时删除关联的缸号
      const colors = state.colors.filter((c) => c.id !== id)
      const batches = state.batches.filter((b) => b.colorId !== id)
      
      saveToStorage('colors', colors)
      saveToStorage('batches', batches)
      
      return { colors, batches }
    })
  },

  getColorsByProduct: (productId) => {
    return get().colors.filter((c) => c.productId === productId)
  },

  // 缸号操作
  addBatch: (colorId, data) => {
    const newBatch: Batch = {
      id: generateId(),
      colorId,
      stockQuantity: data.initialQuantity,
      ...data,
    }
    set((state) => {
      const batches = [...state.batches, newBatch]
      saveToStorage('batches', batches)
      return { batches }
    })
    return newBatch
  },

  updateBatch: (id, data) => {
    set((state) => {
      const batches = state.batches.map((b) =>
        b.id === id ? { ...b, ...data } : b
      )
      saveToStorage('batches', batches)
      return { batches }
    })
  },

  deleteBatch: (id) => {
    set((state) => {
      const batches = state.batches.filter((b) => b.id !== id)
      saveToStorage('batches', batches)
      return { batches }
    })
  },

  getBatchesByColor: (colorId) => {
    return get().batches.filter((b) => b.colorId === colorId)
  },

  updateBatchStock: (id, quantity) => {
    set((state) => {
      const batches = state.batches.map((b) =>
        b.id === id ? { ...b, stockQuantity: quantity } : b
      )
      saveToStorage('batches', batches)
      return { batches }
    })
  },
}))






