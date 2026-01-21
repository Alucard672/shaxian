// 商品类型
export type ProductType = '纱线' | '面料'

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
  manufacturer?: string // 厂家
  // 双单位相关字段
  enableDualUnit?: boolean // 是否启用双单位
  primaryUnit?: string // 一级单位（如：打）
  secondaryUnit?: string // 子单位（如：支）
  unitConversion?: number // 换算重量（如：1打 = 12支，则值为12）
  // 新增字段
  needleType?: string // 针型（纱线专用）
  width?: string // 幅宽（面料专用）
  weight?: string // 克重（面料专用）
  colorCode?: string // 色号
  images?: string[] // 图片URL数组，最多9张
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
