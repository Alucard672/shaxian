import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useContactStore } from '@/store/contactStore'
import { SupplierType, SupplierStatus, SettlementCycle } from '@/types/contact'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { ArrowLeft, Save } from 'lucide-react'

interface SupplierFormData {
    name: string
    code: string
    contactPerson?: string
    phone?: string
    address?: string
    type: SupplierType
    status: SupplierStatus
    settlementCycle: SettlementCycle
    remark?: string
}

function SupplierForm() {
    const navigate = useNavigate()
    const { id } = useParams<{ id?: string }>()
    const {
        getSupplier,
        loadAll,
        addSupplier,
        updateSupplier
    } = useContactStore()

    const isEditMode = !!id
    const existingSupplier = isEditMode ? getSupplier(id!) : null

    // 加载数据（编辑模式下如果数据不存在，先加载）
    useEffect(() => {
        if (isEditMode && !existingSupplier) {
            loadAll()
        }
    }, [isEditMode, existingSupplier, loadAll])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<SupplierFormData>({
        defaultValues: existingSupplier ? {
            name: existingSupplier.name,
            code: existingSupplier.code,
            contactPerson: existingSupplier.contactPerson || '',
            phone: existingSupplier.phone || '',
            address: existingSupplier.address || '',
            type: existingSupplier.type,
            status: existingSupplier.status,
            settlementCycle: existingSupplier.settlementCycle,
            remark: existingSupplier.remark || '',
        } : {
            name: '',
            code: '',
            contactPerson: '',
            phone: '',
            address: '',
            type: '厂家',
            status: '合作中',
            settlementCycle: '现结',
            remark: '',
        },
    })

    // 加载编辑模式的数据
    useEffect(() => {
        if (isEditMode && existingSupplier) {
            setValue('name', existingSupplier.name)
            setValue('code', existingSupplier.code)
            setValue('contactPerson', existingSupplier.contactPerson || '')
            setValue('phone', existingSupplier.phone || '')
            setValue('address', existingSupplier.address || '')
            setValue('type', existingSupplier.type)
            setValue('status', existingSupplier.status)
            setValue('settlementCycle', existingSupplier.settlementCycle)
            setValue('remark', existingSupplier.remark || '')
        }
    }, [isEditMode, existingSupplier, setValue])

    const onSubmit = async (data: SupplierFormData) => {
        try {
            const supplierData = {
                name: data.name,
                code: data.code,
                contactPerson: data.contactPerson,
                phone: data.phone,
                address: data.address,
                type: data.type,
                settlementCycle: data.settlementCycle,
                status: data.status,
                remark: data.remark,
            }

            if (isEditMode && id) {
                await updateSupplier(id, supplierData)
            } else {
                await addSupplier(supplierData)
            }

            navigate('/supplier')
        } catch (error: any) {
            alert('保存失败: ' + (error.message || '未知错误'))
        }
    }

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/supplier')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {isEditMode ? '编辑' : '新增'}供应商
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditMode ? '修改' : '添加'}供应商基本信息
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/supplier')}
                        className="px-6 py-2"
                    >
                        取消
                    </Button>
                    <Button
                        type="submit"
                        form="supplier-form"
                        className="px-6 py-2"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                    </Button>
                </div>
            </div>

            {/* 表单 */}
            <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>

                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="供应商名称 *"
                            {...register('name', { required: '供应商名称不能为空' })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="供应商编码 *"
                            {...register('code', { required: '供应商编码不能为空' })}
                            error={errors.code?.message}
                        />
                        <Input
                            label="联系人"
                            {...register('contactPerson')}
                        />
                        <Input
                            label="联系电话"
                            {...register('phone')}
                        />
                        <div className="col-span-2">
                            <Input
                                label="联系地址"
                                {...register('address')}
                            />
                        </div>
                    </div>
                </div>

                {/* 业务信息 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">业务信息</h2>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                供应商类型 *
                            </label>
                            <select
                                {...register('type', { required: '供应商类型不能为空' })}
                                className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.type ? 'border-danger-500' : 'border-gray-200'
                                    }`}
                            >
                                <option value="厂家">厂家</option>
                                <option value="贸易商">贸易商</option>
                            </select>
                            {errors.type && (
                                <p className="mt-1 text-sm text-danger-500">{errors.type.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                状态 *
                            </label>
                            <select
                                {...register('status', { required: '状态不能为空' })}
                                className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.status ? 'border-danger-500' : 'border-gray-200'
                                    }`}
                            >
                                <option value="合作中">合作中</option>
                                <option value="已停用">已停用</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-danger-500">{errors.status.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                结算周期 *
                            </label>
                            <select
                                {...register('settlementCycle', { required: '结算周期不能为空' })}
                                className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.settlementCycle ? 'border-danger-500' : 'border-gray-200'
                                    }`}
                            >
                                <option value="现结">现结</option>
                                <option value="月结">月结</option>
                                <option value="季结">季结</option>
                            </select>
                            {errors.settlementCycle && (
                                <p className="mt-1 text-sm text-danger-500">{errors.settlementCycle.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 备注 */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">其他信息</h2>
                    <Textarea
                        label="备注"
                        {...register('remark')}
                        rows={4}
                    />
                </div>

            </form>
        </div>
    )
}

export default SupplierForm
