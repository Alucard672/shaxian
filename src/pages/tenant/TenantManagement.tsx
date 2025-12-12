import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Tenant {
  id: string
  code: string
  name: string
  logo?: string
  status: string
}

function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      // TODO: 实现租户列表API
      setError('租户管理功能暂未实现')
    } catch (err: any) {
      setError(err.message || '加载租户列表失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">租户管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理系统中的所有租户</p>
        </div>
        <Button>
          <Building2 className="w-4 h-4 mr-2" />
          新建租户
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {tenants.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">暂无租户数据</p>
        </div>
      )}
    </div>
  )
}

export default TenantManagement


