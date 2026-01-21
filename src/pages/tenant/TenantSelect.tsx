import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, AlertCircle, LogOut, Plus, Users, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { tenantApi, authApi, settingsApi } from '@/api/client'
import { UserTenant } from '@/types/tenant'

function TenantSelect() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<UserTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState({ name: '', address: '' })
  const [joinForm, setJoinForm] = useState({ code: '' })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    // 辅助函数：尝试从Session构建租户
    const tryBuildFromSession = async () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.tenantId) {
            console.log('检测到会话中存在租户信息，尝试获取详细信息...', user.tenantId);

            // 尝试获取当前租户的详细门店信息
            let storeInfo = null;
            try {
              storeInfo = await settingsApi.getStoreInfo();
            } catch (e) {
              console.warn('无法获取门店信息，使用会话基本信息构建', e);
            }

            // 构建一个临时的UserTenant对象
            const syntheticTenant: UserTenant = {
              id: 0, // 占位ID
              userId: user.userId || 0,
              tenantId: user.tenantId,
              isDefault: true,
              tenant: {
                id: user.tenantId,
                name: storeInfo?.name || user.tenantName || `Tenant #${user.tenantId}`,
                code: storeInfo?.code || 'UNKNOWN',
                address: storeInfo?.address || '',
                status: 'ACTIVE'
              }
            };
            return [syntheticTenant];
          }
        } catch (parseError) {
          console.warn('解析用户信息失败', parseError);
        }
      }
      return [];
    };

    try {
      setLoading(true)
      setError('')

      let finalTenants: UserTenant[] = [];

      try {
        const userTenants = await tenantApi.getUserTenants() as UserTenant[];
        if (Array.isArray(userTenants)) {
          finalTenants = userTenants;
        }
      } catch (apiError) {
        console.warn('API获取租户列表失败，尝试使用Session回退', apiError);
        // 不立即抛出错误，尝试Session回退
      }

      // Fallback: 如果列表为空（无论是API返回空还是API失败），尝试从Session构建
      if (finalTenants.length === 0) {
        const sessionTenants = await tryBuildFromSession();
        if (sessionTenants.length > 0) {
          finalTenants = sessionTenants;
          // 清除之前的API错误（如果有）
          setError('');
        } else if (!finalTenants.length) {
          // 如果确实没有租户，且API也失败了，这时候显示错误
          // 注意：我们只在确实无法构建租户时才显示 "暂无关联企业" 或者 API错误
        }
      }

      setTenants(finalTenants)

      // 如果只有一个租户，且没有手动取消自动跳转
      if (finalTenants.length === 1 && !showCreateModal && !showJoinModal) {
        handleSelectTenant(finalTenants[0].tenantId, finalTenants)
        return
      }
    } catch (err: any) {
      console.error('加载租户流程异常:', err)
      setError(err.message || '加载租户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = async (tenantId: number, tenantList?: UserTenant[]) => {
    try {
      setSelectedTenantId(tenantId)
      const list = tenantList || tenants
      const selectedTenant = list.find(t => t.tenantId === tenantId)?.tenant

      // Check current session
      const userStr = localStorage.getItem('user');
      let currentUser = null;
      if (userStr) {
        currentUser = JSON.parse(userStr);
      }

      // 调用切换租户API
      let result;
      try {
        result = await tenantApi.switchTenant(tenantId)
      } catch (err: any) {
        // 如果API调用失败，但当前会话的tenantId已经与目标一致，则忽略错误继续
        if (currentUser && currentUser.tenantId === tenantId) {
          console.warn("Switch tenant API failed, but session matches. Proceeding.", err);
          result = currentUser; // Use existing session
        } else {
          throw err; // Re-throw real error
        }
      }

      // 保存选中的租户ID和基本信息到localStorage
      localStorage.setItem('currentTenantId', tenantId.toString())
      if (selectedTenant) {
        localStorage.setItem('currentTenantName', selectedTenant.name)
        localStorage.setItem('currentTenantCode', selectedTenant.code)
      }

      // 如果返回了新的会话信息，更新localStorage
      if (result) {
        localStorage.setItem('user', JSON.stringify(result))
      }

      // 跳转到首页
      navigate('/')
    } catch (err: any) {
      // alert('选择租户失败：' + (err.message || '未知错误'))
      // 改为显示错误信息而非alert
      setError('进入租户失败：' + (err.message || '未知错误'))
      setSelectedTenantId(null)
    }
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('currentTenantId')
      navigate('/login')
    } catch (err) {
      navigate('/login')
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name) return

    setModalLoading(true)
    try {
      await tenantApi.createTenant(createForm)
      setShowCreateModal(false)
      setCreateForm({ name: '', address: '' })
      // 重新加载租户列表
      await loadTenants()
    } catch (err: any) {
      alert(err.message || '创建租户失败')
    } finally {
      setModalLoading(false)
    }
  }

  const handleJoinTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinForm.code) return

    setModalLoading(true)
    try {
      await (tenantApi as any).joinTenant(joinForm.code)
      setShowJoinModal(false)
      setJoinForm({ code: '' })
      // 重新加载租户列表
      await loadTenants()
    } catch (err: any) {
      alert(err.message || '加入租户失败')
    } finally {
      setModalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">正在获取您的租户列表...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] mb-6 shadow-xl shadow-blue-200">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">欢迎回来</h1>
          <p className="text-gray-500 text-lg">请选择要进入的企业，或创建新企业</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 border border-white/50">
          {error && tenants.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">暂无关联企业</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                您当前还没有加入任何企业。您可以创建一个新企业，或者通过企业代码加入已有企业。
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl h-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  创建新企业
                </Button>
                <Button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-lg rounded-xl h-auto"
                >
                  <Users className="w-5 h-5 mr-2" />
                  加入已有企业
                </Button>
              </div>
              <div className="mt-8">
                <Button onClick={handleLogout} variant="ghost" className="text-gray-400 hover:text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {tenants.map((ut) => (
                  <div
                    key={ut.tenant.id}
                    onClick={() => handleSelectTenant(ut.tenantId)}
                    className={`group relative p-6 bg-white border-2 rounded-3xl cursor-pointer transition-all duration-300 hover:shadow-xl ${selectedTenantId === ut.tenantId
                      ? 'border-blue-500 ring-2 ring-blue-200 ring-offset-2'
                      : 'border-transparent hover:border-blue-200'
                      }`}
                  >
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent group-hover:via-blue-400 transition-colors" />

                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {ut.tenant.name.charAt(0)}
                      </div>
                      {selectedTenantId === ut.tenantId && (
                        <div className="bg-blue-600 p-1 rounded-full">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {ut.tenant.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-400 mb-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                          Code: {ut.tenant.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                        {ut.tenant.address || '暂无地址信息'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Create New Card */}
                <div className="group relative p-6 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]"
                  onClick={() => setShowCreateModal(true)}>
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-500 group-hover:text-blue-700">创建新企业</span>
                </div>

                {/* Join Card */}
                <div className="group relative p-6 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 min-h-[200px]"
                  onClick={() => setShowJoinModal(true)}>
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Users className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                  </div>
                  <span className="font-semibold text-gray-500 group-hover:text-purple-700">加入企业</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {tenants.length} 个关联企业
                </p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-semibold text-gray-500 hover:text-red-500 flex items-center gap-2 transition-colors px-4 py-2 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">创建新企业</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">企业名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="例如：杭州织造有限公司"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">地址</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入企业地址"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  取消
                </Button>
                <Button type="submit" disabled={modalLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {modalLoading ? '创建中...' : '立即创建'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Tenant Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">加入已有企业</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleJoinTenant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">企业代码 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={joinForm.code}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono tracking-wider"
                  placeholder="请输入企业邀请码或代码"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">请向企业管理员获取该代码</p>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowJoinModal(false)} className="flex-1">
                  取消
                </Button>
                <Button type="submit" disabled={modalLoading} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {modalLoading ? '提交申请...' : '申请加入'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantSelect
