import { useSettingsStore } from '@/store/settingsStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Settings, Palette, Save, Info } from 'lucide-react'
import { useState } from 'react'

function SystemParamsSettings() {
  const { systemParams, updateSystemParams } = useSettingsStore()
  const [localParams, setLocalParams] = useState<typeof systemParams>(systemParams)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    updateSystemParams(localParams)
    setTimeout(() => {
      setIsSaving(false)
      alert('参数设置已保存')
    }, 300)
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">参数设置</h1>
        <p className="text-sm text-gray-600">
          配置系统业务参数，控制功能模块的启用与禁用
        </p>
      </div>

      {/* 参数设置卡片 */}
      <Card className="p-6 border border-gray-200">
        <div className="space-y-6">
          {/* 染色加工流程 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              {/* 图标 */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>

              {/* 内容 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    染色加工流程
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localParams.enableDyeingProcess}
                      onChange={(e) =>
                        setLocalParams({
                          ...localParams,
                          enableDyeingProcess: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {localParams.enableDyeingProcess ? '已启用' : '已禁用'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  启用后，系统将支持染色加工业务，包括：
                </p>
                <ul className="space-y-1 text-sm text-gray-600 mb-4">
                  <li>• 商品管理中可以标记白坯纱线</li>
                  <li>• 侧边栏显示"染色加工"菜单</li>
                  <li>• 支持创建染色加工单</li>
                  <li>• 支持将白坯纱线分染成不同色号</li>
                </ul>
                {!localParams.enableDyeingProcess && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <div className="font-medium mb-1">提示：</div>
                        <div>
                          禁用染色加工流程后，商品管理中的"白坯纱线"选项将被隐藏，侧边栏的"染色加工"菜单也将隐藏。
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setLocalParams(systemParams)}
          className="px-6 py-2"
        >
          重置
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}

export default SystemParamsSettings

