import { useForm } from 'react-hook-form'
import { ColorFormData, ColorStatus } from '@/types/product'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

interface ColorFormProps {
  initialData?: Partial<ColorFormData>
  onSubmit: (data: ColorFormData) => void
  onCancel: () => void
}

const colorStatuses: { value: ColorStatus; label: string }[] = [
  { value: '在售', label: '在售' },
  { value: '停售', label: '停售' },
]

function ColorForm({ initialData, onSubmit, onCancel }: ColorFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ColorFormData>({
    defaultValues: initialData || {
      code: '',
      name: '',
      colorValue: '#000000',
      description: '',
      status: '在售',
    },
  })
  
  const colorValue = watch('colorValue')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="色号编码 *"
          {...register('code', { required: '色号编码不能为空' })}
          error={errors.code?.message}
        />
        <Input
          label="色号名称 *"
          placeholder="如：天蓝色"
          {...register('name', { required: '色号名称不能为空' })}
          error={errors.name?.message}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            颜色值
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={colorValue || '#000000'}
              onChange={(e) => setValue('colorValue', e.target.value)}
              className="w-20 h-10 border border-gray-200 rounded-lg cursor-pointer"
            />
            <Input
              placeholder="#87CEEB"
              value={colorValue || ''}
              onChange={(e) => setValue('colorValue', e.target.value)}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <Input
            label="颜色描述"
            {...register('description')}
          />
        </div>
        <Select
          label="状态 *"
          options={colorStatuses}
          {...register('status', { required: '请选择状态' })}
          error={errors.status?.message}
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

export default ColorForm

