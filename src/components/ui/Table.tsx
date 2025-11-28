import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TableColumn<T> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => ReactNode
  width?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  className?: string
  rowKey?: (record: T, index: number) => string
  onRowClick?: (record: T, index: number) => void
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  className,
  rowKey,
  onRowClick,
}: TableProps<T>) {
  const getRowKey = (record: T, index: number) => {
    if (rowKey) return rowKey(record, index)
    return String(record.id || index)
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200"
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                暂无数据
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={cn(
                  'border-b border-gray-200 hover:bg-gray-50 transition-colors',
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
                      className="px-4 py-3 text-sm text-gray-700"
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

export default Table

