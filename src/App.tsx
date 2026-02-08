import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSettingsStore } from './store/settingsStore'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// 商品管理
import ProductManagement from './pages/product/ProductManagement'
import BarcodePrint from './pages/product/BarcodePrint'
import ProductDetailPage from './pages/product/ProductDetailPage'
import ProductSharePage from './pages/product/ProductSharePage'

// 往来单位
import ContactManagement from './pages/contact/ContactManagement'
import CustomerManagement from './pages/customer/CustomerManagement'
import CustomerStatement from './pages/customer/CustomerStatement'
import CustomerForm from './pages/customer/CustomerForm'
import SupplierManagement from './pages/supplier/SupplierManagement'
import SupplierForm from './pages/supplier/SupplierForm'

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
import InventoryLocationSettings from './pages/inventory/InventoryLocationSettings'

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
import PrintSettings from './pages/settings/PrintSettings'
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
import BasicDataManagement from './pages/settings/BasicDataManagement'
import UnitManagement from './pages/settings/UnitManagement'

// 租户管理
import TenantSelect from './pages/tenant/TenantSelect'
// import TenantManagement from './pages/tenant/TenantManagement'
// import TenantUserManagement from './pages/tenant/TenantUserManagement'

// 个人中心
import Profile from './pages/profile/Profile'

// 路由保护组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 尝试从用户信息中提取 tenantId（企业已在 CRM 中登记，无需手动选择）
  let currentTenantId = localStorage.getItem('currentTenantId')
  if (!currentTenantId) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        if (userData && (userData.tenantId !== null && userData.tenantId !== undefined)) {
          currentTenantId = String(userData.tenantId)
          localStorage.setItem('currentTenantId', currentTenantId)
          if (userData.tenantName) {
            localStorage.setItem('currentTenantName', userData.tenantName)
          }
          if (userData.tenantCode) {
            localStorage.setItem('currentTenantCode', userData.tenantCode)
          }
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    }
  }

  // 直接进入系统（不再强制要求选择租户，企业信息已在 CRM 中）
  return <Layout>{children}</Layout>
}

// 染色加工路由保护组件（检查系统参数）
function DyeingRoute({ children }: { children: React.ReactNode }) {
  const { systemParams } = useSettingsStore()
  
  if (!systemParams?.enableDyeingProcess) {
    return <Navigate to="/" replace />
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function App() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  // Vite's BASE_URL ends with "/" (e.g. "/" or "/shaxian/").
  // For BrowserRouter, keep "/" as-is; otherwise trim the trailing slash.
  const basename =
    baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '')

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<Login />} />

        {/* 注册页面 */}
        <Route path="/register" element={<Register />} />

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
        <Route
          path="/products/barcode-print"
          element={
            <ProtectedRoute>
              <BarcodePrint />
            </ProtectedRoute>
          }
        />
        {/* 商品分享页（公开访问，分享码免登录）须在 /product/:id 之前，否则 /product/share/xxx 会匹配成 id=share */}
        <Route
          path="/product/share/:code"
          element={<ProductSharePage />}
        />
        <Route
          path="/product/:id"
          element={<ProductDetailPage />}
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
          path="/customer/create"
          element={
            <ProtectedRoute>
              <CustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/:id/edit"
          element={
            <ProtectedRoute>
              <CustomerForm />
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
          path="/customer/statement"
          element={
            <ProtectedRoute>
              <CustomerStatement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/create"
          element={
            <ProtectedRoute>
              <SupplierForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplier/:id/edit"
          element={
            <ProtectedRoute>
              <SupplierForm />
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
        <Route
          path="/purchase/:id"
          element={
            <ProtectedRoute>
              <PurchaseCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase/edit/:id"
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
        <Route
          path="/sales/:id"
          element={
            <ProtectedRoute>
              <SalesCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales/edit/:id"
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
            <DyeingRoute>
              <DyeingList />
            </DyeingRoute>
          }
        />
        <Route
          path="/dyeing/create"
          element={
            <DyeingRoute>
              <DyeingCreate />
            </DyeingRoute>
          }
        />
        <Route
          path="/dyeing/:id/edit"
          element={
            <DyeingRoute>
              <DyeingCreate />
            </DyeingRoute>
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
          path="/inventory/adjustment/:id/edit"
          element={
            <ProtectedRoute>
              <AdjustmentCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/adjustment/:id"
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
        <Route
          path="/inventory/check/:id/edit"
          element={
            <ProtectedRoute>
              <InventoryCheckCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/check/:id"
          element={
            <ProtectedRoute>
              <InventoryCheckCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/locations"
          element={
            <ProtectedRoute>
              <InventoryLocationSettings />
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

        {/* 打印管理 - 已移至设置页面 */}
        <Route
          path="/settings/print"
          element={
            <ProtectedRoute>
              <PrintSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/print/template/:id"
          element={
            <ProtectedRoute>
              <TemplateEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/print/barcode-template/:id"
          element={
            <ProtectedRoute>
              <Navigate to="/products/barcode-print" replace />
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
        <Route
          path="/settings/basic-data"
          element={
            <ProtectedRoute>
              <BasicDataManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/basic-data/units"
          element={
            <ProtectedRoute>
              <UnitManagement />
            </ProtectedRoute>
          }
        />

        {/* 租户管理 - 已移除 */}
        {/* <Route
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
        /> */}

        {/* 个人中心 */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
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
