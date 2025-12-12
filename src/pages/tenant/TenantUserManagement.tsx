import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import Button from '@/components/ui/Button'

interface UserTenantRelation {
  id: string
  userId: string
  tenantId: string
  role: string
  status: string
}

function TenantUserManagement() {
  const [relations, setRelations] = useState<UserTenantRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRelations()
  }, [])

  const loadRelations = async () => {
    try {
      setLoading(true)
      // TODO: 实现租户用户关系API
      setError('租户用户管理功能暂未实现')
    } catch (err: any) {
      setError(err.message || '加载用户列表失败')
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
          <h1 className="text-2xl font-semibold text-gray-900">租户用户管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理租户中的用户和角色</p>
        </div>
        <Button>
          <Users className="w-4 h-4 mr-2" />
          添加用户
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {relations.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">暂无用户数据</p>
        </div>
      )}
    </div>
  )
}

export default TenantUserManagement


