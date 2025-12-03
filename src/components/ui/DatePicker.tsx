import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, getDate } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DatePickerProps {
  value?: string // YYYY-MM-DD格式
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minDate?: string // YYYY-MM-DD格式
  maxDate?: string // YYYY-MM-DD格式
  className?: string
  error?: string
}

function DatePicker({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  minDate,
  maxDate,
  className = '',
  error,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    return value ? new Date(value) : new Date()
  })
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedDate = value ? new Date(value) : null
  const min = minDate ? new Date(minDate) : null
  const max = maxDate ? new Date(maxDate) : null

  // 生成日历网格
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // 获取当月第一天是星期几（0=周日，6=周六）
  const firstDayOfWeek = monthStart.getDay()
  // 获取当月最后一天是星期几
  const lastDayOfWeek = monthEnd.getDay()
  
  // 添加前面的空白格子
  const daysBefore = Array.from({ length: firstDayOfWeek }, (_, i) => null)
  // 添加后面的空白格子
  const daysAfter = Array.from({ length: 6 - lastDayOfWeek }, (_, i) => null)
  
  const allDays = [...daysBefore, ...daysInMonth, ...daysAfter]

  // 切换月份
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // 选择日期
  const handleSelectDate = (date: Date) => {
    if (min && date < min) return
    if (max && date > max) return
    
    const dateStr = format(date, 'yyyy-MM-dd')
    onChange?.(dateStr)
    setIsOpen(false)
  }

  // 选择今天
  const handleSelectToday = () => {
    const today = new Date()
    if (min && today < min) return
    if (max && today > max) return
    
    const dateStr = format(today, 'yyyy-MM-dd')
    onChange?.(dateStr)
    setIsOpen(false)
  }

  // 清空
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  // 判断日期是否可选
  const isDateDisabled = (date: Date) => {
    if (min && date < min) return true
    if (max && date > max) return true
    return false
  }

  // 判断是否是今天
  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  // 判断是否是选中日期
  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate)
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative flex items-center w-full px-3 py-2 h-9 border rounded-xl text-sm
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'}
          ${error ? 'border-red-500' : 'border-gray-200'}
          ${!disabled && 'hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}
        `}
      >
        <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <span className={`flex-1 ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value ? format(new Date(value), 'yyyy-MM-dd') : placeholder}
        </span>
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded"
            type="button"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[320px]">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-base font-semibold text-gray-900">
              {getYear(currentMonth)}年 {monthNames[getMonth(currentMonth)]}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 gap-1">
            {allDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const disabled = isDateDisabled(date)
              const today = isToday(date)
              const selected = isSelected(date)

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !disabled && handleSelectDate(date)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded-lg text-sm transition-colors
                    ${disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : today && !selected
                      ? 'text-primary-600 font-medium border-2 border-primary-600 hover:bg-primary-50'
                      : selected
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  type="button"
                >
                  {getDate(date)}
                </button>
              )
            })}
          </div>

          {/* 今天按钮 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSelectToday}
              className="w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              type="button"
            >
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker

