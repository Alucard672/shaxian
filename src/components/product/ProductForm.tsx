import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ProductFormData, ColorFormData } from '@/types/product'
import Button from '../ui/Button'
import { Package, Palette, Layers, Plus, Info, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}

const units = [
  { value: 'kg', label: '千克(kg)' },
  { value: 'ton', label: '吨(ton)' },
  { value: 'piece', label: '件(piece)' },
]

function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const [isWhiteYarn, setIsWhiteYarn] = useState(false)
  const [colors, setColors] = useState<ColorFormData[]>([])
  const [colorInputs, setColorInputs] = useState({
    code: '',
    name: '',
    description: '',
  })

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
      unit: 'kg',
      type: '成品',
    },
  })

  const handleAddColor = () => {
    if (!colorInputs.code || !colorInputs.name) return

    setColors([
      ...colors,
      {
        code: colorInputs.code,
        name: colorInputs.name,
        description: colorInputs.description || '',
        status: '在售',
      },
    ])
    setColorInputs({ code: '', name: '', description: '' })
  }


  const onFormSubmit = (data: ProductFormData) => {
    onSubmit({
      ...data,
      isWhiteYarn,
    })
  }

  return (
    <form id="product-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-6">
        {/* 商品基础信息区域 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">商品基础信息</h3>
          </div>

          <div className="space-y-4">
            {/* 第一行：商品编码、商品名称 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  商品编码 <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('code', { required: '商品编码不能为空' })}
                  placeholder="如: P001"
                  className={cn(
                    'w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm',
                    'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.code && 'border-red-500'
                  )}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  商品名称 <span className="text-red-500">*</span>
                </label>
                <input
          {...register('name', { required: '商品名称不能为空' })}
                  placeholder="如: 精梳棉纱"
                  className={cn(
                    'w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm',
                    'bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    errors.name && 'border-red-500'
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* 第二行：规格、支数、单位 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  规格
                </label>
                <input
                  {...register('specification')}
                  placeholder="如: 32S"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  支数
                </label>
                <input
                  {...register('count')}
                  placeholder="如: 32支"
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  单位
                </label>
                <select
                  {...register('unit', { required: '请选择单位' })}
                  className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 第三行：成分 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                成分
              </label>
              <input
          {...register('composition')}
                placeholder="如: 100%精梳棉"
                className="w-full px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 白坯纱线复选框 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWhiteYarn}
                  onChange={(e) => setIsWhiteYarn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-0.5">白坯纱线</div>
                  <div className="text-sm text-gray-600">
                    （勾选表示此商品为白坯，可用于染色加工）
                  </div>
                </div>
              </label>
            </div>

            {/* 商品描述 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                商品描述
              </label>
              <textarea
                {...register('description')}
                placeholder="填写商品的详细描述信息..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 色号管理区域 */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">色号管理</h3>
              <span className="text-sm text-gray-500">(可选)</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              批量添加
            </Button>
          </div>

          <div className="bg-white rounded-xl p-3 space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="色号编码"
                value={colorInputs.code}
                onChange={(e) => setColorInputs({ ...colorInputs, code: e.target.value })}
                className="px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="色号名称"
                value={colorInputs.name}
                onChange={(e) => setColorInputs({ ...colorInputs, name: e.target.value })}
                className="px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="颜色描述"
                value={colorInputs.description}
                onChange={(e) => setColorInputs({ ...colorInputs, description: e.target.value })}
                className="px-3 py-2 h-9 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <Button
                type="button"
                onClick={handleAddColor}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加
              </Button>
            </div>
          </div>
        </div>

        {/* 缸号管理区域 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">缸号管理</h3>
              <span className="text-sm text-gray-500">(可选，创建后可添加)</span>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center h-28">
              <Info className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 text-center">
                请先添加色号后再添加缸号
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-blue-900 mb-2">💡 快速创建提示：</div>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• 只填写商品基础信息即可快速创建</li>
                  <li>• 色号和缸号可以创建后再添加</li>
                  <li>• 也可以在这里一次性添加完整信息</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

    </form>
  )
}

export default ProductForm
