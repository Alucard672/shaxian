import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
  [key: string]: any // 允许额外的属性
}

interface SelectWithAddProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  onAddNew?: (value: string) => Promise<void> | void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
  allowAdd?: boolean
  clearable?: boolean
  emptyText?: string
  addText?: string
}

export default function SelectWithAdd({
  value,
  onChange,
  options,
  onAddNew,
  placeholder = '请选择或输入',
  label,
  error,
  disabled = false,
  className,
  searchable = true,
  allowAdd = true,
  clearable = true,
  emptyText = '暂无选项',
  addText,
}: SelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isAdding, setIsAdding] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // 获取当前选中项的标签（统一转字符串匹配，避免 number/string 不一致显示 ID）
  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const displayValue = selectedOption ? String(selectedOption.label ?? '') : String(value ?? '')

  // 过滤选项（防御 opt.label/opt.value 非字符串）
  const filteredOptions = searchable && searchKeyword
    ? options.filter((opt) => {
        const kw = String(searchKeyword ?? '').toLowerCase()
        return (
          String(opt.label ?? '').toLowerCase().includes(kw) ||
          String(opt.value ?? '').toLowerCase().includes(kw)
        )
      })
    : options

  // 检查当前值是否是新项（不在选项中）
  const isNewValue = value && !options.find((opt) => String(opt.value) === String(value))

  // 处理选择
  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setSearchKeyword('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSearchKeyword(newValue)
    setIsOpen(true)
  }

  // 处理输入框聚焦
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true)
      setSearchKeyword(displayValue)
    }
  }

  // 处理输入框失焦
  const handleBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false)
        setSearchKeyword('')
        setHighlightedIndex(-1)
      }
    }, 200)
  }

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    const allOptions = allowAdd && isNewValue && value
      ? [{ value, label: value }, ...filteredOptions]
      : filteredOptions

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < allOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
          handleSelect(allOptions[highlightedIndex].value)
        } else if (value && isNewValue && allowAdd && onAddNew) {
          handleAddNew()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchKeyword('')
        setHighlightedIndex(-1)
        break
    }
  }

  // 处理添加新项
  const handleAddNew = async () => {
    if (!value || !value.trim() || !onAddNew) return

    setIsAdding(true)
    try {
      await onAddNew(value.trim())
      setIsOpen(false)
      setSearchKeyword('')
    } catch (error) {
      console.error('Failed to add new option:', error)
    } finally {
      setIsAdding(false)
    }
  }

  // 处理清除
  const handleClear = () => {
    onChange('')
    setSearchKeyword('')
    setIsOpen(false)
  }

  const DROPDOWN_MAX_HEIGHT = 192

  const updateDropdownPosition = () => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openDown = spaceBelow >= DROPDOWN_MAX_HEIGHT || spaceBelow >= spaceAbove
    setDropdownPosition({
      top: openDown ? rect.bottom + 4 : Math.max(8, rect.top - DROPDOWN_MAX_HEIGHT - 4),
      left: Math.min(Math.max(rect.left, 8), window.innerWidth - Math.max(rect.width, 200) - 8),
      width: Math.max(rect.width, 200),
    })
  }

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      updateDropdownPosition()
      const onScrollOrResize = () => updateDropdownPosition()
      window.addEventListener('scroll', onScrollOrResize, true)
      window.addEventListener('resize', onScrollOrResize)
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true)
        window.removeEventListener('resize', onScrollOrResize)
      }
    }
  }, [isOpen])

  // 点击外部关闭（弹窗已 Portal 到 body，需同时判断触发框和弹窗）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !isOpen ||
        !containerRef.current ||
        !dropdownRef.current
      ) return
      if (
        containerRef.current.contains(target) ||
        dropdownRef.current.contains(target)
      ) return
      setIsOpen(false)
      setSearchKeyword('')
      setHighlightedIndex(-1)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // 滚动到高亮项
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

  const allOptions = allowAdd && isNewValue && value
    ? [{ value, label: value }, ...filteredOptions]
    : filteredOptions

  return (
    <div ref={containerRef} className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {searchable && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={searchable && isOpen ? searchKeyword : displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isAdding}
          title={!isOpen && displayValue ? String(displayValue) : undefined}
          className={cn(
            'input-underline w-full py-2 text-sm appearance-none',
            error && 'input-underline-error',
            isOpen && 'input-underline-open',
            searchable && 'pl-10 pr-10',
            !searchable && 'px-0',
            'disabled:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed'
          )}
          style={{
            paddingRight: clearable && value && !disabled && !isAdding ? '1.75rem' : '0.75rem'
          }}
        />
        {clearable && value && !disabled && !isAdding && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        {!searchable && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}

        {/* 下拉选项：Portal 到 body，避免被下方组件遮挡 */}
        {typeof document !== 'undefined' &&
          isOpen &&
          !disabled &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed bg-white border border-gray-200 rounded-lg shadow-xl overflow-auto"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                minWidth: 200,
                maxHeight: DROPDOWN_MAX_HEIGHT,
                zIndex: 2147483647,
                position: 'fixed',
              }}
            >
              {allOptions.length === 0 && !value ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {emptyText}
                </div>
              ) : (
                <>
                  {allowAdd && isNewValue && value && onAddNew && (
                    <div
                      className={cn(
                        'px-4 py-2 text-sm cursor-pointer flex items-center justify-between',
                        highlightedIndex === 0
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                      onClick={handleAddNew}
                      onMouseEnter={() => setHighlightedIndex(0)}
                    >
                      <span className="flex items-center">
                        <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate" title={addText || `添加 "${value}"`}>
                          {addText || `添加 "${value}"`}
                        </span>
                      </span>
                      {isAdding && (
                        <span className="text-xs text-gray-400">添加中...</span>
                      )}
                    </div>
                  )}
                  {filteredOptions.map((option, index) => {
                    const actualIndex = allowAdd && isNewValue && value ? index + 1 : index
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          'px-4 py-2 text-sm cursor-pointer',
                          highlightedIndex === actualIndex
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50',
                          option.value === value && 'bg-blue-50'
                        )}
                        onClick={() => handleSelect(option.value)}
                        onMouseEnter={() => setHighlightedIndex(actualIndex)}
                      >
                        <span className="block truncate" title={option.label}>
                          {option.label}
                        </span>
                      </div>
                    )
                  })}
                  {filteredOptions.length === 0 && value && !isNewValue && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      未找到匹配的选项
                    </div>
                  )}
                </>
              )}
            </div>,
            document.body
          )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-500">{error}</p>
      )}
    </div>
  )
}
