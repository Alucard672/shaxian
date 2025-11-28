import Card from '../../components/ui/Card'

function CustomerManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">客户管理</h1>
        <p className="text-gray-600">管理客户基本信息及往来记录</p>
      </div>
      
      <Card>
        <p className="text-gray-500 text-center py-8">客户列表（待实现）</p>
      </Card>
    </div>
  )
}

export default CustomerManagement


