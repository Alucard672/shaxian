// 客户类型（直客、经销商为预设，支持自定义）
export type CustomerType = string

// 客户状态枚举
export type CustomerStatus = '正常' | '停用'

// 供应商类型枚举
export type SupplierType = '厂家' | '贸易商'

// 供应商状态枚举
export type SupplierStatus = '合作中' | '已停用'

// 结算周期枚举
export type SettlementCycle = '现结' | '月结' | '季结'

// 客户
export interface Customer {
  id: string
  name: string
  code?: string // 已去掉编码字段，可选兼容历史数据
  contactPerson?: string // 联系人
  phone?: string // 联系电话
  address?: string // 联系地址
  type: CustomerType
  creditLimit?: number // 信用额度
  status: CustomerStatus
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

// 供应商
export interface Supplier {
  id: string
  name: string
  code?: string // 已去掉编码字段，可选兼容历史数据
  contactPerson?: string // 联系人
  phone?: string // 联系电话
  address?: string // 联系地址
  type: SupplierType
  settlementCycle: SettlementCycle // 结算周期
  status: SupplierStatus
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}












