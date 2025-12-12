import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Tenant {
  id: string
  code: string
  name: string
  logo?: string
  status: string
}

function TenantSelect() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      
      // 检查是否已有选中的租户
      const currentTenantId = localStorage.getItem('currentTenantId')
      if (currentTenantId) {
        navigate('/')
        return
      }
      
      // 调用租户API（如果后端支持）
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
        // 创建超时控制器
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(`${API_BASE_URL}/tenants`, {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            setTenants(data)
            // 如果只有一个租户，自动选择
            if (data.length === 1) {
              handleSelectTenant(data[0].id)
              return
            }
            // 有多个租户，显示选择界面
            return
          }
        }
        // API返回404或其他错误，说明租户功能未实现，跳过
        console.info('租户API不可用，使用默认租户')
        localStorage.setItem('currentTenantId', 'default')
        navigate('/')
        return
      } catch (apiError: any) {
        // API调用失败（连接被拒绝、超时等），跳过租户选择
        console.info('租户功能暂未实现，使用默认租户:', apiError.message)
        // 设置默认租户，允许继续使用系统
        localStorage.setItem('currentTenantId', 'default')
        navigate('/')
        return
      }
    } catch (err: any) {
      console.error('加载租户列表失败:', err)
      // 出错时也设置默认租户，允许继续使用
      localStorage.setItem('currentTenantId', 'default')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    localStorage.setItem('currentTenantId', tenantId)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => navigate('/')} className="w-full">
              返回首页
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">选择租户</h1>
          <p className="text-gray-600">请选择要访问的租户</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">暂无可用租户</p>
              <Button onClick={() => navigate('/')} variant="outline">
                返回
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant.id)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTenantId === tenant.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {tenant.name}
                      </h3>
                      <p className="text-sm text-gray-500">{tenant.code}</p>
                    </div>
                    {selectedTenantId === tenant.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TenantSelect


