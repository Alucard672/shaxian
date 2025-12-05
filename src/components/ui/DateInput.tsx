import { forwardRef } from 'react'
import DatePicker from './DatePicker'

interface DateInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
  className?: string
  error?: string
  label?: string
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <DatePicker {...props} error={error} />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'

export default DateInput



