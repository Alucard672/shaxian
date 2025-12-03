import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useContactStore } from '@/store/contactStore'
import { Customer, Supplier, CustomerType, CustomerStatus, SupplierType, SupplierStatus, SettlementCycle } from '@/types/contact'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { ArrowLeft, Save } from 'lucide-react'

type ContactFormType = 'customer' | 'supplier'

interface ContactFormData {
  name: string
  code: string
  contactPerson?: string
  phone?: string
  address?: string
  type?: CustomerType | SupplierType
  status?: CustomerStatus | SupplierStatus
  creditLimit?: number
  settlementCycle?: SettlementCycle
  remark?: string
}

function ContactForm() {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type: ContactFormType; id?: string }>()
  const { getCustomer, getSupplier, addCustomer, updateCustomer, addSupplier, updateSupplier } = useContactStore()

  const isEditMode = !!id
  const isCustomer = type === 'customer'
  
  // 获取现有数据
  const existingContact = isEditMode 
    ? (isCustomer ? getCustomer(id!) : getSupplier(id!))
    : null

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ContactFormData>({
    defaultValues: existingContact ? {
      name: existingContact.name,
      code: existingContact.code,
      contactPerson: existingContact.contactPerson || '',
      phone: existingContact.phone || '',
      address: existingContact.address || '',
      type: existingContact.type as CustomerType | SupplierType,
      status: existingContact.status as CustomerStatus | SupplierStatus,
      creditLimit: (existingContact as Customer).creditLimit,
      settlementCycle: (existingContact as Supplier).settlementCycle,
      remark: existingContact.remark || '',
    } : {
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      address: '',
      type: isCustomer ? '直客' : '厂家',
      status: isCustomer ? '正常' : '合作中',
      creditLimit: undefined,
      settlementCycle: '现结',
      remark: '',
    },
  })

  // 加载编辑模式的数据
  useEffect(() => {
    if (isEditMode && existingContact) {
      setValue('name', existingContact.name)
      setValue('code', existingContact.code)
      setValue('contactPerson', existingContact.contactPerson || '')
      setValue('phone', existingContact.phone || '')
      setValue('address', existingContact.address || '')
      setValue('type', existingContact.type as CustomerType | SupplierType)
      setValue('status', existingContact.status as CustomerStatus | SupplierStatus)
      if (isCustomer) {
        setValue('creditLimit', (existingContact as Customer).creditLimit)
      } else {
        setValue('settlementCycle', (existingContact as Supplier).settlementCycle)
      }
      setValue('remark', existingContact.remark || '')
    }
  }, [isEditMode, existingContact, isCustomer, setValue])

  const onSubmit = (data: ContactFormData) => {
    if (isCustomer) {
      const customerData = {
        name: data.name,
        code: data.code,
        contactPerson: data.contactPerson,
        phone: data.phone,
        address: data.address,
        type: data.type as CustomerType,
        creditLimit: data.creditLimit,
        status: data.status as CustomerStatus,
        remark: data.remark,
      }
      
      if (isEditMode && id) {
        updateCustomer(id, customerData)
      } else {
        addCustomer(customerData)
      }
    } else {
      const supplierData = {
        name: data.name,
        code: data.code,
        contactPerson: data.contactPerson,
        phone: data.phone,
        address: data.address,
        type: data.type as SupplierType,
        settlementCycle: data.settlementCycle!,
        status: data.status as SupplierStatus,
        remark: data.remark,
      }
      
      if (isEditMode && id) {
        updateSupplier(id, supplierData)
      } else {
        addSupplier(supplierData)
      }
    }
    
    navigate('/customer')
  }

  const contactType = watch('type')
  const contactStatus = watch('status')

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customer')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? '编辑' : '新增'}{isCustomer ? '客户' : '供应商'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode ? '修改' : '添加'}{isCustomer ? '客户' : '供应商'}基本信息
          </p>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <Input
              label={`${isCustomer ? '客户' : '供应商'}名称 *`}
              {...register('name', { required: `${isCustomer ? '客户' : '供应商'}名称不能为空` })}
              error={errors.name?.message}
            />
            <Input
              label={`${isCustomer ? '客户' : '供应商'}编码 *`}
              {...register('code', { required: `${isCustomer ? '客户' : '供应商'}编码不能为空` })}
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

        {/* 客户/供应商特有字段 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">业务信息</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {isCustomer ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    客户类型 *
                  </label>
                  <select
                    {...register('type', { required: '客户类型不能为空' })}
                    className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.type ? 'border-danger-500' : 'border-gray-200'
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
                    className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.status ? 'border-danger-500' : 'border-gray-200'
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
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    供应商类型 *
                  </label>
                  <select
                    {...register('type', { required: '供应商类型不能为空' })}
                    className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.type ? 'border-danger-500' : 'border-gray-200'
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
                    className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.status ? 'border-danger-500' : 'border-gray-200'
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
                    className={`w-full px-3 py-2 h-9 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.settlementCycle ? 'border-danger-500' : 'border-gray-200'
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
              </>
            )}
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

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-4">
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
            className="px-6 py-2"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ContactForm

