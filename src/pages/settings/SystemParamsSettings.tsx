import { useSettingsStore } from '@/store/settingsStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tooltip from '../../components/ui/Tooltip'
import { Settings, Palette, Save, Info, Package } from 'lucide-react'
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

          {/* 商品必填项配置 */}
          <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    商品必填项配置
                  </h3>
                  <Tooltip
                    content={
                      <div>
                        <div className="font-medium mb-1">提示：</div>
                        <div>
                          选择商品创建/编辑时必须填写的字段。未选中的字段将变为可选。
                        </div>
                      </div>
                    }
                  />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  配置商品管理中的必填字段，控制数据完整性：
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'name', label: '商品名称' },
                    { key: 'code', label: '商品编码' },
                    { key: 'specification', label: '规格' },
                    { key: 'composition', label: '成分' },
                    { key: 'count', label: '支数' },
                    { key: 'unit', label: '单位' },
                    { key: 'manufacturer', label: '厂家' },
                    { key: 'width', label: '幅宽' },
                    { key: 'weight', label: '克重' },
                  ].map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localParams.productRequiredFields?.includes(field.key) || false}
                        onChange={(e) => {
                          const currentFields = localParams.productRequiredFields || []
                          if (e.target.checked) {
                            setLocalParams({
                              ...localParams,
                              productRequiredFields: [...currentFields, field.key],
                            })
                          } else {
                            setLocalParams({
                              ...localParams,
                              productRequiredFields: currentFields.filter((f) => f !== field.key),
                            })
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  当前必填项：{localParams.productRequiredFields?.length 
                    ? localParams.productRequiredFields.map(f => {
                        const labels: Record<string, string> = {
                          name: '商品名称',
                          code: '商品编码',
                          specification: '规格',
                          composition: '成分',
                          count: '支数',
                          unit: '单位',
                          manufacturer: '厂家',
                          width: '幅宽',
                          weight: '克重',
                        }
                        return labels[f] || f
                      }).join('、')
                    : '无'}
                </p>
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

