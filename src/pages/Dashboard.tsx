import Card from '../components/ui/Card'

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">工作台</h1>
        <p className="text-gray-600">欢迎使用纱线进销存系统</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-sm text-gray-600 mb-1">今日销售额</div>
          <div className="text-2xl font-semibold text-gray-900">¥0.00</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">今日进货额</div>
          <div className="text-2xl font-semibold text-gray-900">¥0.00</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">库存商品数</div>
          <div className="text-2xl font-semibold text-gray-900">0</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 mb-1">待处理订单</div>
          <div className="text-2xl font-semibold text-gray-900">0</div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard


