import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
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
  const wheelRef = useRef<HTMLCanvasElement>(null)

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

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

  const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '').trim()
    if (normalized.length !== 6) return null
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
    return { r, g, b }
  }

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase()

  const rgbToHsv = (r: number, g: number, b: number) => {
    const rn = r / 255
    const gn = g / 255
    const bn = b / 255
    const max = Math.max(rn, gn, bn)
    const min = Math.min(rn, gn, bn)
    const delta = max - min
    let h = 0
    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6
      else if (max === gn) h = (bn - rn) / delta + 2
      else h = (rn - gn) / delta + 4
      h *= 60
      if (h < 0) h += 360
    }
    const s = max === 0 ? 0 : delta / max
    const v = max
    return { h, s, v }
  }

  const hsvToRgb = (h: number, s: number, v: number) => {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    let r = 0
    let g = 0
    let b = 0
    if (h >= 0 && h < 60) [r, g, b] = [c, x, 0]
    else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0]
    else if (h >= 120 && h < 180) [r, g, b] = [0, c, x]
    else if (h >= 180 && h < 240) [r, g, b] = [0, x, c]
    else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    }
  }

  const hsvToHex = (h: number, s: number, v: number) => {
    const { r, g, b } = hsvToRgb(h, s, v)
    return rgbToHex(r, g, b)
  }

  const hsv = useMemo(() => {
    const rgb = value ? hexToRgb(value) : null
    if (!rgb) return { h: 0, s: 0, v: 1 }
    return rgbToHsv(rgb.r, rgb.g, rgb.b)
  }, [value])

  const wheelSize = 180
  const wheelRadius = wheelSize / 2

  const drawWheel = () => {
    const canvas = wheelRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(wheelSize, wheelSize)
    const data = image.data
    for (let y = 0; y < wheelSize; y++) {
      for (let x = 0; x < wheelSize; x++) {
        const dx = x - wheelRadius
        const dy = y - wheelRadius
        const dist = Math.sqrt(dx * dx + dy * dy)
        const idx = (y * wheelSize + x) * 4
        if (dist > wheelRadius) {
          data[idx + 3] = 0
          continue
        }
        const h = (Math.atan2(dy, dx) * 180) / Math.PI + 180
        const s = clamp(dist / wheelRadius, 0, 1)
        const { r, g, b } = hsvToRgb(h, s, 1)
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      updatePosition()
      drawWheel()
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

  const markerStyle = useMemo(() => {
    const angle = ((hsv.h - 180) * Math.PI) / 180
    const r = hsv.s * wheelRadius
    const x = wheelRadius + Math.cos(angle) * r
    const y = wheelRadius + Math.sin(angle) * r
    return {
      left: x,
      top: y,
    }
  }, [hsv.h, hsv.s, wheelRadius])

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
        <span className="text-sm font-medium text-gray-800">色轮</span>
      </div>
      <div className="relative mb-3" style={{ width: wheelSize, height: wheelSize }}>
        <canvas
          ref={wheelRef}
          width={wheelSize}
          height={wheelSize}
          className="block rounded-full"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const dx = x - wheelRadius
            const dy = y - wheelRadius
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > wheelRadius) return
            const h = (Math.atan2(dy, dx) * 180) / Math.PI + 180
            const s = clamp(dist / wheelRadius, 0, 1)
            const next = hsvToHex(h, s, 1)
            onChange(next)
          }}
        />
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow"
          style={{
            left: markerStyle.left - 6,
            top: markerStyle.top - 6,
            backgroundColor: value || '#FFFFFF',
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-200"
          style={{ backgroundColor: value || '#F3F4F6' }}
        />
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
