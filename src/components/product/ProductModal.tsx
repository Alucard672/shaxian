import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '../ui/Button'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function ProductModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ProductModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-[1152px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-600">填写商品基础信息，可选添加色号和缸号</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default ProductModal






