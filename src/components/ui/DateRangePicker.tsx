import { useState, useEffect, useRef } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addMonths,
  subMonths,
  addDays,
  subDays,
  isSameDay,
  isWithinInterval,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns'

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange?: (date: string) => void
  onEndDateChange?: (date: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  showQuickRanges?: boolean
}

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = '选择日期范围',
  className = '',
  inputClassName = '',
  showQuickRanges = true,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [baseMonth, setBaseMonth] = useState<Date>(() => new Date())

  const handleClear = () => {
    onStartDateChange?.('')
    onEndDateChange?.('')
  }

  const applyRange = (start: Date, end: Date) => {
    const s = format(start, 'yyyy-MM-dd')
    const e = format(end, 'yyyy-MM-dd')
    onStartDateChange?.(s)
    onEndDateChange?.(e)
  }

  const today = new Date()
  const customActive = !!startDate || !!endDate
  const selectedStart = startDate ? parseISO(startDate) : null
  const selectedEnd = endDate ? parseISO(endDate) : null

  const normalizeRange = (start: Date, end: Date) => {
    if (isAfter(start, end)) return [end, start]
    return [start, end]
  }

  const handleSelectDate = (date: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      applyRange(date, date)
      return
    }
    const [s, e] = normalizeRange(selectedStart, date)
    applyRange(s, e)
  }

  const isInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false
    return isWithinInterval(date, { start: selectedStart, end: selectedEnd })
  }

  const isRangeStart = (date: Date) => selectedStart && isSameDay(date, selectedStart)
  const isRangeEnd = (date: Date) => selectedEnd && isSameDay(date, selectedEnd)

  const buildMonthDays = (month: Date) => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const startWeek = startOfWeek(start, { weekStartsOn: 1 })
    const endWeek = endOfWeek(end, { weekStartsOn: 1 })
    const days: Date[] = []
    let d = startWeek
    while (d <= endWeek) {
      days.push(d)
      d = addDays(d, 1)
    }
    return { start, days }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowCustom(false)
      }
    }
    if (showCustom) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCustom])

  const leftMonth = baseMonth
  const rightMonth = addMonths(baseMonth, 1)
  const left = buildMonthDays(leftMonth)
  const right = buildMonthDays(rightMonth)
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-pointer whitespace-nowrap overflow-hidden ${inputClassName}`}
        onClick={() => {
          setBaseMonth(selectedStart ?? today)
          setShowCustom((prev) => !prev)
        }}
      >
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-900 truncate">{startDate || '开始日期'}</span>
        <span className="text-gray-500 text-sm flex-shrink-0">至</span>
        <span className="text-sm text-gray-900 truncate">{endDate || '结束日期'}</span>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            type="button"
            title="清空"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      {showCustom && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-[760px] max-w-[calc(100vw-24px)]">
          <div className="flex gap-4">
            {showQuickRanges && (
              <div className="flex flex-col gap-2 text-sm text-gray-700 w-[110px] border-r pr-3">
                <button type="button" onClick={() => applyRange(today, today)} className="text-left hover:text-blue-600">今天</button>
                <button type="button" onClick={() => applyRange(subDays(today, 1), subDays(today, 1))} className="text-left hover:text-blue-600">昨天</button>
                <button type="button" onClick={() => applyRange(startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }))} className="text-left hover:text-blue-600">本周</button>
                <button type="button" onClick={() => applyRange(startOfWeek(subDays(today, 7), { weekStartsOn: 1 }), endOfWeek(subDays(today, 7), { weekStartsOn: 1 }))} className="text-left hover:text-blue-600">上周</button>
                <button type="button" onClick={() => applyRange(startOfMonth(today), endOfMonth(today))} className="text-left hover:text-blue-600">本月</button>
                <button type="button" onClick={() => applyRange(startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1)))} className="text-left hover:text-blue-600">上月</button>
                <button type="button" onClick={() => applyRange(startOfYear(today), endOfYear(today))} className="text-left hover:text-blue-600">本年</button>
                <button type="button" onClick={() => applyRange(startOfYear(subMonths(today, 12)), endOfYear(subMonths(today, 12)))} className="text-left hover:text-blue-600">去年</button>
                <button type="button" onClick={() => applyRange(subDays(today, 6), today)} className="text-left hover:text-blue-600">近7天</button>
                <button type="button" onClick={() => applyRange(subDays(today, 13), today)} className="text-left hover:text-blue-600">近14天</button>
                <button type="button" onClick={() => applyRange(subDays(today, 29), today)} className="text-left hover:text-blue-600">近30天</button>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBaseMonth((m) => subMonths(m, 1))}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <div className="text-sm font-semibold text-gray-900">
                    {format(leftMonth, 'yyyy年 MM月')}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {format(rightMonth, 'yyyy年 MM月')}
                </div>
                <button
                  type="button"
                  onClick={() => setBaseMonth((m) => addMonths(m, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[left, right].map((monthData, idx) => (
                  <div key={idx}>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                      {weekDays.map((d) => (
                        <div key={d} className="py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 text-center text-sm">
                      {monthData.days.map((d, i) => {
                        const inMonth = d.getMonth() === monthData.start.getMonth()
                        const inRange = isInRange(d)
                        const isStart = isRangeStart(d)
                        const isEnd = isRangeEnd(d)
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectDate(d)}
                            className={`py-1.5 m-0.5 rounded ${
                              inMonth ? 'text-gray-900' : 'text-gray-300'
                            } ${inRange ? 'bg-orange-50' : ''} ${
                              isStart || isEnd ? 'bg-orange-500 text-white' : ''
                            }`}
                          >
                            {format(d, 'd')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
