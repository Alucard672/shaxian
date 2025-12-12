// 商品类型
export type ProductType = '原料' | '半成品' | '成品'

// 色号状态
export type ColorStatus = '在售' | '停售'

// 商品
export interface Product {
  id: string
  name: string
  code: string
  specification?: string
  composition?: string
  count?: string
  unit: string
  type: ProductType
  isWhiteYarn?: boolean
  description?: string
  // 双单位相关字段
  auxiliaryUnit?: string // 辅助单位（如：件）
  unitWeight?: number // 单件重量
  enableDualUnit?: boolean // 是否启用双单位
  tenantId?: string
  createdAt: string
  updatedAt: string
}

// 色号
export interface Color {
  id: string
  productId: string
  code: string
  name: string
  colorValue?: string
  description?: string
  status: ColorStatus
  createdAt: string
  updatedAt: string
}

// 缸号
export interface Batch {
  id: string
  colorId: string
  code: string
  productionDate?: string
  supplierId?: string
  supplierName?: string
  purchasePrice?: number
  stockQuantity: number
  initialQuantity: number
  stockLocation?: string
  remark?: string
  // 双单位相关字段
  pieceCount?: number // 件数
  looseWeight?: number // 散重量
  unitWeight?: number // 单件重量
  tenantId?: string
  createdAt: string
  updatedAt: string
}
