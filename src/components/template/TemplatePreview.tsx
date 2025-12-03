import { X, FileText } from 'lucide-react'
import { PrintTemplateFormData } from '@/types/template'
import { format } from 'date-fns'

interface TemplatePreviewProps {
  template: PrintTemplateFormData
  isOpen: boolean
  onClose: () => void
}

function TemplatePreview({ template, isOpen, onClose }: TemplatePreviewProps) {
  if (!isOpen) return null

  // 模拟数据（根据图片样式）
  const mockData = {
    documentNumber: 'SO-2025120001',
    documentDate: '2025-12-01',
    printDate: '2025/12/02',
    customerName: template.documentType === '销售单' ? '杭州纺织有限公司' : '供应商B公司',
    contactPerson: '张经理',
    contactPhone: '138-0000-0000',
    deliveryAddress: '浙江省杭州市余杭区创新路88号',
    items: [
      {
        productName: '2/16NM 走锭全毛',
        colorCode: '218003浅米',
        batchCode: 'B013018',
        quantity: 0.71,
        unitPrice: 138.00,
        amount: 97.98,
        remark: '125kg批色',
      },
      {
        productName: '涤纶短纤20支',
        colorCode: 'C102 宝蓝',
        batchCode: 'P2025002',
        quantity: 300,
        unitPrice: 38.50,
        amount: 11550.00,
        remark: '加急',
      },
      {
        productName: '精梳棉纱40支',
        colorCode: 'C005 米白',
        batchCode: 'P2025003',
        quantity: 200,
        unitPrice: 52.00,
        amount: 10400.00,
        remark: '',
      },
    ],
    totalAmount: 44450.00,
    paidAmount: 20000.00,
    unpaidAmount: 24450.00,
    paymentInfo: '微信支付',
    creator: '王小明',
    handler: '李经理',
    companyInfo: {
      name: '织云ERP纺织门店',
      address: '浙江省杭州市余杭区创新路99号',
      phone: '0571-88888888',
      contact: '李经理',
      notice: '织云ERP·本单具有合同效力',
    },
  }

  // 计算页面尺寸（转换为像素，1mm ≈ 3.779527559px）
  const mmToPx = (mm: number) => mm * 3.779527559
  const pageWidth = mmToPx(template.pageSettings.width)
  const pageHeight = mmToPx(template.pageSettings.height)

  // 计算内容区域
  const contentStyle = {
    width: `${pageWidth - mmToPx(template.pageSettings.marginLeft + template.pageSettings.marginRight)}px`,
    minHeight: `${pageHeight - mmToPx(template.pageSettings.marginTop + template.pageSettings.marginBottom)}px`,
    paddingTop: `${mmToPx(template.pageSettings.marginTop)}px`,
    paddingRight: `${mmToPx(template.pageSettings.marginRight)}px`,
    paddingBottom: `${mmToPx(template.pageSettings.marginBottom)}px`,
    paddingLeft: `${mmToPx(template.pageSettings.marginLeft)}px`,
  }

  // 判断是否为三联单
  const isTriple = template.type === '三联单'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-6xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">打印模板预览</h2>
              <p className="text-sm text-gray-500">实时预览模板打印效果</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 预览内容区域 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="flex justify-center">
            {/* 模拟纸张 */}
            <div
              className="bg-white shadow-lg"
              style={{
                width: `${pageWidth}px`,
                minHeight: `${pageHeight}px`,
              }}
            >
              {/* 内容区域 */}
              <div
                className="flex flex-col"
                style={{
                  ...contentStyle,
                  fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
                }}
              >
                {/* 三联单标记 */}
                {isTriple && (
                  <div className="text-xs text-gray-500 mb-2 border-b border-gray-300 pb-1">
                    存根联（第一联）
                  </div>
                )}

                {/* 标题 */}
                {template.titleSettings.enabled && template.titleSettings.text && (
                  <div
                    className="font-bold text-gray-900 mb-4"
                    style={{
                      fontSize: `${template.titleSettings.fontSize}px`,
                      textAlign: template.titleSettings.align,
                      lineHeight: '1.5',
                    }}
                  >
                    {template.titleSettings.text}
                    {template.titleSettings.text.includes('销售') && !template.titleSettings.text.includes('代合同') && '（代合同代欠条）'}
                  </div>
                )}

                {/* 顶部信息行 */}
                <div className="flex justify-between items-start mb-4 text-sm">
                  <div className="flex-1">
                    {/* 客户信息 */}
                    {template.basicInfoFields.customerName && (
                      <div className="mb-2">
                        <span className="text-gray-900 font-medium">客户：</span>
                        <span className="text-gray-900 ml-2">{mockData.customerName}</span>
                      </div>
                    )}
                    {template.basicInfoFields.contactPerson && (
                      <div className="mb-2">
                        <span className="text-gray-900 font-medium">联系人：</span>
                        <span className="text-gray-900 ml-2">{mockData.contactPerson}</span>
                      </div>
                    )}
                    {template.basicInfoFields.contactPhone && (
                      <div className="mb-2">
                        <span className="text-gray-900 font-medium">电话：</span>
                        <span className="text-gray-900 ml-2">{mockData.contactPhone}</span>
                      </div>
                    )}
                    {template.basicInfoFields.deliveryAddress && (
                      <div className="mb-2">
                        <span className="text-gray-900 font-medium">地址：</span>
                        <span className="text-gray-900 ml-2">{mockData.deliveryAddress}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm space-y-1">
                    {template.basicInfoFields.documentDate && (
                      <div>
                        <span className="text-gray-900 font-medium">单据日期：</span>
                        <span className="text-gray-900">{mockData.documentDate}</span>
                      </div>
                    )}
                    {template.basicInfoFields.printDate && (
                      <div>
                        <span className="text-gray-900 font-medium">打印：</span>
                        <span className="text-gray-900">{mockData.printDate}</span>
                      </div>
                    )}
                    {template.basicInfoFields.documentNumber && (
                      <div>
                        <span className="text-gray-900 font-medium">NO：</span>
                        <span className="text-gray-900">{mockData.documentNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 商品明细表格 */}
                {template.productFields.showTable && (
                  <div className="mb-4">
                    <table className="w-full text-sm border-collapse" style={{ border: '1px solid #000' }}>
                      <thead>
                        <tr className="bg-gray-50" style={{ borderBottom: '1px solid #000' }}>
                          <th className="px-2 py-2 text-left font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                            序号
                          </th>
                          {template.productFields.productName && (
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              商品名称
                            </th>
                          )}
                          {template.productFields.colorCode && (
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              色号
                            </th>
                          )}
                          {template.productFields.quantity && (
                            <th className="px-2 py-2 text-center font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              数量
                            </th>
                          )}
                          {template.productFields.unitPrice && (
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              单价
                            </th>
                          )}
                          {template.productFields.amount && (
                            <th className="px-2 py-2 text-right font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              金额
                            </th>
                          )}
                          {template.productFields.batchCode && (
                            <th className="px-2 py-2 text-left font-semibold text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              批号
                            </th>
                          )}
                          {template.productFields.remark && (
                            <th className="px-2 py-2 text-left font-semibold text-gray-900">
                              备注
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {mockData.items.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #000' }}>
                            <td className="px-2 py-2 text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                              {index + 1}
                            </td>
                            {template.productFields.productName && (
                              <td className="px-2 py-2 text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                {item.productName}
                              </td>
                            )}
                            {template.productFields.colorCode && (
                              <td className="px-2 py-2 text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                {item.colorCode}
                              </td>
                            )}
                            {template.productFields.quantity && (
                              <td className="px-2 py-2 text-center text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                {item.quantity}
                              </td>
                            )}
                            {template.productFields.unitPrice && (
                              <td className="px-2 py-2 text-right text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                ¥{item.unitPrice.toFixed(2)}
                              </td>
                            )}
                            {template.productFields.amount && (
                              <td className="px-2 py-2 text-right text-gray-900 font-medium border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                ¥{item.amount.toFixed(2)}
                              </td>
                            )}
                            {template.productFields.batchCode && (
                              <td className="px-2 py-2 text-gray-900 border-r border-black" style={{ borderRight: '1px solid #000' }}>
                                {item.batchCode}
                              </td>
                            )}
                            {template.productFields.remark && (
                              <td className="px-2 py-2 text-gray-900">{item.remark || ''}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 合计信息 */}
                <div className="mb-4 text-sm">
                  <div className="flex justify-end space-x-8 mb-2">
                    {template.summaryFields.totalAmount && (
                      <div>
                        <span className="text-gray-900 font-medium">合计：</span>
                        <span className="text-gray-900 font-bold ml-2">¥{mockData.totalAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  {template.summaryFields.paymentInfo && (
                    <div className="flex justify-end space-x-8 mb-2">
                      <div>
                        <span className="text-gray-900 font-medium">已付：</span>
                        <span className="text-gray-900 ml-2">¥{mockData.paidAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">欠款：</span>
                        <span className="text-gray-900 ml-2">¥{mockData.unpaidAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">付款方式：</span>
                        <span className="text-gray-900 ml-2">{mockData.paymentInfo}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 签名区域 */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  {template.summaryFields.creator && (
                    <div>
                      <span className="text-gray-900 font-medium">制单：</span>
                      <span className="text-gray-900 ml-2">{mockData.creator}</span>
                    </div>
                  )}
                  {template.summaryFields.handler && (
                    <div>
                      <span className="text-gray-900 font-medium">经手：</span>
                      <span className="text-gray-900 ml-2">{mockData.handler}</span>
                    </div>
                  )}
                  {template.summaryFields.customerSign && (
                    <div>
                      <span className="text-gray-900 font-medium">客户签收：</span>
                      <div className="mt-8 border-b border-gray-400"></div>
                    </div>
                  )}
                </div>

                {/* 公司信息和二维码 */}
                <div className="mt-auto pt-4 border-t border-gray-400 flex items-start justify-between">
                  {/* 公司信息 */}
                  {template.otherElements.companyInfo && (
                    <div className="text-xs text-gray-900 space-y-1 flex-1">
                      <div className="font-medium">{mockData.companyInfo.name}：{mockData.companyInfo.address}</div>
                      <div>电话：{mockData.companyInfo.phone}</div>
                      <div>联系人：{mockData.companyInfo.contact}</div>
                      {mockData.companyInfo.notice && (
                        <div className="font-medium mt-2">{mockData.companyInfo.notice}</div>
                      )}
                    </div>
                  )}
                  {/* 二维码区域 */}
                  {template.otherElements.qrcode && (
                    <div className="flex items-end gap-2 ml-4">
                      {Array.from({ length: template.otherElements.qrcodeCount || 1 }).map((_, index) => (
                        <div
                          key={index}
                          className="w-16 h-16 bg-gray-200 border-2 flex items-center justify-center text-xs text-gray-500"
                          style={{ borderColor: '#ef4444' }}
                        >
                          二维码{index + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 页码 */}
                {template.otherElements.pageNumber && (
                  <div className="text-center text-xs text-gray-500 mt-4">第 1 页</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 text-sm text-gray-600">
          <p>这是打印模板的预览效果，实际打印时会使用真实的单据数据</p>
        </div>
      </div>
    </div>
  )
}

export default TemplatePreview
