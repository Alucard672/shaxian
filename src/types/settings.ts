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
  enableDyeingProcess: boolean
  allowNegativeStock: boolean
  productRequiredFields?: string[]
  /** 商品类型：纱线 / 面料，决定商品表单显示哪些属性 */
  productType?: '纱线' | '面料'
  /** 是否启用缸号：关闭时销售/进货等不显示缸号，自动使用色号下首个缸号；默认不开启 */
  enableBatch?: boolean
  /** 是否启用仓位：关闭时库存统一入默认仓位且页面不显示仓位 */
  enableStockLocation?: boolean
  /** 默认仓位名称，关闭仓位功能时统一入库到此仓位 */
  defaultStockLocation?: string
  /** 仓位列表（启用时使用），须包含默认仓位 */
  stockLocations?: string[]
}

/** 页面级必填项配置：pageKey -> 必填字段 id 列表 */
export type PageRequiredFieldsMap = Record<string, string[]>

export interface PageFieldOption {
  id: string
  label: string
}

/** 单据列显示配置：documentKey -> 显示的列 key 列表，空数组表示全部显示 */
export type DocumentVisibleColumnsMap = Record<string, string[]>

