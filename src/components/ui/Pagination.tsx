import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'
import { cn } from '@/utils/cn'

interface PaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  showTotal?: boolean
  totalText?: string
}

function Pagination({
  current,
  total,
  pageSize,
  onChange,
  showTotal = true,
  totalText,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex items-center justify-between">
      {showTotal && (
        <div className="text-sm text-gray-600">
          {totalText || `共${total}个商品`}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                page === current
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {page}
            </button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination

