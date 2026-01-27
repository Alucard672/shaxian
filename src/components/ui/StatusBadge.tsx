import { cn } from '@/utils/cn'

type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'default'

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
  children?: React.ReactNode
}

// 状态到颜色的映射
const statusColorMap: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-green-50', text: 'text-green-700' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  error: { bg: 'bg-red-50', text: 'text-red-700' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700' },
  pending: { bg: 'bg-orange-50', text: 'text-orange-700' },
  active: { bg: 'bg-green-50', text: 'text-green-700' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700' },
  default: { bg: 'bg-gray-50', text: 'text-gray-700' },
}

// 中文状态到英文的映射
const statusTextMap: Record<string, string> = {
  成功: 'success',
  警告: 'warning',
  错误: 'error',
  信息: 'info',
  待处理: 'pending',
  进行中: 'pending',
  已完成: 'success',
  已取消: 'error',
  正常: 'active',
  激活: 'active',
  停用: 'inactive',
  冻结: 'inactive',
  在售: 'active',
  停售: 'inactive',
  草稿: 'pending',
  已审核: 'success',
  已入库: 'success',
  已作废: 'error',
}

function StatusBadge({ status, className, children }: StatusBadgeProps) {
  // 将中文状态转换为英文key
  const statusKey = statusTextMap[status] || status.toLowerCase()
  
  // 获取颜色配置，如果不存在则使用default
  const colorConfig = statusColorMap[statusKey] || statusColorMap.default
  
  // 显示文本：优先使用children，否则使用status
  const displayText = children || status

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        colorConfig.bg,
        colorConfig.text,
        className
      )}
    >
      {displayText}
    </span>
  )
}

export default StatusBadge
