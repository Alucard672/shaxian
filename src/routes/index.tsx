import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import PurchaseList from '../pages/purchase/PurchaseList'
import PurchaseCreate from '../pages/purchase/PurchaseCreate'
import SalesList from '../pages/sales/SalesList'
import SalesCreate from '../pages/sales/SalesCreate'
import Inventory from '../pages/inventory/Inventory'
import AccountReceivable from '../pages/account/AccountReceivable'
import AccountPayable from '../pages/account/AccountPayable'
import CustomerManagement from '../pages/contact/CustomerManagement'
import SupplierManagement from '../pages/contact/SupplierManagement'
import PrintManagement from '../pages/print/PrintManagement'
import ReportManagement from '../pages/report/ReportManagement'
import ProductManagement from '../pages/product/ProductManagement'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      
      {/* 进货管理 */}
      <Route path="/purchase" element={<PurchaseList />} />
      <Route path="/purchase/create" element={<PurchaseCreate />} />
      
      {/* 销售管理 */}
      <Route path="/sales" element={<SalesList />} />
      <Route path="/sales/create" element={<SalesCreate />} />
      
      {/* 库存管理 */}
      <Route path="/inventory" element={<Inventory />} />
      
      {/* 账款管理 */}
      <Route path="/account/receivable" element={<AccountReceivable />} />
      <Route path="/account/payable" element={<AccountPayable />} />
      
      {/* 客户与供应商 */}
      <Route path="/customer" element={<CustomerManagement />} />
      <Route path="/supplier" element={<SupplierManagement />} />
      
      {/* 打单管理 */}
      <Route path="/print" element={<PrintManagement />} />
      
      {/* 统计报表 */}
      <Route path="/report" element={<ReportManagement />} />
      
      {/* 商品管理 */}
      <Route path="/product" element={<ProductManagement />} />
    </Routes>
  )
}

export default AppRoutes


