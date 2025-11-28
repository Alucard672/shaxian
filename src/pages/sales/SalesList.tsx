import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

function SalesList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">销售管理</h1>
          <p className="text-gray-600">管理向客户销售纱线的全流程</p>
        </div>
        <Link to="/sales/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建销售单
          </Button>
        </Link>
      </div>
      
      <Card>
        <p className="text-gray-500 text-center py-8">销售单列表（待实现）</p>
      </Card>
    </div>
  )
}

export default SalesList


