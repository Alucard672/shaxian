// 染色加工单状态枚举
export type DyeingOrderStatus = '待发货' | '加工中' | '已完成' | '已入库' | '已取消'

// 染色加工单目标色号项目
export interface DyeingOrderItem {
  id: string
  targetColorId: string // 目标色号ID
  targetColorCode: string // 目标色号编码
  targetColorName: string // 目标色号名称
  targetColorValue?: string // 目标色号颜色值（HEX）
  quantity: number // 染色重量 (kg)
}

// 染色加工单
export interface DyeingOrder {
  id: string
  orderNumber: string // 加工单号，如"JG20231128001"
  productId: string
  productName: string // 商品名称
  greyBatchId: string // 白坯缸号ID
  greyBatchCode: string // 白坯缸号编码
  items: DyeingOrderItem[] // 目标色号项目列表
  factoryId?: string // 加工厂ID
  factoryName: string // 加工厂名称
  factoryPhone?: string // 加工厂联系电话
  shipmentDate: string // 发货日期
  expectedCompletionDate: string // 预计完成日期
  actualCompletionDate?: string // 实际完成日期
  processingPrice: number // 加工单价 (元/kg)
  totalAmount: number // 总金额 (元)
  status: DyeingOrderStatus
  remark?: string // 备注
  operator: string // 经办人（创建人）
  createdAt: string
  updatedAt: string
}

// 染色加工单表单数据
export interface DyeingOrderFormData {
  productId: string
  productName: string
  greyBatchId: string
  greyBatchCode: string
  items: Omit<DyeingOrderItem, 'id'>[] // 目标色号项目列表（不包含ID，ID由系统生成）
  factoryId?: string
  factoryName: string
  factoryPhone?: string
  shipmentDate: string
  expectedCompletionDate: string
  processingPrice: number
  remark?: string
}
