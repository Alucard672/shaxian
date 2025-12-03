import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string | ReactNode
  actions?: ReactNode
}

function Card({ children, className, title, actions }: CardProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm p-6', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            typeof title === 'string' 
              ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              : <div className="w-full">{title}</div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card

