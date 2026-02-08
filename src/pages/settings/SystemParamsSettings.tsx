import { useSettingsStore } from '@/store/settingsStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tooltip from '../../components/ui/Tooltip'
import { Settings, Palette, Save, Package, MapPin, Layers } from 'lucide-react'
import { useState, useEffect } from 'react'

function SystemParamsSettings() {
  const { systemParams, updateSystemParams } = useSettingsStore()
  const [localParams, setLocalParams] = useState<typeof systemParams>(systemParams)

  useEffect(() => {
    setLocalParams(systemParams)
  }, [systemParams])
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSystemParams(localParams)
      alert('参数设置已保存')
    } catch (e: any) {
      alert('保存失败：' + (e?.message || '未知错误'))
    } finally {
      setIsSaving(false)
    }
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      染色加工流程
                    </h3>
                    {!localParams.enableDyeingProcess && (
                      <Tooltip
                        content={
                          <div>
                            <div className="font-medium mb-1">提示：</div>
                            <div>
                              禁用染色加工流程后，商品管理中的"白坯纱线"选项将被隐藏，侧边栏的"染色加工"菜单也将隐藏。
                            </div>
                          </div>
                        }
                      />
                    )}
                  </div>
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
              </div>
            </div>
          </div>

          {/* 商品类型 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">商品类型</h3>
                <p className="text-sm text-gray-600 mb-3">
                  选择以纱线或面料为主：纱线显示支数等属性，面料显示幅宽、克重等属性。
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="productType"
                      checked={(localParams.productType || '纱线') === '纱线'}
                      onChange={() => setLocalParams({ ...localParams, productType: '纱线' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm font-medium text-gray-700">纱线</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="productType"
                      checked={(localParams.productType || '纱线') === '面料'}
                      onChange={() => setLocalParams({ ...localParams, productType: '面料' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm font-medium text-gray-700">面料</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 缸号管理 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">缸号</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!localParams.enableBatch}
                      onChange={(e) =>
                        setLocalParams({
                          ...localParams,
                          enableBatch: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {localParams.enableBatch ? '已启用' : '已禁用'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  {localParams.enableBatch
                    ? '启用后，销售单、进货单、库存等需选择缸号，适用于按缸号精细管理库存的场景。'
                    : '关闭时，销售/进货不显示缸号，系统自动使用色号下首个缸号；适用于简化流程、大部分人用不到缸号的场景。'}
                </p>
              </div>
            </div>
          </div>

          {/* 仓位管理 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">仓位管理</h3>
                    {!localParams.enableStockLocation && (
                      <Tooltip
                        content={
                          <div>
                            <div className="font-medium mb-1">提示：</div>
                            <div>关闭时，库存统一入库到默认仓位，相关页面不显示仓位；启用后可在库存管理中配置仓位列表。</div>
                          </div>
                        }
                      />
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!localParams.enableStockLocation}
                      onChange={(e) => {
                        const enabled = e.target.checked
                        setLocalParams({
                          ...localParams,
                          enableStockLocation: enabled,
                          stockLocations: enabled
                            ? (localParams.stockLocations?.length ? localParams.stockLocations : [localParams.defaultStockLocation || '默认仓位'])
                            : localParams.stockLocations,
                        })
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {localParams.enableStockLocation ? '已启用' : '已禁用'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {localParams.enableStockLocation
                    ? '启用后，进货、批次、染色入库等需选择仓位；仓位列表在「库存管理 → 仓位设置」中维护。'
                    : '关闭时，库存统一入库到默认仓位，页面不显示仓位。'}
                </p>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">默认仓位</label>
                  <input
                    type="text"
                    value={localParams.defaultStockLocation ?? '默认仓位'}
                    onChange={(e) =>
                      setLocalParams({ ...localParams, defaultStockLocation: e.target.value || '默认仓位' })
                    }
                    placeholder="默认仓位"
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    不启用仓位时，所有库存统一入此仓位；启用后仍作为默认选项。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 负库存出库 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              {/* 图标 */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>

              {/* 内容 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      允许负库存出库
                    </h3>
                    {localParams.allowNegativeStock && (
                      <Tooltip
                        content={
                          <div>
                            <div className="font-medium mb-1">提示：</div>
                            <div>
                              启用后，销售出库时允许库存数量不足的情况，系统将允许出库数量超过当前库存。
                            </div>
                          </div>
                        }
                      />
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localParams.allowNegativeStock}
                      onChange={(e) =>
                        setLocalParams({
                          ...localParams,
                          allowNegativeStock: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {localParams.allowNegativeStock ? '已启用' : '已禁用'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  控制销售出库时的库存检查策略：
                </p>
                <ul className="space-y-1 text-sm text-gray-600 mb-4">
                  <li>• 禁用时：出库数量不能超过当前库存，系统会阻止负库存出库</li>
                  <li>• 启用时：允许出库数量超过当前库存，系统将允许负库存出库</li>
                  <li>• 建议：生产环境建议禁用，避免库存管理混乱</li>
                </ul>
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

