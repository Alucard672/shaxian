import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface BaseCardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

function BaseCard({ children, className, padding = 'md' }: BaseCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

export default BaseCard
