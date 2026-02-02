import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, X, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string
  label: string
  [key: string]: any
}

interface MultiSelectWithAddProps {
  value: string[]
  onChange: (value: string[]) => void
  options: SelectOption[]
  onAddNew?: (value: string) => Promise<void> | void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
  allowAdd?: boolean
  emptyText?: string
  addText?: string
}

export default function MultiSelectWithAdd({
  value = [],
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
  emptyText = '暂无选项',
  addText,
}: MultiSelectWithAddProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isAdding, setIsAdding] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  // 获取已选中项的标签
  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  const displayText = selectedOptions.length > 0
    ? selectedOptions.map((opt) => opt.label).join(', ')
    : ''

  // 过滤选项
  const filteredOptions = searchable && searchKeyword
    ? options.filter((opt) =>
        String(opt.label ?? '').toLowerCase().includes(String(searchKeyword ?? '').toLowerCase()) ||
        String(opt.value ?? '').toLowerCase().includes(String(searchKeyword ?? '').toLowerCase())
      )
    : options

  // 检查当前搜索值是否是新项（不在选项中）
  const isNewValue = searchKeyword && !options.find((opt) => 
    String(opt.label ?? '').toLowerCase() === String(searchKeyword ?? '').toLowerCase() ||
    String(opt.value ?? '').toLowerCase() === String(searchKeyword ?? '').toLowerCase()
  )

  // 处理选择/取消选择
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
    setSearchKeyword('')
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchKeyword(newValue)
    setIsOpen(true)
  }

  // 处理输入框聚焦
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true)
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

    const allOptions = allowAdd && isNewValue && searchKeyword
      ? [{ value: searchKeyword, label: searchKeyword }, ...filteredOptions]
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
          handleToggle(allOptions[highlightedIndex].value)
        } else if (searchKeyword && isNewValue && allowAdd && onAddNew) {
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
    if (!searchKeyword || !searchKeyword.trim() || !onAddNew) return

    setIsAdding(true)
    try {
      await onAddNew(searchKeyword.trim())
      setSearchKeyword('')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to add new option:', error)
    } finally {
      setIsAdding(false)
    }
  }

  // 处理清除单个选中项
  const handleRemoveSelected = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue))
  }

  // 处理清除所有
  const handleClear = () => {
    onChange([])
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
      if (!isOpen || !containerRef.current || !dropdownRef.current) return
      if (containerRef.current.contains(target) || dropdownRef.current.contains(target)) return
      setIsOpen(false)
      setSearchKeyword('')
      setHighlightedIndex(-1)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const allOptions = allowAdd && isNewValue && searchKeyword
    ? [{ value: searchKeyword, label: searchKeyword }, ...filteredOptions]
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
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            <Search className="w-4 h-4" />
          </div>
        )}
        <div className="relative">
          {/* 已选标签显示区域 */}
          {selectedOptions.length > 0 && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide max-w-[calc(100%-64px)]">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 whitespace-nowrap"
                >
                  <span className="truncate max-w-[80px]">{opt.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveSelected(opt.value)
                    }}
                    className="hover:bg-blue-100 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={searchKeyword}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={selectedOptions.length > 0 ? '' : placeholder}
            disabled={disabled || isAdding}
            className={cn(
              'input-underline w-full py-2 text-sm appearance-none',
              error && 'input-underline-error',
              isOpen && 'input-underline-open',
              searchable && 'pl-10 pr-16',
              !searchable && 'px-0',
              selectedOptions.length > 0 && 'pl-2',
              'disabled:bg-transparent disabled:opacity-60 disabled:cursor-not-allowed'
            )}
            style={{
              paddingLeft: selectedOptions.length > 0 
                ? `${Math.min(selectedOptions.length * 100, 200)}px` 
                : searchable ? '2.5rem' : '0.75rem'
            }}
          />
        </div>
        {value.length > 0 && !disabled && !isAdding && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded z-10"
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
              {allOptions.length === 0 && !searchKeyword ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  {emptyText}
                </div>
              ) : (
                <>
                  {allowAdd && isNewValue && searchKeyword && onAddNew && (
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
                        <span className="truncate" title={addText || `添加 "${searchKeyword}"`}>
                          {addText || `添加 "${searchKeyword}"`}
                        </span>
                      </span>
                      {isAdding && (
                        <span className="text-xs text-gray-400">添加中...</span>
                      )}
                    </div>
                  )}
                  {filteredOptions.map((option, index) => {
                    const actualIndex = allowAdd && isNewValue && searchKeyword ? index + 1 : index
                    const isSelected = value.includes(option.value)
                    return (
                      <div
                        key={option.value}
                        className={cn(
                          'px-4 py-2 text-sm cursor-pointer flex items-center justify-between',
                          highlightedIndex === actualIndex
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50',
                          isSelected && 'bg-blue-50'
                        )}
                        onClick={() => handleToggle(option.value)}
                        onMouseEnter={() => setHighlightedIndex(actualIndex)}
                      >
                        <span className="flex items-center flex-1 min-w-0">
                          {isSelected && (
                            <Check className="w-4 h-4 mr-2 flex-shrink-0 text-blue-600" />
                          )}
                          <span className="block truncate" title={option.label}>
                            {option.label}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                  {filteredOptions.length === 0 && searchKeyword && !isNewValue && (
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
