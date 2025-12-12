import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useContactStore } from '@/store/contactStore'
import { CustomerType, CustomerStatus } from '@/types/contact'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { ArrowLeft, Save } from 'lucide-react'

interface CustomerFormData {
    name: string
    code: string
    contactPerson?: string
    phone?: string
    address?: string
    type: CustomerType
    status: CustomerStatus
    creditLimit?: number
    remark?: string
}

function CustomerForm() {
    const navigate = useNavigate()
    const { id } = useParams<{ id?: string }>()
    const {
        getCustomer,
        loadAll,
        addCustomer,
        updateCustomer
    } = useContactStore()

    const isEditMode = !!id
    const existingCustomer = isEditMode ? getCustomer(id!) : null

    // 加载数据（编辑模式下如果数据不存在，先加载）
    useEffect(() => {
        if (isEditMode && !existingCustomer) {
            loadAll()
        }
    }, [isEditMode, existingCustomer, loadAll])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
    } = useForm<CustomerFormData>({
        defaultValues: existingCustomer ? {
            name: existingCustomer.name,
            code: existingCustomer.code,
            contactPerson: existingCustomer.contactPerson || '',
            phone: existingCustomer.phone || '',
            address: existingCustomer.address || '',
            type: existingCustomer.type,
            status: existingCustomer.status,
            creditLimit: existingCustomer.creditLimit,
            remark: existingCustomer.remark || '',
        } : {
            name: '',
            code: '',
            contactPerson: '',
            phone: '',
            address: '',
            type: '直客',
            status: '正常',
            creditLimit: undefined,
            remark: '',
        },
    })

    // 加载编辑模式的数据
    useEffect(() => {
        if (isEditMode && existingCustomer) {
            setValue('name', existingCustomer.name)
            setValue('code', existingCustomer.code)
            setValue('contactPerson', existingCustomer.contactPerson || '')
            setValue('phone', existingCustomer.phone || '')
            setValue('address', existingCustomer.address || '')
            setValue('type', existingCustomer.type)
            setValue('status', existingCustomer.status)
            setValue('creditLimit', existingCustomer.creditLimit)
            setValue('remark', existingCustomer.remark || '')
        }
    }, [isEditMode, existingCustomer, setValue])

    const onSubmit = async (data: CustomerFormData) => {
        try {
            const customerData = {
                name: data.name,
                code: data.code,
                contactPerson: data.contactPerson,
                phone: data.phone,
                address: data.address,
                type: data.type,
                creditLimit: data.creditLimit,
                status: data.status,
                remark: data.remark,
            }

            if (isEditMode && id) {
                await updateCustomer(id, customerData)
            } else {
                await addCustomer(customerData)
            }

            navigate('/customer')
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
                        onClick={() => navigate('/customer')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {isEditMode ? '编辑' : '新增'}客户
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditMode ? '修改' : '添加'}客户基本信息
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/customer')}
                        className="px-6 py-2"
                    >
                        取消
                    </Button>
                    <Button
                        type="submit"
                        form="customer-form"
                        className="px-6 py-2"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                    </Button>
                </div>
            </div>

            {/* 表单 */}
            <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>

                    <div className="grid grid-cols-2 gap-6">
                        <Input
                            label="客户名称 *"
                            {...register('name', { required: '客户名称不能为空' })}
                            error={errors.name?.message}
                        />
                        <Input
                            label="客户编码 *"
                            {...register('code', { required: '客户编码不能为空' })}
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
                                客户类型 *
                            </label>
                            <select
                                {...register('type', { required: '客户类型不能为空' })}
                                className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.type ? 'border-danger-500' : 'border-gray-200'
                                    }`}
                            >
                                <option value="直客">直客</option>
                                <option value="经销商">经销商</option>
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
                                <option value="正常">正常</option>
                                <option value="冻结">冻结</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-sm text-danger-500">{errors.status.message}</p>
                            )}
                        </div>
                        <Input
                            label="信用额度"
                            type="number"
                            step="0.01"
                            {...register('creditLimit', { valueAsNumber: true })}
                        />
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

export default CustomerForm
