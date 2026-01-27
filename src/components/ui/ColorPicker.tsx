import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Palette, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import Input from './Input'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
  disabled?: boolean
}

export default function ColorPicker({
  value,
  onChange,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const panelH = 120
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const anchorBelow = spaceBelow >= panelH || spaceBelow >= spaceAbove
    setPosition({
      left: Math.min(Math.max(rect.left, 8), window.innerWidth - 320 - 8),
      top: anchorBelow ? rect.bottom + 6 : rect.top - panelH - 6,
    })
  }

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      updatePosition()
      const onScrollOrResize = () => updatePosition()
      window.addEventListener('scroll', onScrollOrResize, true)
      window.addEventListener('resize', onScrollOrResize)
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true)
        window.removeEventListener('resize', onScrollOrResize)
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const popover = isOpen && (
    <div
      ref={panelRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl p-4"
      style={{
        left: position.left,
        top: position.top,
        width: 280,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-800">调色盘</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex-shrink-0 cursor-pointer">
          <input
            type="color"
            value={value || '#E5E7EB'}
            onChange={(e) => onChange(e.target.value)}
            className="w-14 h-14 rounded-lg border border-gray-200 cursor-pointer block"
            title="点击打开颜色选取器"
          />
        </label>
        <div className="flex-1 min-w-0 space-y-2">
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => {
              const val = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') onChange(val)
            }}
            placeholder="输入 #hex 或留空"
            className="text-sm"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清除
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">点击色块打开系统颜色选取器</p>
    </div>
  )

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 border rounded-xl',
            'bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed border-gray-200',
            isOpen && 'ring-2 ring-blue-500'
          )}
        >
          {value ? (
            <>
              <div
                className="w-6 h-6 rounded border border-gray-300 shrink-0"
                style={{ backgroundColor: value }}
              />
              <span className="text-sm text-gray-700 truncate max-w-[120px]">{value}</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded border-2 border-dashed border-gray-300 bg-gray-50 shrink-0" />
              <span className="text-sm text-gray-500">未选择</span>
            </>
          )}
          <Palette className="w-4 h-4 text-gray-500 shrink-0" />
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
      {typeof document !== 'undefined' && createPortal(popover, document.body)}
    </div>
  )
}
