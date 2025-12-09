import { useState } from 'react'
import DatePicker from './DatePicker'
import { Calendar, X } from 'lucide-react'

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onStartDateChange?: (date: string) => void
  onEndDateChange?: (date: string) => void
  placeholder?: string
  className?: string
}

function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = '选择日期范围',
  className = '',
}: DateRangePickerProps) {
  const handleClear = () => {
    onStartDateChange?.('')
    onEndDateChange?.('')
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        placeholder="开始日期"
        maxDate={endDate}
        className="flex-1 max-w-[140px]"
      />
      <span className="text-gray-500 text-sm">至</span>
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        placeholder="结束日期"
        minDate={startDate}
        className="flex-1 max-w-[140px]"
      />
      {(startDate || endDate) && (
        <button
          onClick={handleClear}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          type="button"
          title="清空"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}

export default DateRangePicker




