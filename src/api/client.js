// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // 添加租户ID到请求头
  const tenantId = localStorage.getItem('currentTenantId')
  if (tenantId) {
    defaultOptions.headers['X-Tenant-Id'] = tenantId
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('无法连接到后端服务器。请确保后端服务已启动（运行 mvn spring-boot:run 在 server-springboot 目录下）')
    }
    throw error
  }
}

// 认证API
export const authApi = {
  login: async (data) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },
}

// 系统设置API
export const settingsApi = {
  // 门店信息
  getStoreInfo: async () => {
    return apiRequest('/settings/store')
  },
  updateStoreInfo: async (data) => {
    return apiRequest('/settings/store', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  // 员工管理
  getAllEmployees: async () => {
    return apiRequest('/settings/employees')
  },
  getEmployee: async (id) => {
    return apiRequest(`/settings/employees/${id}`)
  },
  createEmployee: async (data) => {
    return apiRequest('/settings/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateEmployee: async (id, data) => {
    return apiRequest(`/settings/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteEmployee: async (id) => {
    return apiRequest(`/settings/employees/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 角色管理
  getAllRoles: async () => {
    return apiRequest('/settings/roles')
  },
  createRole: async (data) => {
    return apiRequest('/settings/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateRole: async (id, data) => {
    return apiRequest(`/settings/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteRole: async (id) => {
    return apiRequest(`/settings/roles/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 自定义查询
  getAllQueries: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/settings/queries${queryString}`)
  },
  createQuery: async (data) => {
    return apiRequest('/settings/queries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  // 库存预警设置
  getInventoryAlert: async () => {
    return apiRequest('/settings/inventory-alert')
  },
  updateInventoryAlert: async (data) => {
    return apiRequest('/settings/inventory-alert', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  // 系统参数
  getParams: async () => {
    return apiRequest('/settings/params')
  },
  updateParams: async (data) => {
    return apiRequest('/settings/params', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// 账款API
export const accountApi = {
  // 应收账款
  getAllReceivables: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/accounts/receivables${queryString}`)
  },
  createReceivable: async (data) => {
    return apiRequest('/accounts/receivables', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getReceipts: async (id) => {
    return apiRequest(`/accounts/receivables/${id}/receipts`)
  },
  createReceipt: async (id, data) => {
    return apiRequest(`/accounts/receivables/${id}/receipts`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getAllReceipts: async () => {
    // 注意：后端可能没有单独的获取所有收款记录的接口，这里返回空数组
    return []
  },
  
  // 应付账款
  getAllPayables: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/accounts/payables${queryString}`)
  },
  createPayable: async (data) => {
    return apiRequest('/accounts/payables', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getPayments: async (id) => {
    return apiRequest(`/accounts/payables/${id}/payments`)
  },
  createPayment: async (id, data) => {
    return apiRequest(`/accounts/payables/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getAllPayments: async () => {
    // 注意：后端可能没有单独的获取所有付款记录的接口，这里返回空数组
    return []
  },
}

// 往来单位API
export const contactApi = {
  // 客户管理
  getAllCustomers: async () => {
    return apiRequest('/contacts/customers')
  },
  getCustomer: async (id) => {
    return apiRequest(`/contacts/customers/${id}`)
  },
  createCustomer: async (data) => {
    return apiRequest('/contacts/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateCustomer: async (id, data) => {
    return apiRequest(`/contacts/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteCustomer: async (id) => {
    return apiRequest(`/contacts/customers/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 供应商管理
  getAllSuppliers: async () => {
    return apiRequest('/contacts/suppliers')
  },
  getSupplier: async (id) => {
    return apiRequest(`/contacts/suppliers/${id}`)
  },
  createSupplier: async (data) => {
    return apiRequest('/contacts/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateSupplier: async (id, data) => {
    return apiRequest(`/contacts/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteSupplier: async (id) => {
    return apiRequest(`/contacts/suppliers/${id}`, {
      method: 'DELETE',
    })
  },
}

// 采购API
export const purchaseApi = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/purchases${queryString}`)
  },
  getById: async (id) => {
    return apiRequest(`/purchases/${id}`)
  },
  create: async (data) => {
    return apiRequest('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id, data) => {
    return apiRequest(`/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id) => {
    return apiRequest(`/purchases/${id}`, {
      method: 'DELETE',
    })
  },
}

// 销售API
export const salesApi = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/sales${queryString}`)
  },
  getById: async (id) => {
    return apiRequest(`/sales/${id}`)
  },
  create: async (data) => {
    return apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id, data) => {
    return apiRequest(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id) => {
    return apiRequest(`/sales/${id}`, {
      method: 'DELETE',
    })
  },
  checkStock: async (batchId, quantity) => {
    return apiRequest(`/sales/check-stock`, {
      method: 'POST',
      body: JSON.stringify({ batchId, quantity }),
    })
  },
}

// 染色加工API
export const dyeingApi = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/dyeing${queryString}`)
  },
  getById: async (id) => {
    return apiRequest(`/dyeing/${id}`)
  },
  create: async (data) => {
    return apiRequest('/dyeing', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id, data) => {
    return apiRequest(`/dyeing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id) => {
    return apiRequest(`/dyeing/${id}`, {
      method: 'DELETE',
    })
  },
}

// 库存API
export const inventoryApi = {
  // 库存调整单
  getAllAdjustments: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/inventory/adjustments${queryString}`)
  },
  getAdjustment: async (id) => {
    return apiRequest(`/inventory/adjustments/${id}`)
  },
  createAdjustment: async (data) => {
    return apiRequest('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateAdjustment: async (id, data) => {
    return apiRequest(`/inventory/adjustments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteAdjustment: async (id) => {
    return apiRequest(`/inventory/adjustments/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 库存盘点单
  getAllChecks: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/inventory/checks${queryString}`)
  },
  getCheck: async (id) => {
    return apiRequest(`/inventory/checks/${id}`)
  },
  createCheck: async (data) => {
    return apiRequest('/inventory/checks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateCheck: async (id, data) => {
    return apiRequest(`/inventory/checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteCheck: async (id) => {
    return apiRequest(`/inventory/checks/${id}`, {
      method: 'DELETE',
    })
  },
}

// 商品API
export const productApi = {
  getAll: async () => {
    return apiRequest('/products')
  },
  getById: async (id) => {
    return apiRequest(`/products/${id}`)
  },
  create: async (data) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id, data) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 色号管理
  getColors: async (productId) => {
    return apiRequest(`/products/${productId}/colors`)
  },
  createColor: async (productId, data) => {
    return apiRequest(`/products/${productId}/colors`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateColor: async (id, data) => {
    return apiRequest(`/products/colors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteColor: async (id) => {
    return apiRequest(`/products/colors/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 缸号管理
  getBatches: async (colorId) => {
    return apiRequest(`/products/colors/${colorId}/batches`)
  },
  createBatch: async (colorId, data) => {
    return apiRequest(`/products/colors/${colorId}/batches`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateBatch: async (id, data) => {
    return apiRequest(`/products/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteBatch: async (id) => {
    return apiRequest(`/products/batches/${id}`, {
      method: 'DELETE',
    })
  },
}

// 打印模板API
export const templateApi = {
  getAll: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/templates${queryString}`)
  },
  getById: async (id) => {
    return apiRequest(`/templates/${id}`)
  },
  create: async (data) => {
    return apiRequest('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id, data) => {
    return apiRequest(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: async (id) => {
    return apiRequest(`/templates/${id}`, {
      method: 'DELETE',
    })
  },
  incrementUsage: async (id) => {
    return apiRequest(`/templates/${id}/usage`, {
      method: 'POST',
    })
  },
}

// 导出默认API对象
export default {
  get: (endpoint, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(endpoint + queryString)
  },
  post: (endpoint, data) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  put: (endpoint, data) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  delete: (endpoint) => {
    return apiRequest(endpoint, {
      method: 'DELETE',
    })
  },
}
