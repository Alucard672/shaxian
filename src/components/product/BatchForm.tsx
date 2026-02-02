import { useForm, Controller } from 'react-hook-form'
import { BatchFormData } from '@/types/product'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import DateInput from '../ui/DateInput'
import SelectWithAdd from '../ui/SelectWithAdd'
import { useSettingsStore } from '@/store/settingsStore'

interface BatchFormProps {
  initialData?: Partial<BatchFormData>
  onSubmit: (data: BatchFormData) => void
  onCancel: () => void
}

function BatchForm({ initialData, onSubmit, onCancel }: BatchFormProps) {
  const { systemParams } = useSettingsStore()
  const enableStockLocation = !!systemParams?.enableStockLocation
  const defaultStockLocation = systemParams?.defaultStockLocation ?? '默认仓位'
  const stockLocations = systemParams?.stockLocations ?? [defaultStockLocation]

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BatchFormData>({
    defaultValues: initialData || {
      code: '',
      productionDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      purchasePrice: 0,
      initialQuantity: 0,
      stockLocation: enableStockLocation ? defaultStockLocation : '',
      remark: '',
    },
  })

  const onFormSubmit = (data: BatchFormData) => {
    onSubmit({
      ...data,
      stockLocation: enableStockLocation ? (data.stockLocation || defaultStockLocation) : defaultStockLocation,
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="缸号编码 *"
          {...register('code', { required: '缸号编码不能为空' })}
          error={errors.code?.message}
        />
        <Controller
          name="productionDate"
          control={control}
          rules={{ required: '生产日期不能为空' }}
          render={({ field }) => (
            <DateInput
              label="生产日期"
              value={field.value}
              onChange={field.onChange}
              error={errors.productionDate?.message}
            />
          )}
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
        {enableStockLocation && (
          <Controller
            name="stockLocation"
            control={control}
            render={({ field }) => (
              <SelectWithAdd
                label="仓位"
                value={field.value || defaultStockLocation}
                onChange={(v) => field.onChange(v || defaultStockLocation)}
                options={stockLocations.map((s) => ({ value: s, label: s }))}
                searchable={false}
                allowAdd={false}
                clearable={false}
              />
            )}
          />
        )}
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












