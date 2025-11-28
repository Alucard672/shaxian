// 商品类型枚举
export type ProductType = '原料' | '半成品' | '成品'

// 色号状态枚举
export type ColorStatus = '在售' | '停售'

// 商品实体
export interface Product {
  id: string
  name: string
  code: string
  specification?: string // 规格，如"32支"
  composition?: string // 成分，如"100%棉"
  count?: string // 支数，如"32s"
  unit: string // 单位，如"公斤"
  type: ProductType
  createdAt: string
  updatedAt: string
  colors?: Color[] // 关联的色号列表
}

// 色号实体
export interface Color {
  id: string
  productId: string
  code: string // 色号编码
  name: string // 色号名称，如"天蓝色"
  colorValue?: string // HEX颜色值，如"#87CEEB"
  description?: string // 颜色描述
  status: ColorStatus
  batches?: Batch[] // 关联的缸号列表
}

// 缸号实体
export interface Batch {
  id: string
  colorId: string
  code: string // 缸号编码
  productionDate: string // 生产日期
  supplierId?: string // 供应商ID
  supplierName?: string // 供应商名称（用于显示）
  purchasePrice?: number // 采购单价
  stockQuantity: number // 当前库存数量
  initialQuantity: number // 初始数量（采购入库数量）
  stockLocation?: string // 库存位置
  remark?: string // 备注
}

// 商品表单数据
export interface ProductFormData {
  name: string
  code: string
  specification?: string
  composition?: string
  count?: string
  unit: string
  type: ProductType
}

// 色号表单数据
export interface ColorFormData {
  code: string
  name: string
  colorValue?: string
  description?: string
  status: ColorStatus
}

// 缸号表单数据
export interface BatchFormData {
  code: string
  productionDate: string
  supplierId?: string
  purchasePrice?: number
  initialQuantity: number
  stockLocation?: string
  remark?: string
}


