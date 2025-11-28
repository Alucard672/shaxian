import Card from '../../components/ui/Card'

function Inventory() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">库存管理</h1>
        <p className="text-gray-600">实时查看和管理纱线库存</p>
      </div>
      
      <Card>
        <p className="text-gray-500 text-center py-8">库存查询（待实现）</p>
      </Card>
    </div>
  )
}

export default Inventory


