import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TableColumn<T> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

interface ModernTableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  className?: string
  rowKey?: (record: T, index: number) => string
  onRowClick?: (record: T, index: number) => void
  emptyText?: string
}

function ModernTable<T extends Record<string, any>>({
  columns,
  data,
  className,
  rowKey,
  onRowClick,
  emptyText = '暂无数据',
}: ModernTableProps<T>) {
  const getRowKey = (record: T, index: number) => {
    if (rowKey) return rowKey(record, index)
    return String(record.id || index)
  }

  return (
    <div className={cn('overflow-x-auto bg-white rounded-lg', className)}>
      <table className="w-full border-collapse min-w-full">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  !column.align && 'text-left'
                )}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-gray-400"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => {
                  const value = column.dataIndex
                    ? record[column.dataIndex]
                    : null
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-600',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        !column.align && 'text-left'
                      )}
                    >
                      {column.render
                        ? column.render(value, record, index)
                        : value}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ModernTable
