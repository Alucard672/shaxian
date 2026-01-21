import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { pinyin } from 'pinyin-pro'
import { useManufacturerStore } from '@/store/manufacturerStore'
import { cn } from '@/utils/cn'

interface ManufacturerSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function ManufacturerSelect({
  value,
  onChange,
  placeholder = '请输入或选择厂家',
  className,
  disabled = false,
}: ManufacturerSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { manufacturers, addManufacturer, searchManufacturers } = useManufacturerStore()

  // 获取拼音首字母和全拼
  const getPinyin = (text: string) => {
    try {
      const firstLetters = pinyin(text, { pattern: 'first', toneType: 'none' })
      const fullPinyin = pinyin(text, { pattern: 'pinyin', toneType: 'none', separator: '' })
      return {
        firstLetters: firstLetters.toLowerCase(),
        fullPinyin: fullPinyin.toLowerCase(),
        original: text.toLowerCase(),
      }
    } catch {
      return {
        firstLetters: text.toLowerCase(),
        fullPinyin: text.toLowerCase(),
        original: text.toLowerCase(),
      }
    }
  }

  // 搜索厂家（支持中文、拼音首字母、全拼）
  const filteredManufacturers = searchKeyword
    ? manufacturers.filter((name) => {
        const pinyinData = getPinyin(name)
        const keyword = searchKeyword.toLowerCase()
        return (
          pinyinData.original.includes(keyword) ||
          pinyinData.firstLetters.includes(keyword) ||
          pinyinData.firstLetters.startsWith(keyword) ||
          pinyinData.fullPinyin.includes(keyword) ||
          pinyinData.fullPinyin.startsWith(keyword)
        )
      })
    : manufacturers

  // 检查当前输入值是否在列表中
  const isNewManufacturer = value && !manufacturers.includes(value)

  // 处理选择厂家
  const handleSelect = (manufacturer: string) => {
    onChange(manufacturer)
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
    setIsOpen(true)
    setSearchKeyword(value)
  }

  // 处理输入框失焦
  const handleBlur = (e: React.FocusEvent) => {
    // 延迟关闭，以便点击选项时能触发
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
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    const options = isNewManufacturer && value
      ? [value, ...filteredManufacturers]
      : filteredManufacturers

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex])
        } else if (value && isNewManufacturer) {
          // 如果输入了新值，添加并选择
          addManufacturer(value)
          setIsOpen(false)
          setSearchKeyword('')
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

  // 处理添加新厂家
  const handleAddNew = () => {
    if (value && value.trim()) {
      addManufacturer(value.trim())
      setIsOpen(false)
      setSearchKeyword('')
    }
  }

  // 处理清除
  const handleClear = () => {
    onChange('')
    setSearchKeyword('')
    setIsOpen(false)
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchKeyword('')
        setHighlightedIndex(-1)
      }
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

  const options = isNewManufacturer && value
    ? [value, ...filteredManufacturers]
    : filteredManufacturers

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-20 py-2 border border-gray-200 rounded-xl text-sm',
            'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
            isOpen && 'border-blue-500'
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 下拉选项 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
        >
          {options.length === 0 && !value ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              暂无厂家，输入名称后按回车添加
            </div>
          ) : (
            <>
              {/* 新厂家提示 */}
              {isNewManufacturer && value && (
                <div
                  className={cn(
                    'px-4 py-2 text-sm cursor-pointer flex items-center justify-between',
                    highlightedIndex === 0
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => {
                    handleAddNew()
                    handleSelect(value)
                  }}
                  onMouseEnter={() => setHighlightedIndex(0)}
                >
                  <span>
                    <Plus className="w-4 h-4 inline mr-2" />
                    添加 "{value}"
                  </span>
                </div>
              )}

              {/* 厂家列表 */}
              {filteredManufacturers.map((manufacturer, index) => {
                const actualIndex = isNewManufacturer && value ? index + 1 : index
                return (
                  <div
                    key={manufacturer}
                    className={cn(
                      'px-4 py-2 text-sm cursor-pointer',
                      highlightedIndex === actualIndex
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    onClick={() => handleSelect(manufacturer)}
                    onMouseEnter={() => setHighlightedIndex(actualIndex)}
                  >
                    {manufacturer}
                  </div>
                )
              })}

              {/* 空状态 */}
              {filteredManufacturers.length === 0 && value && !isNewManufacturer && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  未找到匹配的厂家
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}


