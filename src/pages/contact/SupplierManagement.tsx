import Card from '../../components/ui/Card'

function SupplierManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">供应商管理</h1>
        <p className="text-gray-600">管理供应商基本信息及往来记录</p>
      </div>
      
      <Card>
        <p className="text-gray-500 text-center py-8">供应商列表（待实现）</p>
      </Card>
    </div>
  )
}

export default SupplierManagement


