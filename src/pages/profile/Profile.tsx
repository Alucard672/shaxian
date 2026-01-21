import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import { User, Phone, MapPin, ChevronRight, Building2, Package, Boxes, Home, Send, RotateCcw, BarChart3 } from 'lucide-react'

function Profile() {
  const navigate = useNavigate()
  const { storeInfo, loadStoreInfo } = useSettingsStore()
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    loadStoreInfo()
    // 从 localStorage 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        setUserInfo(JSON.parse(userStr))
      } catch {
        setUserInfo(null)
      }
    }
  }, [loadStoreInfo])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-3 pb-1">
        <h1 className="text-2xl font-semibold text-gray-900">纱线收发加工</h1>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-4 pb-0">
        {/* 个人信息卡片 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-start gap-3">
            {/* 头像 */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>

            {/* 公司信息 */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-3">
                {storeInfo.name || 'XX纺织加工有限公司'}
              </h2>

              <div className="space-y-2">
                {/* 联系人 */}
                {userInfo?.name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white/90">{userInfo.name}</span>
                  </div>
                )}

                {/* 电话 */}
                {storeInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white/90">{storeInfo.phone}</span>
                  </div>
                )}

                {/* 地址 */}
                {storeInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/80" />
                    <span className="text-sm text-white/90">{storeInfo.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 基础管理 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">基础管理</h3>
          
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* 加工厂管理 */}
            <button
              onClick={() => navigate('/supplier')}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-medium text-gray-900">加工厂管理</div>
                <div className="text-xs text-gray-600">管理加工厂信息</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 款号管理 */}
            <button
              onClick={() => navigate('/products')}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-medium text-gray-900">款号管理</div>
                <div className="text-xs text-gray-600">管理款式信息</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 纱线管理 */}
            <button
              onClick={() => navigate('/inventory')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Boxes className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-medium text-gray-900">纱线管理</div>
                <div className="text-xs text-gray-600">管理纱线库存</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 版本信息 */}
        <div className="text-center py-4">
          <span className="text-xs text-gray-500">版本 v1.0.0</span>
        </div>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-around h-14">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">首页</span>
          </button>
          <button
            onClick={() => navigate('/purchase/create')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-gray-50 transition-colors"
          >
            <Send className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">发料</span>
          </button>
          <button
            onClick={() => navigate('/sales/create')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">回货</span>
          </button>
          <button
            onClick={() => navigate('/report')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600">统计</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          >
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">我的</span>
          </button>
        </div>
      </div>

      {/* 底部占位，避免内容被导航栏遮挡 */}
      <div className="h-14" />
    </div>
  )
}

export default Profile

