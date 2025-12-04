import { useState } from 'react'
import Card from '../../components/ui/Card'
import { BookOpen, ChevronRight, ChevronDown, Package, ShoppingCart, DollarSign, Palette, BarChart3, Printer, CreditCard, Users, FileText, LayoutDashboard } from 'lucide-react'
import { cn } from '@/utils/cn'
import { TutorialModule } from '@/types/tutorial'

// 教程数据
const tutorialModules: TutorialModule[] = [
  {
    id: 'dashboard',
    name: '工作台',
    icon: 'LayoutDashboard',
    description: '查看系统概览和关键指标',
    flows: [
      {
        id: 'overview',
        name: '工作台概览',
        description: '了解工作台的功能和布局',
        steps: [
          {
            id: 'view-stats',
            title: '查看统计数据',
            description: '在工作台顶部查看关键业务指标',
            details: [
              '工作台显示今日销售、进货、库存等关键数据',
              '每个统计卡片显示具体数值和变化趋势',
              '点击卡片可跳转到对应的详细页面'
            ]
          },
          {
            id: 'view-charts',
            title: '查看图表分析',
            description: '通过图表了解业务趋势',
            details: [
              '销售趋势图显示最近一段时间的销售情况',
              '商品销售排行显示最受欢迎的商品',
              '客户销售分布图显示客户贡献度'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'product',
    name: '商品管理',
    icon: 'Package',
    description: '管理商品、色号、缸号信息',
    flows: [
      {
        id: 'create-product',
        name: '创建商品',
        description: '添加新商品到系统',
        steps: [
          {
            id: 'step1',
            title: '打开商品管理页面',
            description: '点击左侧菜单"商品管理"',
            details: [
              '在左侧导航栏找到"商品管理"菜单项',
              '点击进入商品管理页面'
            ]
          },
          {
            id: 'step2',
            title: '点击新建商品',
            description: '点击页面右上角的"新建商品"按钮',
            details: [
              '在商品列表页面右上角找到"新建商品"按钮',
              '点击按钮打开商品创建弹窗'
            ]
          },
          {
            id: 'step3',
            title: '填写商品基础信息',
            description: '填写商品的基本信息',
            details: [
              '商品编码：输入唯一的商品编码（必填）',
              '商品名称：输入商品名称（必填）',
              '规格、成分、支数：根据需要填写（可选）',
              '单位：选择商品单位，如kg、ton等',
              '商品类型：选择成品或原料',
              '如果商品是白坯纱线，勾选"白坯纱线"选项（需先启用染色加工流程）'
            ]
          },
          {
            id: 'step4',
            title: '保存商品',
            description: '点击右上角"保存商品"按钮',
            details: [
              '确认信息无误后，点击右上角"保存商品"按钮',
              '商品创建成功后会自动关闭弹窗',
              '新商品会出现在商品列表中'
            ]
          }
        ]
      },
      {
        id: 'add-color',
        name: '添加色号',
        description: '为商品添加色号',
        steps: [
          {
            id: 'step1',
            title: '选择商品',
            description: '在商品列表中找到要添加色号的商品',
            details: [
              '在商品管理页面找到目标商品',
              '点击商品行的"操作"列中的"编辑"按钮'
            ]
          },
          {
            id: 'step2',
            title: '进入色号管理',
            description: '在商品编辑弹窗中找到色号管理区域',
            details: [
              '在商品编辑弹窗中，找到"色号管理"区域',
              '该区域位于商品基础信息下方'
            ]
          },
          {
            id: 'step3',
            title: '添加色号信息',
            description: '填写色号信息并添加',
            details: [
              '色号编码：输入色号的唯一编码',
              '色号名称：输入色号的名称',
              '色号描述：可选，输入色号的详细描述',
              '点击"添加色号"按钮将色号添加到列表中'
            ]
          },
          {
            id: 'step4',
            title: '保存商品',
            description: '保存商品以保存色号信息',
            details: [
              '添加完所有色号后，点击右上角"保存商品"按钮',
              '色号信息会与商品一起保存'
            ]
          }
        ]
      },
      {
        id: 'add-batch',
        name: '添加缸号',
        description: '为色号添加缸号（批次）',
        steps: [
          {
            id: 'step1',
            title: '选择商品和色号',
            description: '在商品列表中进入商品编辑',
            details: [
              '找到要添加缸号的商品',
              '点击"编辑"按钮打开编辑弹窗',
              '确保该商品已有色号（缸号必须关联到色号）'
            ]
          },
          {
            id: 'step2',
            title: '进入缸号管理',
            description: '在商品编辑弹窗中找到缸号管理区域',
            details: [
              '在"色号管理"区域下方找到"缸号管理"区域',
              '缸号管理区域会显示已添加的色号列表'
            ]
          },
          {
            id: 'step3',
            title: '选择色号并添加缸号',
            description: '为指定色号添加缸号',
            details: [
              '在色号列表中选择要添加缸号的色号',
              '点击色号右侧的"添加缸号"按钮',
              '填写缸号信息：缸号编码、生产日期、供应商、采购价格、初始数量、库存位置等',
              '点击"保存"按钮添加缸号'
            ]
          },
          {
            id: 'step4',
            title: '保存商品',
            description: '保存商品以保存缸号信息',
            details: [
              '添加完所有缸号后，点击右上角"保存商品"按钮',
              '缸号信息会与商品一起保存'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'purchase',
    name: '进货管理',
    icon: 'ShoppingCart',
    description: '管理进货单和供应商信息',
    flows: [
      {
        id: 'create-purchase',
        name: '创建进货单',
        description: '创建新的进货单并入库',
        steps: [
          {
            id: 'step1',
            title: '打开进货管理页面',
            description: '点击左侧菜单"进货管理"',
            details: [
              '在左侧导航栏找到"进货管理"菜单项',
              '点击进入进货管理页面'
            ]
          },
          {
            id: 'step2',
            title: '点击新建进货单',
            description: '点击页面右上角的"新建进货单"按钮',
            details: [
              '在进货单列表页面右上角找到"新建进货单"按钮',
              '点击按钮打开进货单创建弹窗'
            ]
          },
          {
            id: 'step3',
            title: '填写基础信息',
            description: '填写进货单的基本信息',
            details: [
              '供应商：选择或输入供应商（必填）',
              '进货日期：选择进货日期',
              '预计到货日期：可选，选择预计到货日期',
              '仓库：选择入库仓库',
              '备注：可选，输入备注信息'
            ]
          },
          {
            id: 'step4',
            title: '添加商品明细',
            description: '添加要进货的商品',
            details: [
              '在"商品明细"区域点击"添加商品"按钮',
              '选择商品、色号、缸号（如果商品已有缸号）',
              '填写数量、单价、生产日期、库存位置等信息',
              '系统会自动计算金额',
              '可以添加多个商品明细'
            ]
          },
          {
            id: 'step5',
            title: '保存并入库',
            description: '保存进货单并完成入库',
            details: [
              '确认信息无误后，点击右上角"保存并入库"按钮',
              '系统会自动创建缸号（如果选择的是色号）',
              '自动增加库存数量',
              '如果有欠款，会自动生成应付账款',
              '进货单状态变为"已入库"'
            ]
          },
          {
            id: 'step6',
            title: '保存草稿（可选）',
            description: '如果暂时不完成入库，可以保存草稿',
            details: [
              '点击右上角"保存草稿"按钮',
              '进货单会保存为草稿状态',
              '后续可以编辑并完成入库'
            ]
          }
        ]
      },
      {
        id: 'edit-purchase',
        name: '编辑进货单',
        description: '修改已创建的进货单',
        steps: [
          {
            id: 'step1',
            title: '找到要编辑的进货单',
            description: '在进货单列表中找到目标进货单',
            details: [
              '在进货管理页面找到要编辑的进货单',
              '只有"草稿"状态的进货单可以编辑'
            ]
          },
          {
            id: 'step2',
            title: '点击编辑',
            description: '点击进货单行的"编辑"按钮',
            details: [
              '在进货单行的"操作"列中找到"编辑"按钮',
              '点击按钮打开编辑弹窗'
            ]
          },
          {
            id: 'step3',
            title: '修改信息',
            description: '修改进货单的信息',
            details: [
              '可以修改供应商、日期、仓库等基础信息',
              '可以添加、删除、修改商品明细',
              '修改数量、单价等信息'
            ]
          },
          {
            id: 'step4',
            title: '保存修改',
            description: '保存修改后的进货单',
            details: [
              '如果还是草稿状态，可以继续保存草稿',
              '如果点击"保存并入库"，会完成入库操作',
              '已入库的进货单不能再编辑'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'sales',
    name: '销售管理',
    icon: 'DollarSign',
    description: '管理销售单和客户信息',
    flows: [
      {
        id: 'create-sales',
        name: '创建销售单',
        description: '创建新的销售单并出库',
        steps: [
          {
            id: 'step1',
            title: '打开销售管理页面',
            description: '点击左侧菜单"销售管理"',
            details: [
              '在左侧导航栏找到"销售管理"菜单项',
              '点击进入销售管理页面'
            ]
          },
          {
            id: 'step2',
            title: '点击新建销售单',
            description: '点击页面右上角的"新建销售单"按钮',
            details: [
              '在销售单列表页面右上角找到"新建销售单"按钮',
              '点击按钮打开销售单创建弹窗'
            ]
          },
          {
            id: 'step3',
            title: '填写基础信息',
            description: '填写销售单的基本信息',
            details: [
              '客户：选择或输入客户（必填）',
              '销售日期：选择销售日期',
              '仓库：选择出库仓库',
              '备注：可选，输入备注信息'
            ]
          },
          {
            id: 'step4',
            title: '添加商品明细',
            description: '添加要销售的商品',
            details: [
              '在"商品明细"区域点击"添加商品"按钮',
              '选择商品、色号、缸号',
              '系统会自动检查库存是否充足',
              '填写数量、单价等信息',
              '系统会自动计算金额',
              '可以添加多个商品明细'
            ]
          },
          {
            id: 'step5',
            title: '保存销售单',
            description: '保存销售单并完成出库',
            details: [
              '确认信息无误后，点击右上角"保存销售单"按钮',
              '系统会自动减少库存数量',
              '如果有欠款，会自动生成应收账款',
              '销售单状态变为"已出库"'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'dyeing',
    name: '染色加工',
    icon: 'Palette',
    description: '管理染色加工单',
    flows: [
      {
        id: 'create-dyeing',
        name: '创建加工单',
        description: '创建新的染色加工单',
        steps: [
          {
            id: 'step1',
            title: '启用染色加工流程',
            description: '在系统设置中启用染色加工流程',
            details: [
              '进入"系统设置" > "参数设置"',
              '开启"染色加工流程"开关',
              '如果不启用，染色加工菜单不会显示'
            ]
          },
          {
            id: 'step2',
            title: '打开染色加工页面',
            description: '点击左侧菜单"染色加工"',
            details: [
              '在左侧导航栏找到"染色加工"菜单项',
              '点击进入染色加工页面'
            ]
          },
          {
            id: 'step3',
            title: '点击新建加工单',
            description: '点击页面右上角的"新建加工单"按钮',
            details: [
              '在加工单列表页面右上角找到"新建加工单"按钮',
              '点击按钮打开加工单创建弹窗'
            ]
          },
          {
            id: 'step4',
            title: '选择白坯缸号',
            description: '选择要加工的白坯纱线',
            details: [
              '在"白坯信息"区域选择白坯缸号',
              '只能选择标记为"白坯纱线"的商品',
              '系统会显示该缸号的库存数量'
            ]
          },
          {
            id: 'step5',
            title: '添加染色明细',
            description: '添加要染成的色号和数量',
            details: [
              '在"染色明细"区域点击"添加明细"按钮',
              '选择目标色号（必须是已存在的色号）',
              '填写数量（不能超过白坯库存）',
              '可以添加多个染色明细',
              '系统会自动计算总数量'
            ]
          },
          {
            id: 'step6',
            title: '填写加工信息',
            description: '填写加工厂、加工日期等信息',
            details: [
              '加工厂：选择供应商作为加工厂',
              '加工日期：选择加工日期',
              '加工单价：输入加工单价（可选）',
              '备注：可选，输入备注信息'
            ]
          },
          {
            id: 'step7',
            title: '创建加工单',
            description: '保存加工单',
            details: [
              '确认信息无误后，点击右上角"创建加工单"按钮',
              '加工单创建成功，状态为"进行中"',
              '白坯库存会相应减少'
            ]
          },
          {
            id: 'step8',
            title: '完成加工并入库',
            description: '加工完成后进行入库',
            details: [
              '在加工单详情页面，点击"入库"按钮',
              '选择入库仓库',
              '系统会为每个染色明细创建新的缸号',
              '新缸号会增加到库存中',
              '加工单状态变为"已完成"'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'inventory',
    name: '库存管理',
    icon: 'BarChart3',
    description: '查看库存、调整库存、盘点',
    flows: [
      {
        id: 'view-inventory',
        name: '查看库存',
        description: '查看当前库存情况',
        steps: [
          {
            id: 'step1',
            title: '打开库存管理页面',
            description: '点击左侧菜单"库存管理"',
            details: [
              '在左侧导航栏找到"库存管理"菜单项',
              '点击进入库存管理页面'
            ]
          },
          {
            id: 'step2',
            title: '查看库存列表',
            description: '浏览所有商品的库存信息',
            details: [
              '页面显示所有商品的库存明细',
              '包括商品名称、色号、缸号、库存数量、库存位置等信息',
              '可以使用搜索框搜索特定商品',
              '可以按商品、色号、缸号筛选'
            ]
          },
          {
            id: 'step3',
            title: '查看库存详情',
            description: '查看单个库存批次的详细信息',
            details: [
              '点击库存行的"查看详情"按钮（眼睛图标）',
              '可以查看该批次的详细信息',
              '包括采购价格、总价值、生产日期、供应商等',
              '还可以查看同色号的其他批次'
            ]
          }
        ]
      },
      {
        id: 'adjust-inventory',
        name: '库存调整',
        description: '调整库存数量',
        steps: [
          {
            id: 'step1',
            title: '打开库存调整页面',
            description: '进入库存调整列表',
            details: [
              '在库存管理页面，点击"库存调整"标签',
              '或直接访问"库存管理" > "库存调整"'
            ]
          },
          {
            id: 'step2',
            title: '点击新建调整单',
            description: '创建新的库存调整单',
            details: [
              '点击页面右上角的"新建调整单"按钮',
              '打开调整单创建弹窗'
            ]
          },
          {
            id: 'step3',
            title: '选择调整类型',
            description: '选择要进行的调整类型',
            details: [
              '盘盈：库存增加',
              '盘亏：库存减少',
              '报损：商品损坏导致的库存减少',
              '报溢：商品溢余导致的库存增加',
              '调拨：从一个仓库转移到另一个仓库',
              '其他：其他类型的调整'
            ]
          },
          {
            id: 'step4',
            title: '填写调整信息',
            description: '填写调整单的基本信息',
            details: [
              '调整日期：选择调整日期',
              '调整仓库：选择要调整的仓库',
              '备注：可选，输入调整原因'
            ]
          },
          {
            id: 'step5',
            title: '添加调整明细',
            description: '添加要调整的商品',
            details: [
              '点击"添加明细"按钮',
              '依次选择款号（商品）、色号、缸号',
              '填写调整数量（正数表示增加，负数表示减少）',
              '可以添加多个调整明细'
            ]
          },
          {
            id: 'step6',
            title: '提交调整',
            description: '保存并完成调整',
            details: [
              '确认信息无误后，点击右上角"提交完成"按钮',
              '系统会自动更新库存数量',
              '调整单状态变为"已完成"',
              '也可以先保存草稿，后续再提交'
            ]
          }
        ]
      },
      {
        id: 'inventory-check',
        name: '库存盘点',
        description: '进行库存盘点',
        steps: [
          {
            id: 'step1',
            title: '打开盘点单页面',
            description: '进入盘点单列表',
            details: [
              '在库存管理页面，点击"库存盘点"标签',
              '或直接访问"库存管理" > "库存盘点"'
            ]
          },
          {
            id: 'step2',
            title: '点击新建盘点单',
            description: '创建新的盘点计划',
            details: [
              '点击页面右上角的"新建盘点单"按钮',
              '打开盘点单创建弹窗'
            ]
          },
          {
            id: 'step3',
            title: '填写盘点信息',
            description: '填写盘点单的基本信息',
            details: [
              '盘点名称：输入盘点名称，如"12月月度盘点"',
              '盘点仓库：选择要盘点的仓库',
              '计划日期：选择计划盘点日期',
              '备注说明：可选，输入备注信息'
            ]
          },
          {
            id: 'step4',
            title: '生成盘点明细',
            description: '自动生成或手动添加盘点明细',
            details: [
              '如果启用"自动生成明细"，系统会自动生成该仓库的所有库存明细',
              '如果手动添加，可以点击"添加明细"按钮逐个添加',
              '系统会显示每个商品的账面数量'
            ]
          },
          {
            id: 'step5',
            title: '填写实际数量',
            description: '根据实际盘点结果填写数量',
            details: [
              '在盘点明细中，填写每个商品的实际盘点数量',
              '系统会自动计算差异（实际数量 - 账面数量）',
              '差异为正数表示盘盈，负数表示盘亏'
            ]
          },
          {
            id: 'step6',
            title: '预览盘点单',
            description: '预览盘点结果',
            details: [
              '点击"预览"按钮查看盘点单的详细信息',
              '可以查看盘点统计、明细列表等',
              '确认无误后关闭预览'
            ]
          },
          {
            id: 'step7',
            title: '创建盘点计划',
            description: '保存盘点单',
            details: [
              '确认信息无误后，点击右上角"创建盘点计划"按钮',
              '盘点单创建成功',
              '后续可以根据盘点结果进行库存调整'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'account',
    name: '账款管理',
    icon: 'CreditCard',
    description: '管理应收应付账款',
    flows: [
      {
        id: 'view-account',
        name: '查看账款',
        description: '查看应收应付账款',
        steps: [
          {
            id: 'step1',
            title: '打开账款管理页面',
            description: '点击左侧菜单"账款管理"',
            details: [
              '在左侧导航栏找到"账款管理"菜单项',
              '点击进入账款管理页面'
            ]
          },
          {
            id: 'step2',
            title: '选择查看类型',
            description: '选择查看应收或应付',
            details: [
              '页面顶部有"应收"和"应付"两个标签',
              '点击切换查看不同类型的账款',
              '应收：客户欠我们的钱',
              '应付：我们欠供应商的钱'
            ]
          },
          {
            id: 'step3',
            title: '查看流水',
            description: '查看所有账款流水记录',
            details: [
              '在"流水"视图中，可以看到所有账款记录',
              '包括单据号、日期、金额、已付/已收、未付/未收等信息',
              '可以按日期范围筛选',
              '可以搜索特定单位或单据'
            ]
          },
          {
            id: 'step4',
            title: '查看汇总',
            description: '按单位汇总查看账款',
            details: [
              '切换到"汇总"视图',
              '可以看到每个客户/供应商的账款汇总',
              '包括总金额、已付/已收、未付/未收',
              '点击"查看对账单"可以查看详细对账单'
            ]
          }
        ]
      },
      {
        id: 'payment',
        name: '收付款登记',
        description: '登记收款或付款',
        steps: [
          {
            id: 'step1',
            title: '打开收付款登记',
            description: '点击"收付款登记"按钮',
            details: [
              '在账款管理页面，点击右上角"收付款登记"按钮',
              '打开收付款选择弹窗'
            ]
          },
          {
            id: 'step2',
            title: '选择要收付款的账款',
            description: '从列表中选择账款',
            details: [
              '在弹窗中可以看到所有未付/未收的账款',
              '可以搜索特定单位或单据',
              '选择要收付款的账款，点击"选择"按钮'
            ]
          },
          {
            id: 'step3',
            title: '填写收付款信息',
            description: '填写收付款的详细信息',
            details: [
              '金额：输入收付款金额（不能超过未付/未收金额）',
              '付款方式：选择付款方式，如现金、银行转账等',
              '日期：选择收付款日期',
              '经手人：选择经手人',
              '备注：可选，输入备注信息'
            ]
          },
          {
            id: 'step4',
            title: '保存收付款',
            description: '保存收付款记录',
            details: [
              '确认信息无误后，点击"保存"按钮',
              '系统会自动更新账款的已付/已收金额',
              '如果金额等于未付/未收金额，账款状态变为"已结清"'
            ]
          }
        ]
      },
      {
        id: 'batch-payment',
        name: '批量收付款',
        description: '一次性处理多个账款的收付款',
        steps: [
          {
            id: 'step1',
            title: '选择多个账款',
            description: '在汇总视图中选择要收付款的单位',
            details: [
              '切换到"汇总"视图',
              '找到要收付款的单位',
              '点击"收款"或"付款"按钮',
              '打开该单位的所有未付/未收账款列表'
            ]
          },
          {
            id: 'step2',
            title: '勾选要处理的账款',
            description: '选择要一起处理的账款',
            details: [
              '在账款列表中，勾选要处理的账款',
              '可以勾选多个账款',
              '系统会显示已选择的账款数量和总金额'
            ]
          },
          {
            id: 'step3',
            title: '点击批量收付款',
            description: '打开批量收付款弹窗',
            details: [
              '点击"批量收款"或"批量付款"按钮',
              '打开批量收付款弹窗'
            ]
          },
          {
            id: 'step4',
            title: '填写收付款信息',
            description: '为每个账款填写金额',
            details: [
              '在弹窗中可以看到所有选中的账款',
              '为每个账款填写收付款金额（默认是未付/未收金额）',
              '可以修改每个账款的金额',
              '填写统一的付款方式、日期、经手人、备注'
            ]
          },
          {
            id: 'step5',
            title: '保存批量收付款',
            description: '保存所有收付款记录',
            details: [
              '确认信息无误后，点击"保存"按钮',
              '系统会为每个账款创建收付款记录',
              '自动更新所有账款的已付/已收金额'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'contact',
    name: '往来单位',
    icon: 'Users',
    description: '管理客户和供应商信息',
    flows: [
      {
        id: 'create-customer',
        name: '创建客户',
        description: '添加新客户到系统',
        steps: [
          {
            id: 'step1',
            title: '打开往来单位页面',
            description: '点击左侧菜单"往来单位"',
            details: [
              '在左侧导航栏找到"往来单位"菜单项',
              '点击进入往来单位管理页面'
            ]
          },
          {
            id: 'step2',
            title: '切换到客户标签',
            description: '选择查看客户',
            details: [
              '页面顶部有"客户"和"供应商"两个标签',
              '点击"客户"标签查看客户列表'
            ]
          },
          {
            id: 'step3',
            title: '点击新增往来单位',
            description: '点击"新增往来单位"按钮',
            details: [
              '在客户列表页面右上角找到"新增往来单位"按钮',
              '点击按钮打开客户创建页面'
            ]
          },
          {
            id: 'step4',
            title: '填写客户信息',
            description: '填写客户的基本信息',
            details: [
              '基本信息：客户名称、编码、联系人、电话、地址、邮箱',
              '业务信息：客户类型（直客/经销商）、状态（正常/冻结）、信用额度',
              '其他信息：备注'
            ]
          },
          {
            id: 'step5',
            title: '保存客户',
            description: '保存客户信息',
            details: [
              '确认信息无误后，点击右上角"保存"按钮',
              '客户创建成功，会出现在客户列表中'
            ]
          }
        ]
      },
      {
        id: 'create-supplier',
        name: '创建供应商',
        description: '添加新供应商到系统',
        steps: [
          {
            id: 'step1',
            title: '打开往来单位页面',
            description: '点击左侧菜单"往来单位"',
            details: [
              '在左侧导航栏找到"往来单位"菜单项',
              '点击进入往来单位管理页面'
            ]
          },
          {
            id: 'step2',
            title: '切换到供应商标签',
            description: '选择查看供应商',
            details: [
              '页面顶部有"客户"和"供应商"两个标签',
              '点击"供应商"标签查看供应商列表'
            ]
          },
          {
            id: 'step3',
            title: '点击新增往来单位',
            description: '点击"新增往来单位"按钮',
            details: [
              '在供应商列表页面右上角找到"新增往来单位"按钮',
              '点击按钮打开供应商创建页面'
            ]
          },
          {
            id: 'step4',
            title: '填写供应商信息',
            description: '填写供应商的基本信息',
            details: [
              '基本信息：供应商名称、编码、联系人、电话、地址、邮箱',
              '业务信息：供应商类型（厂家/贸易商）、状态（正常/冻结）、结算周期（现结/月结/季结）',
              '其他信息：备注'
            ]
          },
          {
            id: 'step5',
            title: '保存供应商',
            description: '保存供应商信息',
            details: [
              '确认信息无误后，点击右上角"保存"按钮',
              '供应商创建成功，会出现在供应商列表中'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'print',
    name: '打印管理',
    icon: 'Printer',
    description: '管理打印模板和打印单据',
    flows: [
      {
        id: 'create-template',
        name: '创建打印模板',
        description: '创建新的打印模板',
        steps: [
          {
            id: 'step1',
            title: '打开打印管理页面',
            description: '点击左侧菜单"打印管理"',
            details: [
              '在左侧导航栏找到"打印管理"菜单项',
              '点击进入打印管理页面'
            ]
          },
          {
            id: 'step2',
            title: '打开模板管理',
            description: '点击"模板管理"按钮',
            details: [
              '在打印管理页面，点击"模板管理"按钮',
              '打开模板管理弹窗'
            ]
          },
          {
            id: 'step3',
            title: '点击新建模板',
            description: '创建新模板',
            details: [
              '在模板管理弹窗中，点击"新建模板"按钮',
              '打开模板编辑页面'
            ]
          },
          {
            id: 'step4',
            title: '填写模板信息',
            description: '填写模板的基本信息',
            details: [
              '模板名称：输入模板名称',
              '模板类型：选择模板类型（销售单/进货单）',
              '模板描述：可选，输入模板描述'
            ]
          },
          {
            id: 'step5',
            title: '配置页面设置',
            description: '设置打印页面的参数',
            details: [
              '纸张大小：选择纸张大小，如A4',
              '单位：选择单位（mm或英寸）',
              '边距：设置上下左右边距',
              '标题：设置是否显示标题'
            ]
          },
          {
            id: 'step6',
            title: '配置字段显示',
            description: '选择要显示的字段',
            details: [
              '基本信息字段：选择要显示的基本信息字段',
              '商品明细字段：选择要显示的商品明细字段（序号、商品名称、色号、数量、单价、金额、批号、备注）',
              '明细文字对齐方式：选择明细文字的对齐方式（左对齐/居中/右对齐）',
              '汇总字段：选择要显示的汇总字段',
              '其他元素：选择是否显示签名、公司信息、二维码等'
            ]
          },
          {
            id: 'step7',
            title: '上传二维码（可选）',
            description: '如果启用了二维码，可以上传二维码图片',
            details: [
              '在"其他元素"中启用"二维码"',
              '设置二维码数量',
              '点击"上传图片"按钮上传二维码图片',
              '可以上传多个二维码',
              '也可以输入图片URL'
            ]
          },
          {
            id: 'step8',
            title: '预览模板',
            description: '预览打印效果',
            details: [
              '点击"预览"按钮查看模板的打印效果',
              '可以查看实际打印时的样式',
              '确认无误后关闭预览'
            ]
          },
          {
            id: 'step9',
            title: '保存模板',
            description: '保存模板',
            details: [
              '确认配置无误后，点击"保存模板"按钮',
              '模板保存成功，可以在模板管理中使用',
              '可以设置为默认模板'
            ]
          }
        ]
      },
      {
        id: 'print-order',
        name: '打印单据',
        description: '使用模板打印单据',
        steps: [
          {
            id: 'step1',
            title: '打开单据详情',
            description: '在单据列表中打开要打印的单据',
            details: [
              '在进货单或销售单列表中，找到要打印的单据',
              '点击"查看"按钮（眼睛图标）打开单据详情'
            ]
          },
          {
            id: 'step2',
            title: '点击打印',
            description: '在单据详情中点击打印按钮',
            details: [
              '在单据详情弹窗中，点击"打印"按钮',
              '系统会使用默认模板生成打印内容'
            ]
          },
          {
            id: 'step3',
            title: '选择打印机',
            description: '在打印对话框中选择打印机',
            details: [
              '浏览器会打开打印对话框',
              '选择要使用的打印机',
              '可以设置打印份数、页面范围等'
            ]
          },
          {
            id: 'step4',
            title: '打印',
            description: '确认并打印',
            details: [
              '确认打印设置无误后，点击"打印"按钮',
              '系统会调用系统打印机进行打印'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'report',
    name: '统计报表',
    icon: 'FileText',
    description: '查看各类业务报表',
    flows: [
      {
        id: 'view-sales-report',
        name: '查看销售报表',
        description: '查看销售相关的统计报表',
        steps: [
          {
            id: 'step1',
            title: '打开统计报表页面',
            description: '点击左侧菜单"统计报表"',
            details: [
              '在左侧导航栏找到"统计报表"菜单项',
              '点击进入统计报表页面'
            ]
          },
          {
            id: 'step2',
            title: '选择销售报表',
            description: '点击"销售报表"卡片',
            details: [
              '在报表列表中，找到"销售报表"卡片',
              '点击卡片进入销售报表页面'
            ]
          },
          {
            id: 'step3',
            title: '设置日期范围',
            description: '选择要查看的日期范围',
            details: [
              '在页面顶部，使用日期选择器选择开始日期和结束日期',
              '系统会根据日期范围筛选数据'
            ]
          },
          {
            id: 'step4',
            title: '查看统计数据',
            description: '查看销售统计数据',
            details: [
              '页面顶部显示统计卡片：总销售额、订单数、平均金额、已收款、未收款',
              '可以快速了解销售情况'
            ]
          },
          {
            id: 'step5',
            title: '查看图表分析',
            description: '通过图表分析销售趋势',
            details: [
              '销售趋势图：显示每日销售金额的变化趋势',
              '商品销售排行：显示销售额最高的商品',
              '客户销售分布：显示各客户的销售占比'
            ]
          },
          {
            id: 'step6',
            title: '查看明细数据',
            description: '查看详细的销售数据',
            details: [
              '页面底部显示销售明细表格',
              '可以查看每个销售单的详细信息',
              '可以按列排序、搜索等'
            ]
          }
        ]
      }
    ]
  }
]

function TutorialManagement() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null)

  const iconMap: Record<string, any> = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    DollarSign,
    Palette,
    BarChart3,
    Printer,
    CreditCard,
    Users,
    FileText,
  }

  return (
    <div className="space-y-6 p-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">使用教程</h1>
            <p className="text-sm text-gray-600">
              按模块和流程分类的操作指南
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：模块列表 */}
        <div className="col-span-3">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">功能模块</h3>
            <div className="space-y-2">
              {tutorialModules.map((module) => {
                const Icon = iconMap[module.icon] || Package
                const isSelected = selectedModule === module.id
                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      setSelectedModule(module.id)
                      setSelectedFlow(null)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{module.name}</div>
                      <div className="text-xs text-gray-500 truncate">{module.description}</div>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 中间：流程列表 */}
        <div className="col-span-3">
          {selectedModule && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">操作流程</h3>
              <div className="space-y-2">
                {tutorialModules
                  .find((m) => m.id === selectedModule)
                  ?.flows.map((flow) => {
                    const isSelected = selectedFlow === flow.id
                    return (
                      <button
                        key={flow.id}
                        onClick={() => setSelectedFlow(flow.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                          isSelected
                            ? 'bg-blue-50 border border-blue-200 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <div className="font-medium text-sm">{flow.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{flow.description}</div>
                      </button>
                    )
                  })}
              </div>
            </Card>
          )}
        </div>

        {/* 右侧：步骤详情 */}
        <div className="col-span-6">
          {selectedFlow && selectedModule && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {tutorialModules
                    .find((m) => m.id === selectedModule)
                    ?.flows.find((f) => f.id === selectedFlow)?.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {tutorialModules
                    .find((m) => m.id === selectedModule)
                    ?.flows.find((f) => f.id === selectedFlow)?.description}
                </p>
              </div>

              <div className="space-y-6">
                {tutorialModules
                  .find((m) => m.id === selectedModule)
                  ?.flows.find((f) => f.id === selectedFlow)
                  ?.steps.map((step, index) => (
                    <div key={step.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          <ul className="space-y-1.5">
                            {step.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-1.5">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {!selectedFlow && (
            <Card className="p-12">
              <div className="text-center text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">请选择一个操作流程查看详细步骤</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default TutorialManagement


