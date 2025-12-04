import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import PurchaseList from '../pages/purchase/PurchaseList'
import PurchaseCreate from '../pages/purchase/PurchaseCreate'
import SalesList from '../pages/sales/SalesList'
import SalesCreate from '../pages/sales/SalesCreate'
import DyeingList from '../pages/dyeing/DyeingList'
import DyeingCreate from '../pages/dyeing/DyeingCreate'
import Inventory from '../pages/inventory/Inventory'
import AdjustmentList from '../pages/inventory/AdjustmentList'
import AdjustmentCreate from '../pages/inventory/AdjustmentCreate'
import InventoryCheckList from '../pages/inventory/InventoryCheckList'
import InventoryCheckCreate from '../pages/inventory/InventoryCheckCreate'
import AccountManagement from '../pages/account/AccountManagement'
import ContactManagement from '../pages/contact/ContactManagement'
import ContactForm from '../pages/contact/ContactForm'
import PrintManagement from '../pages/print/PrintManagement'
import TemplateEdit from '../pages/print/TemplateEdit'
import ReportManagement from '../pages/report/ReportManagement'
import SalesReport from '../pages/report/SalesReport'
import PurchaseReport from '../pages/report/PurchaseReport'
import InventoryReport from '../pages/report/InventoryReport'
import ProfitReport from '../pages/report/ProfitReport'
import CustomerReport from '../pages/report/CustomerReport'
import FundReport from '../pages/report/FundReport'
import ProductManagement from '../pages/product/ProductManagement'
import SettingsManagement from '../pages/settings/SettingsManagement'
import SystemParamsSettings from '../pages/settings/SystemParamsSettings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      
      {/* 进货管理 */}
      <Route path="/purchase" element={<PurchaseList />} />
      <Route path="/purchase/create" element={<PurchaseCreate />} />
      <Route path="/purchase/:id/edit" element={<PurchaseCreate />} />
      
      {/* 销售管理 */}
      <Route path="/sales" element={<SalesList />} />
      <Route path="/sales/create" element={<SalesCreate />} />
      
      {/* 染色加工 */}
      <Route path="/dyeing" element={<DyeingList />} />
      <Route path="/dyeing/create" element={<DyeingCreate />} />
      <Route path="/dyeing/:id/edit" element={<DyeingCreate />} />
      
      {/* 库存管理 */}
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/adjustment" element={<AdjustmentList />} />
      <Route path="/inventory/adjustment/create" element={<AdjustmentCreate />} />
      <Route path="/inventory/adjustment/:id/edit" element={<AdjustmentCreate />} />
      <Route path="/inventory/check" element={<InventoryCheckList />} />
      <Route path="/inventory/check/create" element={<InventoryCheckCreate />} />
      <Route path="/inventory/check/:id/edit" element={<InventoryCheckCreate />} />
      
      {/* 账款管理 */}
      <Route path="/account/receivable" element={<AccountManagement />} />
      <Route path="/account/payable" element={<AccountManagement />} />
      
      {/* 客户与供应商 */}
      <Route path="/customer" element={<ContactManagement />} />
      <Route path="/supplier" element={<ContactManagement />} />
      <Route path="/contact/:type/create" element={<ContactForm />} />
      <Route path="/contact/:type/:id/edit" element={<ContactForm />} />
      
      {/* 打印管理 */}
      <Route path="/print" element={<PrintManagement />} />
      <Route path="/print/template/create" element={<TemplateEdit />} />
      <Route path="/print/template/:id/edit" element={<TemplateEdit />} />
      
      {/* 统计报表 */}
      <Route path="/report" element={<ReportManagement />} />
      <Route path="/report/sales" element={<SalesReport />} />
      <Route path="/report/purchase" element={<PurchaseReport />} />
      <Route path="/report/inventory" element={<InventoryReport />} />
      <Route path="/report/profit" element={<ProfitReport />} />
      <Route path="/report/customer" element={<CustomerReport />} />
      <Route path="/report/fund" element={<FundReport />} />
      
      {/* 商品管理 */}
      <Route path="/product" element={<ProductManagement />} />
      
            {/* 系统设置 */}
            <Route path="/settings" element={<SettingsManagement />} />
            <Route path="/settings/params" element={<SystemParamsSettings />} />
    </Routes>
  )
}

export default AppRoutes


