import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { MapPin, Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

function InventoryLocationSettings() {
  const navigate = useNavigate()
  const { systemParams, updateSystemParams } = useSettingsStore()
  const [list, setList] = useState<string[]>([])
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const enabled = !!systemParams?.enableStockLocation
  const defaultLoc = systemParams?.defaultStockLocation ?? '默认仓位'

  const ensureDefault = (locations: string[]) => {
    if (!defaultLoc) return locations
    return locations.includes(defaultLoc) ? locations : [defaultLoc, ...locations]
  }

  useEffect(() => {
    const raw = systemParams?.stockLocations
    const arr = Array.isArray(raw) ? raw : []
    setList(ensureDefault(arr.length ? arr : defaultLoc ? [defaultLoc] : []))
  }, [systemParams?.stockLocations, defaultLoc])

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    if (list.includes(name)) {
      alert('该仓位已存在')
      return
    }
    setList(ensureDefault([...list, name]))
    setNewName('')
  }

  const handleRemove = (name: string) => {
    if (name === defaultLoc) {
      alert('默认仓位不能删除')
      return
    }
    setList((prev) => prev.filter((x) => x !== name))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSystemParams({
        stockLocations: ensureDefault(list),
      })
      alert('仓位设置已保存')
    } finally {
      setIsSaving(false)
    }
  }

  if (!enabled) {
    return (
      <div className="p-8">
        <p className="text-gray-600">请在「系统设置 → 参数设置」中启用仓位管理后，再使用仓位设置。</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/inventory')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回库存管理
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">仓位设置</h1>
            <p className="text-sm text-gray-600 mt-1">管理仓位列表，进货、批次、染色入库时可选择仓位</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>

      <Card className="p-6 border border-gray-200 rounded-xl">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-4">
          <MapPin className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-gray-900">仓位列表</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          默认仓位「{defaultLoc}」不可删除；新建仓位后需保存生效。
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {list.map((name) => (
            <div
              key={name}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
            >
              <span className="font-medium text-gray-900">{name}</span>
              {name === defaultLoc && (
                <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">默认</span>
              )}
              {name !== defaultLoc && (
                <button
                  type="button"
                  onClick={() => handleRemove(name)}
                  className="p-0.5 hover:bg-red-100 rounded text-red-600"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder="输入新仓位名称"
            className="flex-1 max-w-xs"
          />
          <Button onClick={handleAdd} className="rounded-lg" disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            新建
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default InventoryLocationSettings
