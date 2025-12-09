import { create } from 'zustand'
import { useProductStore } from './productStore'
import { Batch } from '@/types/product'

interface InventoryState {
  // 获取所有库存（按商品分组）
  getInventoryByProduct: () => Array<{
    productId: string
    productName: string
    productCode: string
    totalStock: number
    unit: string
    colors: Array<{
      colorId: string
      colorName: string
      colorCode: string
      totalStock: number
      batches: Batch[]
    }>
  }>
  
  // 获取库存明细（所有缸号）
  getInventoryDetails: () => Array<{
    productId: string
    productName: string
    productCode: string
    colorId: string
    colorName: string
    colorCode: string
    batch: Batch
  }>
  
  // 按商品ID获取库存
  getInventoryByProductId: (productId: string) => {
    product: any
    totalStock: number
    colors: Array<{
      color: any
      totalStock: number
      batches: Batch[]
    }>
  } | null
  
  // 按色号ID获取库存
  getInventoryByColorId: (colorId: string) => {
    color: any
    totalStock: number
    batches: Batch[]
  } | null
  
  // 库存预警（低于安全库存）
  getLowStockAlerts: (threshold?: number) => Batch[]
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  getInventoryByProduct: () => {
    const { products, colors, batches } = useProductStore.getState()
    
    return products.map((product) => {
      const productColors = colors.filter((c) => c.productId === product.id)
      
      const colorData = productColors.map((color) => {
        const colorBatches = batches.filter((b) => b.colorId === color.id)
        const totalStock = colorBatches.reduce((sum, b) => sum + b.stockQuantity, 0)
        
        return {
          colorId: color.id,
          colorName: color.name,
          colorCode: color.code,
          totalStock,
          batches: colorBatches,
        }
      })
      
      const totalStock = colorData.reduce((sum, c) => sum + c.totalStock, 0)
      
      return {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        totalStock,
        unit: product.unit,
        colors: colorData,
      }
    })
  },

  getInventoryDetails: () => {
    const { products, colors, batches } = useProductStore.getState()
    
    return batches.map((batch) => {
      const color = colors.find((c) => c.id === batch.colorId)
      const product = color ? products.find((p) => p.id === color.productId) : null
      
      return {
        productId: product?.id || '',
        productName: product?.name || '',
        productCode: product?.code || '',
        colorId: color?.id || '',
        colorName: color?.name || '',
        colorCode: color?.code || '',
        batch,
      }
    })
  },

  getInventoryByProductId: (productId) => {
    const { products, colors, batches } = useProductStore.getState()
    const product = products.find((p) => p.id === productId)
    if (!product) return null
    
    const productColors = colors.filter((c) => c.productId === productId)
    
    const colorData = productColors.map((color) => {
      const colorBatches = batches.filter((b) => b.colorId === color.id)
      const totalStock = colorBatches.reduce((sum, b) => sum + b.stockQuantity, 0)
      
      return {
        color,
        totalStock,
        batches: colorBatches,
      }
    })
    
    const totalStock = colorData.reduce((sum, c) => sum + c.totalStock, 0)
    
    return {
      product,
      totalStock,
      colors: colorData,
    }
  },

  getInventoryByColorId: (colorId) => {
    const { colors, batches } = useProductStore.getState()
    const color = colors.find((c) => c.id === colorId)
    if (!color) return null
    
    const colorBatches = batches.filter((b) => b.colorId === colorId)
    const totalStock = colorBatches.reduce((sum, b) => sum + b.stockQuantity, 0)
    
    return {
      color,
      totalStock,
      batches: colorBatches,
    }
  },

  getLowStockAlerts: (threshold = 0) => {
    const { batches } = useProductStore.getState()
    return batches.filter((b) => b.stockQuantity <= threshold)
  },
}))









