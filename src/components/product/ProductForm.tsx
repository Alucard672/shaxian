import { useForm } from 'react-hook-form'
import { ProductFormData, ProductType } from '@/types/product'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { X } from 'lucide-react'

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}

const productTypes: { value: ProductType; label: string }[] = [
  { value: '原料', label: '原料' },
  { value: '半成品', label: '半成品' },
  { value: '成品', label: '成品' },
]

const units = [
  { value: '公斤', label: '公斤' },
  { value: '吨', label: '吨' },
  { value: '包', label: '包' },
  { value: '件', label: '件' },
]

function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: initialData || {
      name: '',
      code: '',
      specification: '',
      composition: '',
      count: '',
      unit: '公斤',
      type: '成品',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="商品名称 *"
          {...register('name', { required: '商品名称不能为空' })}
          error={errors.name?.message}
        />
        <Input
          label="商品编码 *"
          {...register('code', { required: '商品编码不能为空' })}
          error={errors.code?.message}
        />
        <Input
          label="规格"
          placeholder="如：32支"
          {...register('specification')}
        />
        <Input
          label="成分"
          placeholder="如：100%棉"
          {...register('composition')}
        />
        <Input
          label="支数"
          placeholder="如：32s"
          {...register('count')}
        />
        <Select
          label="单位 *"
          options={units}
          {...register('unit', { required: '请选择单位' })}
          error={errors.unit?.message}
        />
        <Select
          label="商品类型 *"
          options={productTypes}
          {...register('type', { required: '请选择商品类型' })}
          error={errors.type?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  )
}

export default ProductForm


