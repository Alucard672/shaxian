import { useForm } from 'react-hook-form'
import { BatchFormData } from '@/types/product'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'

interface BatchFormProps {
  initialData?: Partial<BatchFormData>
  onSubmit: (data: BatchFormData) => void
  onCancel: () => void
}

function BatchForm({ initialData, onSubmit, onCancel }: BatchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchFormData>({
    defaultValues: initialData || {
      code: '',
      productionDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      purchasePrice: 0,
      initialQuantity: 0,
      stockLocation: '',
      remark: '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="缸号编码 *"
          {...register('code', { required: '缸号编码不能为空' })}
          error={errors.code?.message}
        />
        <Input
          label="生产日期 *"
          type="date"
          {...register('productionDate', { required: '生产日期不能为空' })}
          error={errors.productionDate?.message}
        />
        <Input
          label="供应商ID"
          {...register('supplierId')}
        />
        <Input
          label="采购单价"
          type="number"
          step="0.01"
          {...register('purchasePrice', { valueAsNumber: true })}
        />
        <Input
          label="初始数量 *"
          type="number"
          step="0.01"
          {...register('initialQuantity', {
            required: '初始数量不能为空',
            valueAsNumber: true,
            min: { value: 0, message: '数量不能小于0' },
          })}
          error={errors.initialQuantity?.message}
        />
        <Input
          label="库存位置"
          {...register('stockLocation')}
        />
        <div className="md:col-span-2">
          <Textarea
            label="备注"
            {...register('remark')}
          />
        </div>
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

export default BatchForm









