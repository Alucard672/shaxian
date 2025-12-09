// 客户类型枚举
export type CustomerType = '直客' | '经销商'

// 客户状态枚举
export type CustomerStatus = '正常' | '冻结'

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
  code: string // 客户编码
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
  code: string // 供应商编码
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









