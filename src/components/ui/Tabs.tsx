import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TabsProps {
  items: Array<{
    key: string
    label: string
  }>
  activeKey: string
  onChange: (key: string) => void
  className?: string
}

function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-2 border-t border-gray-200 pt-4', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors rounded-xl',
            'hover:text-gray-900',
            activeKey === item.key
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default Tabs



