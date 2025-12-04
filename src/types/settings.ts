// 门店信息
export interface StoreInfo {
  name: string // 门店名称
  code?: string // 门店编码
  address?: string // 地址
  phone?: string // 电话
  email?: string // 邮箱
  fax?: string // 传真
  postalCode?: string // 邮编
  remark?: string // 备注
}

// 员工信息
export interface Employee {
  id: string
  name: string // 员工姓名
  position?: string // 职位
  phone?: string // 联系电话
  email?: string // 电子邮箱
  role?: string // 角色
  status: 'active' | 'inactive' // 状态
  createdAt: string
  updatedAt: string
}

// 库存预警设置
export interface InventoryAlertSettings {
  enabled: boolean // 是否启用预警
  threshold?: number // 预警阈值（百分比或数量）
  autoAlert: boolean // 是否自动预警
}

// 角色信息
export interface Role {
  id: string
  name: string // 角色名称
  description?: string // 角色描述
  permissions: string[] // 权限列表
  createdAt: string
  updatedAt: string
}

// 自定义查询设置
export interface CustomQuery {
  id: string
  name: string // 查询名称
  module: string // 模块（如：product, purchase, sales）
  conditions: Record<string, any> // 查询条件
  createdAt: string
  updatedAt: string
}

// 系统信息
export interface SystemInfo {
  systemName: string
  version: string
  lastUpdate: string
}

// 系统参数设置
export interface SystemParams {
  // 染色加工流程
  enableDyeingProcess: boolean // 是否启用染色加工流程，默认false
}

