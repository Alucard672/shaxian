// 单位信息
export interface Unit {
  id: string
  name: string // 单位名称（如：kg、g、打、支）
  code?: string // 单位编码
  category?: string // 单位分类（如：重量、长度、数量）
  remark?: string // 备注
  sortOrder?: number // 排序顺序
  isEnabled: boolean // 是否启用
  createdAt: string
  updatedAt: string
}



