import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '@/store/contactStore'
import { useAccountStore } from '@/store/accountStore'
import { usePurchaseStore } from '@/store/purchaseStore'
import { Supplier } from '@/types/contact'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import ContactDetail from '../../components/contact/ContactDetail'
import {
    Plus,
    Edit,
    Eye,
    Building2,
    Download,
    Filter,
    Search,
    Phone,
    TrendingUp,
} from 'lucide-react'

function SupplierManagement() {
    const navigate = useNavigate()
    const {
        suppliers,
        loading,
        error,
        loadAll,
        deleteSupplier,
        getSupplier
    } = useContactStore()

    // 加载数据
    useEffect(() => {
        loadAll()
    }, [loadAll])

    const { payables } = useAccountStore()
    const { orders: purchaseOrders } = usePurchaseStore()

    const [searchKeyword, setSearchKeyword] = useState('')
    const [statusFilter, setStatusFilter] = useState<'全部' | '合作中' | '已停用'>('全部')
    const [currentPage, setCurrentPage] = useState(1)
    const [showDetail, setShowDetail] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const pageSize = 10

    // 统计数据
    const stats = useMemo(() => {
        const totalSuppliers = suppliers.length
        const activeSuppliers = suppliers.filter((s) => s.status === '合作中').length
        const inactiveSuppliers = suppliers.filter((s) => s.status === '已停用').length
        const thisMonthNew = suppliers.filter((s) => {
            const createdDate = new Date(s.createdAt)
            const now = new Date()
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
        }).length

        return {
            totalSuppliers,
            activeSuppliers,
            inactiveSuppliers,
            thisMonthNew,
        }
    }, [suppliers])

    // 筛选供应商
    const filteredSuppliers = useMemo(() => {
        let result = suppliers

        // 按状态筛选
        if (statusFilter !== '全部') {
            result = result.filter((s) => s.status === statusFilter)
        }

        // 关键词搜索
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase()
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(keyword) ||
                    s.code.toLowerCase().includes(keyword) ||
                    (s.contactPerson && s.contactPerson.toLowerCase().includes(keyword)) ||
                    (s.phone && s.phone.toLowerCase().includes(keyword))
            )
        }

        return result.sort((a, b) => a.name.localeCompare(b.name))
    }, [suppliers, statusFilter, searchKeyword])

    // 分页数据
    const paginatedSuppliers = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredSuppliers.slice(start, end)
    }, [filteredSuppliers, currentPage])

    // 获取供应商交易统计
    const getSupplierStats = (supplierId: string) => {
        const supplierOrders = purchaseOrders.filter((o) => o.supplierId === supplierId)
        const supplierPayables = payables.filter((p) => p.supplierId === supplierId)
        const totalAmount = supplierOrders.reduce((sum, o) => sum + o.totalAmount, 0)
        const unpaidAmount = supplierPayables
            .filter((p) => p.status === '未结清')
            .reduce((sum, p) => sum + p.unpaidAmount, 0)

        return {
            transactionCount: supplierOrders.length,
            totalAmount,
            unpaidAmount,
        }
    }

    // 统计卡片
    const statCards = [
        {
            label: '供应商总数',
            value: stats.totalSuppliers,
            icon: Building2,
            iconBg: 'bg-purple-100',
            bgColor: 'bg-purple-50/50',
        },
        {
            label: '合作中',
            value: stats.activeSuppliers,
            icon: Building2,
            iconBg: 'bg-success-100',
            bgColor: 'bg-success-50/50',
        },
        {
            label: '已停用',
            value: stats.inactiveSuppliers,
            icon: Building2,
            iconBg: 'bg-gray-100',
            bgColor: 'bg-gray-50/50',
        },
        {
            label: '本月新增',
            value: stats.thisMonthNew,
            icon: TrendingUp,
            iconBg: 'bg-warning-100',
            bgColor: 'bg-warning-50/50',
        },
    ]

    // 状态标签页
    const statusTabs = [
        { key: '全部', label: '全部' },
        { key: '合作中', label: '合作中' },
        { key: '已停用', label: '已停用' },
    ]

    // 表格列定义
    const supplierColumns = [
        {
            key: 'code',
            title: '供应商编号',
            render: (_: any, record: Supplier) => (
                <span className="text-gray-600 text-sm">{record.code}</span>
            ),
        },
        {
            key: 'name',
            title: '供应商名称',
            render: (_: any, record: Supplier) => (
                <span className="text-gray-900 font-medium text-base">{record.name}</span>
            ),
        },
        {
            key: 'type',
            title: '供应商类型',
            render: (_: any, record: Supplier) => (
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {record.type}
                </span>
            ),
        },
        {
            key: 'contactPerson',
            title: '联系人',
            render: (_: any, record: Supplier) => (
                <span className="text-gray-900 text-sm">{record.contactPerson || '-'}</span>
            ),
        },
        {
            key: 'contactInfo',
            title: '联系方式',
            render: (_: any, record: Supplier) => (
                <div className="flex flex-col gap-1">
                    {record.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-600 text-sm">{record.phone}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'settlementCycle',
            title: '结算周期',
            render: (_: any, record: Supplier) => (
                <span className="text-gray-900 text-sm">{record.settlementCycle}</span>
            ),
        },
        {
            key: 'transactionCount',
            title: '交易次数',
            render: (_: any, record: Supplier) => {
                const stats = getSupplierStats(record.id)
                return <span className="text-gray-900 text-sm">{stats.transactionCount} 次</span>
            },
        },
        {
            key: 'totalAmount',
            title: '交易总额',
            render: (_: any, record: Supplier) => {
                const stats = getSupplierStats(record.id)
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-gray-900 font-medium text-base">
                            ¥{stats.totalAmount.toLocaleString()}
                        </span>
                        {stats.unpaidAmount > 0 && (
                            <span className="text-danger-600 text-xs">
                                欠款 ¥{stats.unpaidAmount.toLocaleString()}
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            key: 'status',
            title: '状态',
            render: (_: any, record: Supplier) => {
                const isActive = record.status === '合作中'
                return (
                    <span className={`px-2.5 py-1 ${isActive ? 'bg-success-100' : 'bg-gray-100'
                        } ${isActive ? 'text-success-700' : 'text-gray-700'
                        } text-sm font-medium rounded-full`}>
                        {record.status}
                    </span>
                )
            },
        },
        {
            key: 'actions',
            title: '操作',
            render: (_: any, record: Supplier) => {
                const handleView = () => {
                    const supplier = getSupplier(record.id)
                    if (supplier) {
                        setSelectedSupplier(supplier)
                        setShowDetail(true)
                    }
                }

                const handleEdit = () => {
                    navigate(`/supplier/${record.id}/edit`)
                }

                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleView}
                            title="查看"
                            className="p-1.5 hover:bg-gray-100 rounded"
                        >
                            <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={handleEdit}
                            title="编辑"
                            className="p-1.5 hover:bg-gray-100 rounded"
                        >
                            <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                )
            },
        },
    ]

    // 显示加载状态
    if (loading && suppliers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">加载中...</div>
            </div>
        )
    }

    // 显示错误
    if (error && suppliers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 flex-col gap-4">
                <div className="text-red-500">加载失败: {error}</div>
                <Button onClick={() => loadAll()}>重试</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">供应商管理</h1>
                <p className="text-gray-600">
                    管理供应商信息，维护供应商关系
                </p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, index) => {
                    const Icon = card.icon
                    return (
                        <Card key={index} className={`p-4 border border-gray-200 ${card.bgColor} rounded-xl`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-col gap-1">
                                    <div className="text-xs text-gray-600">{card.label}</div>
                                    <div className="text-lg font-semibold text-gray-900">{card.value}</div>
                                </div>
                                <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-gray-700" />
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* 搜索和筛选栏 */}
            <Card className="p-4 rounded-xl">
                <div className="space-y-4">
                    {/* 第一行：筛选按钮 + 搜索框 + 导出 + 新增 */}
                    <div className="flex items-center gap-4">
                        {/* 筛选按钮 */}
                        <Button variant="outline" className="h-[39px] rounded-xl border-gray-200">
                            <Filter className="w-4 h-4 mr-2" />
                            筛选
                        </Button>
                        {/* 搜索框 */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜索供应商名称、编号、联系人..."
                                value={searchKeyword}
                                onChange={(e) => {
                                    setSearchKeyword(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full pl-10 pr-4 py-2 h-[39px] border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        {/* 导出按钮 */}
                        <Button variant="outline" className="h-[38px] rounded-lg border-gray-300">
                            <Download className="w-4 h-4 mr-2" />
                            导出
                        </Button>
                        {/* 新增供应商按钮 */}
                        <Button
                            className="h-[38px] rounded-lg bg-primary-600 hover:bg-primary-700"
                            onClick={() => navigate('/supplier/create')}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            新增供应商
                        </Button>
                    </div>

                    {/* 第二行：状态标签页 */}
                    <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setStatusFilter(tab.key as typeof statusFilter)
                                    setCurrentPage(1)
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${statusFilter === tab.key
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* 供应商列表表格 */}
            <Card className="rounded-xl overflow-hidden">
                {paginatedSuppliers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        {searchKeyword || statusFilter !== '全部'
                            ? '未找到匹配的供应商'
                            : '暂无供应商，请添加'}
                    </p>
                ) : (
                    <>
                        <Table columns={supplierColumns} data={paginatedSuppliers} />
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <span className="text-sm text-gray-600">共 {filteredSuppliers.length} 条记录</span>
                            <Pagination
                                current={currentPage}
                                total={filteredSuppliers.length}
                                pageSize={pageSize}
                                onChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </Card>

            {/* 详情弹窗 */}
            {showDetail && selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <ContactDetail
                        contact={selectedSupplier}
                        type="supplier"
                        onEdit={() => {
                            setShowDetail(false)
                            navigate(`/supplier/${selectedSupplier.id}/edit`)
                        }}
                        onClose={() => {
                            setShowDetail(false)
                            setSelectedSupplier(null)
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default SupplierManagement
