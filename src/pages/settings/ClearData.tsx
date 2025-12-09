import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { clearAllStorage, clearModuleStorage } from '@/utils/clearStorage'

function ClearData() {
  const navigate = useNavigate()
  const [isClearing, setIsClearing] = useState(false)

  const handleClearAll = () => {
    if (!confirm('确定要清空所有数据吗？此操作不可逆！')) {
      return
    }

    setIsClearing(true)
    try {
      clearAllStorage()
      alert('所有数据已清空！请刷新页面。')
      // 刷新页面以重新加载空数据
      window.location.reload()
    } catch (error) {
      console.error('清空数据失败:', error)
      alert('清空数据失败，请查看控制台')
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearModule = (module: string, moduleName: string) => {
    if (!confirm(`确定要清空${moduleName}的数据吗？此操作不可逆！`)) {
      return
    }

    try {
      clearModuleStorage(module)
      alert(`${moduleName}数据已清空！请刷新页面。`)
      window.location.reload()
    } catch (error) {
      console.error('清空数据失败:', error)
      alert('清空数据失败，请查看控制台')
    }
  }

  const modules = [
    { key: 'product', name: '商品管理' },
    { key: 'contact', name: '往来单位' },
    { key: 'purchase', name: '进货管理' },
    { key: 'sales', name: '销售管理' },
    { key: 'dyeing', name: '染色加工' },
    { key: 'account', name: '账款管理' },
    { key: 'inventory', name: '库存管理' },
    { key: 'template', name: '打印模板' },
    { key: 'settings', name: '系统设置' },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">清空数据</h1>
          <p className="text-sm text-gray-600 mt-1">清空系统中的测试数据，用于重新开始测试</p>
        </div>
      </div>

      {/* 警告提示 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-900 mb-1">警告</h3>
          <p className="text-sm text-red-700">
            清空数据操作不可逆！清空后所有业务数据将被删除，但教程数据会保留。
          </p>
        </div>
      </div>

      {/* 清空所有数据 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">清空所有数据</h2>
            <p className="text-sm text-gray-600">清空系统中所有业务数据</p>
          </div>
          <Button
            onClick={handleClearAll}
            disabled={isClearing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? '清空中...' : '清空所有数据'}
          </Button>
        </div>
      </div>

      {/* 按模块清空 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">按模块清空</h2>
        <div className="grid grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{module.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearModule(module.key, module.name)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                清空
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClearData




