import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import { Database, Ruler } from 'lucide-react'

function BasicDataManagement() {
  const navigate = useNavigate()

  const dataCards = [
    {
      id: 'units',
      title: '单位管理',
      description: '管理系统使用的单位信息，如重量单位、长度单位等',
      icon: Ruler,
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: '#3B82F6',
      path: '/settings/basic-data/units',
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">基础资料</h1>
        <p className="text-sm text-gray-600">
          管理系统基础数据，包括单位等基础信息
        </p>
      </div>

      {/* 基础资料卡片网格 */}
      <div className="grid grid-cols-2 gap-6">
        {dataCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className="p-6 border border-gray-200/50 hover:shadow-md transition-shadow cursor-pointer bg-white rounded-xl"
              onClick={() => navigate(card.path)}
            >
              <div className="flex items-start gap-4">
                {/* 图标 */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}
                >
                  <Icon className="w-6 h-6" style={{ color: card.iconColor }} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BasicDataManagement



