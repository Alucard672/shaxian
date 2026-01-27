import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import type { PageFieldOption } from '@/types/settings'
import Button from '@/components/ui/Button'
import { X, LayoutList } from 'lucide-react'

export interface VisibleColumnsConfigModalProps {
  open: boolean
  onClose: () => void
  docKey: string
  title: string
  /** 可配置的列：id = column key */
  columns: PageFieldOption[]
  /** 全部列 key（未配置时使用） */
  defaultVisible: string[]
}

export default function VisibleColumnsConfigModal({
  open,
  onClose,
  docKey,
  title,
  columns,
  defaultVisible,
}: VisibleColumnsConfigModalProps) {
  const { getDocumentVisibleColumns, setDocumentVisibleColumns } = useSettingsStore()
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setSelected(getDocumentVisibleColumns(docKey, defaultVisible))
    }
  }, [open, docKey, defaultVisible, getDocumentVisibleColumns])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSave = () => {
    setDocumentVisibleColumns(docKey, selected)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900">{title} - 自定义列显示</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">
            勾选要在列表中显示的列，操作列始终显示
          </p>
          {columns.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{c.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
