import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { templateApi } from '@/api/client'
import { usePrintStore } from '@/store/printStore'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { Printer, Plus, Edit, Trash2, FileText, Settings } from 'lucide-react'

interface PrintTemplate {
  id: string
  name: string
  type?: string
  documentType?: string
  description?: string
  isDefault?: boolean
  usageCount?: number
  createdAt: string
  updatedAt: string
}

function PrintManagement() {
  const navigate = useNavigate()
  const { getPrintRecords, getPrintRecordsByType, getTodayPrintCount } = usePrintStore()
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'templates' | 'records' | 'settings'>('templates')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await templateApi.getAll()
      setTemplates(data)
    } catch (error: any) {
      console.error('Failed to load templates:', error)
      alert('加载模板失败：' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) {
      return
    }

    try {
      await templateApi.delete(id)
      await loadTemplates()
      alert('模板已删除')
    } catch (error: any) {
      alert('删除失败：' + (error.message || '未知错误'))
    }
  }

  const handleCreateTemplate = () => {
    navigate('/print/template/new')
  }

  const handleEditTemplate = (id: string) => {
    navigate(`/print/template/${id}`)
  }

  const printRecords = getPrintRecords()
  const todayPrintCount = getTodayPrintCount()

  const templateColumns = [
    {
      key: 'name',
      title: '模板名称',
      render: (_: any, record: PrintTemplate) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">{record.name}</span>
          {record.isDefault && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              默认
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'documentType',
      title: '单据类型',
      render: (_: any, record: PrintTemplate) => (
        <span className="text-sm text-gray-600">{record.documentType || '-'}</span>
      ),
    },
    {
      key: 'usageCount',
      title: '使用次数',
      render: (_: any, record: PrintTemplate) => (
        <span className="text-sm text-gray-600">{record.usageCount || 0}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_: any, record: PrintTemplate) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTemplate(record.id)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTemplate(record.id)}
            className="p-1.5 hover:bg-gray-100 rounded-xl"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ]

  const recordColumns = [
    {
      key: 'documentType',
      title: '单据类型',
      render: (_: any, record: any) => (
        <span className="text-sm font-medium text-gray-900">{record.documentType}</span>
      ),
    },
    {
      key: 'documentNumber',
      title: '单据编号',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">{record.documentNumber}</span>
      ),
    },
    {
      key: 'printCount',
      title: '打印次数',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">{record.printCount || 1}</span>
      ),
    },
    {
      key: 'lastPrintTime',
      title: '最后打印时间',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">
          {record.lastPrintTime
            ? new Date(record.lastPrintTime).toLocaleString('zh-CN')
            : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">打印管理</h1>
          <p className="text-sm text-gray-600 mt-1">管理打印模板和查看打印记录</p>
        </div>
        {selectedTab === 'templates' && (
          <Button
            onClick={handleCreateTemplate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建模板
          </Button>
        )}
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedTab('templates')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            模板管理
          </button>
          <button
            onClick={() => setSelectedTab('records')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'records'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Printer className="w-4 h-4 inline mr-2" />
            打印记录
            {todayPrintCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {todayPrintCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            打印设置
          </button>
        </div>
      </div>

      {/* 模板管理 */}
      {selectedTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>暂无模板，点击"新建模板"创建第一个模板</p>
            </div>
          ) : (
            <Table columns={templateColumns} data={templates} rowKey={(record) => record.id} />
          )}
        </div>
      )}

      {/* 打印记录 */}
      {selectedTab === 'records' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {printRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Printer className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>暂无打印记录</p>
            </div>
          ) : (
            <Table columns={recordColumns} data={printRecords} rowKey={(record, index) => index.toString()} />
          )}
        </div>
      )}

      {/* 打印设置 */}
      {selectedTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">默认打印机</h3>
              <p className="text-sm text-gray-600 mb-4">使用系统默认打印机</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">打印预览</h3>
              <p className="text-sm text-gray-600 mb-4">打印前显示预览</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrintManagement
