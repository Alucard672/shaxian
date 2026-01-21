import { useState, useRef, useEffect } from 'react'
import { Palette, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Input from './Input'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
  disabled?: boolean
}

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080',
  '#FFD700', '#C0C0C0', '#FF6347', '#40E0D0', '#EE82EE',
]

export default function ColorPicker({
  value,
  onChange,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleColorSelect = (color: string) => {
    onChange(color)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl',
            'bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isOpen && 'ring-2 ring-blue-500'
          )}
        >
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: value || '#000000' }}
          />
          <span className="text-sm text-gray-700">{value || '#000000'}</span>
          <Palette className="w-4 h-4 text-gray-500" />
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 颜色选择面板 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择颜色
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-12 border border-gray-200 rounded-lg cursor-pointer"
              />
              <Input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                    onChange(val)
                  }
                }}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预设颜色
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    'w-8 h-8 rounded border-2 transition-all',
                    value === color
                      ? 'border-blue-500 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

