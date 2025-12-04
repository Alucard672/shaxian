import { useState, ReactNode, useEffect, useRef } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  content: string | ReactNode
  className?: string
}

function Tooltip({ content, className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors',
          className
        )}
      >
        <Info className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 top-6 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="text-sm text-gray-700 leading-relaxed">
            {content}
          </div>
          {/* 小三角 */}
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45" />
        </div>
      )}
    </div>
  )
}

export default Tooltip

