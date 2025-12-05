import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { AlertTriangle, Save, ArrowLeft } from 'lucide-react'

function InventoryAlertSettings() {
  const navigate = useNavigate()
  const { inventoryAlertSettings, updateInventoryAlertSettings } = useSettingsStore()
  const [localSettings, setLocalSettings] = useState(inventoryAlertSettings)

  useEffect(() => {
    setLocalSettings(inventoryAlertSettings)
  }, [inventoryAlertSettings])

  const handleSave = () => {
    updateInventoryAlertSettings(localSettings)
    alert('库存预警设置已保存！')
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题和保存按钮 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">库存预警设置</h1>
            <p className="text-sm text-gray-600 mt-1">配置库存预警规则，及时提醒库存不足</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>

      {/* 预警设置表单 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">预警规则</h2>
        </div>

        {/* 启用预警 */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-base font-medium text-gray-900">启用库存预警</div>
              <div className="text-sm text-gray-600">开启后，系统将在库存低于阈值时自动提醒</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.enabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, enabled: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
          </label>
        </div>

        {/* 预警阈值 */}
        {localSettings.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预警阈值（百分比）
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={localSettings.threshold || 10}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      threshold: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="请输入预警阈值"
                  className="w-32"
                  min="0"
                  max="100"
                />
                <span className="text-sm text-gray-600">%</span>
                <span className="text-xs text-gray-500">
                  当库存低于该百分比时触发预警（例如：10% 表示库存低于初始库存的10%时预警）
                </span>
              </div>
            </div>

            {/* 自动预警 */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-base font-medium text-gray-900">自动预警</div>
                  <div className="text-sm text-gray-600">
                    开启后，系统将自动在库存不足时发送预警通知
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.autoAlert}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, autoAlert: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {!localSettings.enabled && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              库存预警功能已关闭。开启后可以设置预警阈值和自动预警功能。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryAlertSettings



