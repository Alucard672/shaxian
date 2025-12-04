import { useSettingsStore } from '@/store/settingsStore'
import Card from '../../components/ui/Card'
import {
  Settings,
  Store,
  Users,
  AlertTriangle,
  Shield,
  Search,
  Info,
  BookOpen,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function SettingsManagement() {
  const { systemInfo } = useSettingsStore()
  const navigate = useNavigate()

  // 设置卡片配置
  const settingCards = [
    {
      id: 'tutorial',
      title: '使用教程',
      description: '查看各功能模块的详细操作步骤和流程说明',
      icon: BookOpen,
      iconBg: 'bg-gradient-to-br from-cyan-100 to-cyan-200',
      iconColor: '#06B6D4',
      features: [
        '• 按模块分类查看教程',
        '• 详细的操作步骤说明',
      ],
    },
    {
      id: 'params',
      title: '参数设置',
      description: '配置系统业务参数，控制功能模块的启用与禁用',
      icon: Settings,
      iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
      iconColor: '#6366F1',
      features: [
        '• 染色加工流程开关',
        '• 功能模块启用控制',
      ],
    },
    {
      id: 'store',
      title: '门店信息',
      description: '配置门店基本信息，将显示在所有打印单据上',
      icon: Store,
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: '#155DFC',
      features: [
        '• 门店名称、地址、电话',
        '• 打印单据信息配置',
      ],
    },
    {
      id: 'employees',
      title: '人员列表',
      description: '管理员工信息，用于业务单据的制单人、经手人选择',
      icon: Users,
      iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
      iconColor: '#00A63E',
      features: [
        '• 员工姓名、职位、联系方式',
        '• 角色权限分配',
      ],
    },
    {
      id: 'inventory-alert',
      title: '库存预警设置',
      description: '配置库存预警阈值，当库存低于该值时触发预警',
      icon: AlertTriangle,
      iconBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
      iconColor: '#F54900',
      features: [
        '• 库存预警阈值设置',
        '• 自动预警提醒',
      ],
    },
    {
      id: 'roles',
      title: '角色管理',
      description: '管理系统角色，配置菜单权限和数据权限',
      icon: Shield,
      iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
      iconColor: '#9810FA',
      features: [
        '• 角色创建与编辑',
        '• 菜单权限、数据权限配置',
      ],
    },
    {
      id: 'custom-query',
      title: '自定义查询设置',
      description: '配置自定义查询条件，方便快速查找数据',
      icon: Search,
      iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200',
      iconColor: '#4B5563',
      features: [
        '• 自定义查询条件设置',
        '• 快速查找数据',
      ],
    },
    {
      id: 'clear-data',
      title: '清空数据',
      description: '清空系统中的测试数据，用于重新开始测试',
      icon: Trash2,
      iconBg: 'bg-gradient-to-br from-red-100 to-red-200',
      iconColor: '#DC2626',
      features: [
        '• 清空所有业务数据',
        '• 按模块清空数据',
      ],
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">系统设置</h1>
        <p className="text-sm text-gray-600">
          管理系统基本配置、权限和业务规则
        </p>
      </div>

      {/* 设置卡片网格 - 2x2 布局 */}
      <div className="grid grid-cols-2 gap-6">
        {settingCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className="p-6 border border-gray-200/50 hover:shadow-md transition-shadow cursor-pointer bg-white rounded-xl"
              onClick={() => {
                if (card.id === 'params') {
                  navigate('/settings/params')
                } else if (card.id === 'tutorial') {
                  navigate('/settings/tutorial')
                } else if (card.id === 'store') {
                  navigate('/settings/store')
                } else if (card.id === 'employees') {
                  navigate('/settings/employees')
                } else if (card.id === 'roles') {
                  navigate('/settings/roles')
                } else if (card.id === 'custom-query') {
                  navigate('/settings/custom-query')
                } else if (card.id === 'inventory-alert') {
                  navigate('/settings/inventory-alert')
                } else if (card.id === 'clear-data') {
                  navigate('/settings/clear-data')
                }
              }}
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
                  <p className="text-sm text-gray-600 mb-3">
                    {card.description}
                  </p>
                  <div className="space-y-1 mt-2">
                    {card.features.map((feature, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 系统信息和提示 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 系统信息 */}
        <Card className="p-6 border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">系统信息</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 mb-1">系统名称</span>
              <span className="text-sm text-gray-900">{systemInfo.systemName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 mb-1">版本号</span>
              <span className="text-sm text-gray-900">{systemInfo.version}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 mb-1">最后更新</span>
              <span className="text-sm text-gray-900">{systemInfo.lastUpdate}</span>
            </div>
          </div>
        </Card>

        {/* 系统设置提示 */}
        <Card className="p-4 border border-blue-200 bg-blue-50 col-span-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                系统设置提示
              </h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• 请根据实际业务需求配置各项系统参数</li>
                <li>• 修改设置后会立即生效，建议谨慎操作</li>
                <li>• 左侧菜单选择具体设置项进行配置</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SettingsManagement

