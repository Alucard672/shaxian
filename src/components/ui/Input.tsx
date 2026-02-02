import { InputHTMLAttributes, forwardRef, useState, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** 聚焦时若当前为 0 则清空，便于直接输入；失焦或输入后恢复显示 */
  clearZeroOnFocus?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, clearZeroOnFocus, onFocus, onBlur, onChange, value, type, disabled, readOnly, ...props }, ref) => {
    const [clearedZero, setClearedZero] = useState(false)
    const isNum = type === 'number'
    const useClearZero = clearZeroOnFocus ?? (isNum ? true : false)
    const shouldClear = Boolean(!disabled && !readOnly && useClearZero && isNum && (Number(value) === 0 || value === ''))
    const displayValue = clearedZero && shouldClear ? '' : value

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (!disabled && !readOnly && useClearZero && type === 'number' && (Number(value) === 0 || value === ''))
          setClearedZero(true)
        onFocus?.(e)
      },
      [disabled, readOnly, useClearZero, type, value, onFocus]
    )
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setClearedZero(false)
        onBlur?.(e)
      },
      [onBlur]
    )
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setClearedZero(false)
        onChange?.(e)
      },
      [onChange]
    )

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          value={displayValue}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            'input-underline w-full px-0 py-2 h-[38px] text-sm',
            error && 'input-underline-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

