import { useState, useEffect } from 'react'
import { Building2, Plus, Copy, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { tenantApi } from '@/api/client'
import { Tenant, UserTenant } from '@/types/tenant'

function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [newTenant, setNewTenant] = useState<Tenant | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTenants()
  }, [])

  /* 
    The following function includes fallback logic to handle backend serialization errors 
    (like ByteBuddyInterceptor) by attempting to recover tenant info from the local session.
  */
  const loadTenants = async () => {
    try {
      setLoading(true)
      setError('')
      let userTenants: UserTenant[] = [];

      try {
        userTenants = await tenantApi.getUserTenants() as UserTenant[];
      } catch (err: any) {
        // 后端可能返回 500 ByteBuddy 序列化错误，此时尝试从 Session 恢复当前租户
        console.warn('API load failed, attempting session fallback:', err);

        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.tenantId) {
              // 构造一个临时的 UserTenant
              const syntheticTenant: UserTenant = {
                id: 0,
                userId: user.userId,
                tenantId: user.tenantId,
                isDefault: true,
                tenant: {
                  id: user.tenantId,
                  name: user.tenantName || 'Current Tenant',
                  code: 'UNKNOWN', // Session usually doesn't have code
                  address: '',
                  status: 'ACTIVE'
                }
              };
              userTenants = [syntheticTenant];
              // Don't set error if we successfully recovered
              if (userTenants.length > 0) return setTenants(userTenants.map(ut => ut.tenant));
            }
          } catch (e) {
            console.error('Session parsing failed', e);
          }
        }

        // If fallback failed, rethrow or set error
        if (userTenants.length === 0) {
          throw err;
        }
      }

      // 提取租户信息
      if (Array.isArray(userTenants)) {
        const tenantList = userTenants.map(ut => ut.tenant)
        setTenants(tenantList)
      }
    } catch (err: any) {
      console.error('Failed to load tenants:', err)
      setError(err.message || '加载租户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.address) {
      alert('请填写租户名称和地址')
      return
    }

    try {
      setSubmitting(true)
      const result = await tenantApi.createTenant(formData)
      setNewTenant(result)
      setIsModalOpen(false)
      setIsSuccessModalOpen(true)
      loadTenants() // 刷新列表
    } catch (err: any) {
      alert(err.message || '创建租户失败')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">租户管理</h1>
          <p className="text-sm text-gray-500 mt-1">创建和管理您的企业租户</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          注册新租户
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          {error}
        </div>
      )}

      {tenants.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Building2 className="w-20 h-20 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">暂无租户</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto">
            您还没有关联任何租户。点击右上角“注册新租户”创建一个吧！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tenant.status === 'ACTIVE' ? '运行中' : '已禁用'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{tenant.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{tenant.code}</span>
                <button onClick={() => copyToClipboard(tenant.code)} className="hover:text-blue-600">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem] mb-4">
                {tenant.address}
              </p>
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  创建于: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '未知'}
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  进入系统 <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 注册租户弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">注册新租户</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  租户名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：沙县小吃一号店"
                  className="w-full text-base py-3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  联系地址 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入您的详细经营地址"
                  className="w-full text-base py-3"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-base"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 text-base bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '立即注册'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 注册成功弹窗 */}
      {isSuccessModalOpen && newTenant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">租户注册成功！</h2>
            <p className="text-gray-500 mb-8 px-4">
              您已成功创建租户。请保存下方的租户代码，用于后续用户注册时关联。
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 relative group">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">注册代码 (Tenant Code)</div>
              <div className="text-3xl font-black text-blue-600 tracking-wider font-mono select-all">
                {newTenant.code}
              </div>
              <button
                onClick={() => copyToClipboard(newTenant.code)}
                className="absolute top-4 right-4 p-2 bg-white shadow-sm border border-gray-100 rounded-xl hover:scale-110 transition-transform active:scale-95 text-gray-400 hover:text-blue-600"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-4 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
            >
              完成并关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TenantManagement


