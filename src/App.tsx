import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'

// 商品管理
import ProductManagement from './pages/product/ProductManagement'

// 往来单位
import ContactManagement from './pages/contact/ContactManagement'
import CustomerManagement from './pages/customer/CustomerManagement'
import SupplierManagement from './pages/supplier/SupplierManagement'

// 采购管理
import PurchaseList from './pages/purchase/PurchaseList'
import PurchaseCreate from './pages/purchase/PurchaseCreate'

// 销售管理
import SalesList from './pages/sales/SalesList'
import SalesCreate from './pages/sales/SalesCreate'

// 染色加工
import DyeingList from './pages/dyeing/DyeingList'
import DyeingCreate from './pages/dyeing/DyeingCreate'

// 库存管理
import Inventory from './pages/inventory/Inventory'
import AdjustmentList from './pages/inventory/AdjustmentList'
import AdjustmentCreate from './pages/inventory/AdjustmentCreate'
import InventoryCheckList from './pages/inventory/InventoryCheckList'
import InventoryCheckCreate from './pages/inventory/InventoryCheckCreate'

// 账款管理
import AccountManagement from './pages/account/AccountManagement'
import AccountReceivable from './pages/account/AccountReceivable'
import AccountPayable from './pages/account/AccountPayable'

// 报表管理
import ReportManagement from './pages/report/ReportManagement'
import SalesReport from './pages/report/SalesReport'
import PurchaseReport from './pages/report/PurchaseReport'
import ProfitReport from './pages/report/ProfitReport'
import CustomerReport from './pages/report/CustomerReport'
import InventoryReport from './pages/report/InventoryReport'
import FundReport from './pages/report/FundReport'

// 打印管理
import PrintManagement from './pages/print/PrintManagement'
import TemplateEdit from './pages/print/TemplateEdit'

// 系统设置
import SettingsManagement from './pages/settings/SettingsManagement'
import StoreInfoSettings from './pages/settings/StoreInfoSettings'
import EmployeeManagement from './pages/settings/EmployeeManagement'
import RoleManagement from './pages/settings/RoleManagement'
import CustomQuerySettings from './pages/settings/CustomQuerySettings'
import InventoryAlertSettings from './pages/settings/InventoryAlertSettings'
import SystemParamsSettings from './pages/settings/SystemParamsSettings'
import TutorialManagement from './pages/settings/TutorialManagement'
import ClearData from './pages/settings/ClearData'

// 租户管理
import TenantSelect from './pages/tenant/TenantSelect'
import TenantManagement from './pages/tenant/TenantManagement'
import TenantUserManagement from './pages/tenant/TenantUserManagement'

// 路由保护组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const currentTenantId = localStorage.getItem('currentTenantId')

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 如果已登录但没有选择租户，跳转到租户选择页面
  if (!currentTenantId) {
    return <Navigate to="/tenant/select" replace />
  }

  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? '/shaxian' : '/'}>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />

        {/* 租户选择页面 */}
        <Route path="/tenant/select" element={<TenantSelect />} />

        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 商品管理 */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductManagement />
            </ProtectedRoute>
          }
        />

        {/* 往来单位 */}
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <ContactManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier"
          element={
            <ProtectedRoute>
              <SupplierManagement />
            </ProtectedRoute>
          }
        />

        {/* 采购管理 */}
        <Route
          path="/purchase"
          element={
            <ProtectedRoute>
              <PurchaseList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase/create"
          element={
            <ProtectedRoute>
              <PurchaseCreate />
            </ProtectedRoute>
          }
        />

        {/* 销售管理 */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <SalesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/create"
          element={
            <ProtectedRoute>
              <SalesCreate />
            </ProtectedRoute>
          }
        />

        {/* 染色加工 */}
        <Route
          path="/dyeing"
          element={
            <ProtectedRoute>
              <DyeingList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dyeing/create"
          element={
            <ProtectedRoute>
              <DyeingCreate />
            </ProtectedRoute>
          }
        />

        {/* 库存管理 */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/adjustment"
          element={
            <ProtectedRoute>
              <AdjustmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/adjustment/create"
          element={
            <ProtectedRoute>
              <AdjustmentCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/check"
          element={
            <ProtectedRoute>
              <InventoryCheckList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/check/create"
          element={
            <ProtectedRoute>
              <InventoryCheckCreate />
            </ProtectedRoute>
          }
        />

        {/* 账款管理 */}
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/receivable"
          element={
            <ProtectedRoute>
              <AccountReceivable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/payable"
          element={
            <ProtectedRoute>
              <AccountPayable />
            </ProtectedRoute>
          }
        />

        {/* 报表管理 */}
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/sales"
          element={
            <ProtectedRoute>
              <SalesReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/purchase"
          element={
            <ProtectedRoute>
              <PurchaseReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/profit"
          element={
            <ProtectedRoute>
              <ProfitReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/customer"
          element={
            <ProtectedRoute>
              <CustomerReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/inventory"
          element={
            <ProtectedRoute>
              <InventoryReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/fund"
          element={
            <ProtectedRoute>
              <FundReport />
            </ProtectedRoute>
          }
        />

        {/* 打印管理 */}
        <Route
          path="/print"
          element={
            <ProtectedRoute>
              <PrintManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/print/template/:id"
          element={
            <ProtectedRoute>
              <TemplateEdit />
            </ProtectedRoute>
          }
        />

        {/* 系统设置 */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/store"
          element={
            <ProtectedRoute>
              <StoreInfoSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/employees"
          element={
            <ProtectedRoute>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/roles"
          element={
            <ProtectedRoute>
              <RoleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/custom-query"
          element={
            <ProtectedRoute>
              <CustomQuerySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/inventory-alert"
          element={
            <ProtectedRoute>
              <InventoryAlertSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/params"
          element={
            <ProtectedRoute>
              <SystemParamsSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/tutorial"
          element={
            <ProtectedRoute>
              <TutorialManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/clear-data"
          element={
            <ProtectedRoute>
              <ClearData />
            </ProtectedRoute>
          }
        />

        {/* 租户管理 */}
        <Route
          path="/tenant"
          element={
            <ProtectedRoute>
              <TenantManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenant/users"
          element={
            <ProtectedRoute>
              <TenantUserManagement />
            </ProtectedRoute>
          }
        />

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
