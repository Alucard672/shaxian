import Card from '../../components/ui/Card'

function AccountPayable() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">应付账款</h1>
        <p className="text-gray-600">管理与供应商的应付账款</p>
      </div>
      
      <Card>
        <p className="text-gray-500 text-center py-8">应付账款列表（待实现）</p>
      </Card>
    </div>
  )
}

export default AccountPayable


