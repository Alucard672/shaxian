import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Store, Save, ArrowLeft } from 'lucide-react'

function StoreInfoSettings() {
  const navigate = useNavigate()
  const { storeInfo, updateStoreInfo } = useSettingsStore()
  const [localStoreInfo, setLocalStoreInfo] = useState(storeInfo)

  useEffect(() => {
    setLocalStoreInfo(storeInfo)
  }, [storeInfo])

  const handleSave = () => {
    updateStoreInfo(localStoreInfo)
    alert('门店信息已保存！')
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
            <h1 className="text-2xl font-semibold text-gray-900">门店信息</h1>
            <p className="text-sm text-gray-600 mt-1">配置门店基本信息，将显示在所有打印单据上</p>
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

      {/* 门店信息表单 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <Store className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 门店名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              门店名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={localStoreInfo.name}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, name: e.target.value })}
              placeholder="请输入门店名称"
              className="w-full"
            />
          </div>

          {/* 门店编码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              门店编码
            </label>
            <Input
              value={localStoreInfo.code || ''}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, code: e.target.value })}
              placeholder="请输入门店编码"
              className="w-full"
            />
          </div>

          {/* 联系电话 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <Input
              value={localStoreInfo.phone}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, phone: e.target.value })}
              placeholder="请输入联系电话"
              className="w-full"
            />
          </div>

          {/* 传真 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              传真
            </label>
            <Input
              value={localStoreInfo.fax || ''}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, fax: e.target.value })}
              placeholder="请输入传真号码"
              className="w-full"
            />
          </div>

          {/* 详细地址 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细地址 <span className="text-red-500">*</span>
            </label>
            <Input
              value={localStoreInfo.address}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, address: e.target.value })}
              placeholder="请输入详细地址"
              className="w-full"
            />
          </div>

          {/* 邮编 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮编
            </label>
            <Input
              value={localStoreInfo.postalCode || ''}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, postalCode: e.target.value })}
              placeholder="请输入邮编"
              className="w-full"
            />
          </div>

          {/* 邮箱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <Input
              type="email"
              value={localStoreInfo.email || ''}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, email: e.target.value })}
              placeholder="请输入邮箱地址"
              className="w-full"
            />
          </div>

          {/* 备注 */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <Textarea
              value={localStoreInfo.remark || ''}
              onChange={(e) => setLocalStoreInfo({ ...localStoreInfo, remark: e.target.value })}
              placeholder="请输入备注信息"
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreInfoSettings




