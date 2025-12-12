import { useState } from 'react'
import CustomerManagement from '../customer/CustomerManagement'
import SupplierManagement from '../supplier/SupplierManagement'

type ContactTab = 'customer' | 'supplier'

function ContactManagement() {
  const [activeTab, setActiveTab] = useState<ContactTab>('customer')

  return (
    <div className="space-y-6">
      {/* 标签页切换 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('customer')}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'customer'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          客户管理
        </button>
        <button
          onClick={() => setActiveTab('supplier')}
          className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'supplier'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          供应商管理
        </button>
      </div>

      {/* 内容区域 */}
      {activeTab === 'customer' ? <CustomerManagement /> : <SupplierManagement />}
    </div>
  )
}

export default ContactManagement
