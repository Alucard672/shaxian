import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const variants = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
      icon: AlertTriangle,
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-700',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-700',
      icon: Info,
    },
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border-l-4',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.text)} />
        <div className="flex-1">
          {title && (
            <h4 className={cn('text-sm font-medium mb-1', config.text)}>
              {title}
            </h4>
          )}
          <div className={cn('text-sm', config.text)}>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'ml-auto flex-shrink-0 hover:opacity-70 transition-opacity',
              config.text
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert

