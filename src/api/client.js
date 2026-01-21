// API基础配置
const DEFAULT_API_BASE_URL = 'http://t.jiyizhiyun.com/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  // 从localStorage获取会话信息
  let sessionId = ''
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user && user.sessionId) {
        sessionId = user.sessionId
      }
    } catch (e) {
      console.error('Failed to parse user session info:', e)
    }
  }

  // 获取租户ID
  const tenantId = localStorage.getItem('currentTenantId')

  // 构建带sessionId和tenantId的URL
  let url = `${API_BASE_URL}${endpoint}`
  const queryParams = []
  if (sessionId) {
    queryParams.push(`sessionId=${sessionId}`)
  }
  if (tenantId) {
    queryParams.push(`tenantId=${tenantId}`)
    // 为了兼容某些可能使用 session.tenantId 结构的 backend
    // queryParams.push(`session.tenantId=${tenantId}`) 
  }

  if (queryParams.length > 0) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}${queryParams.join('&')}`
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  // 添加租户ID到请求头
  if (tenantId) {
    defaultOptions.headers['X-Tenant-Id'] = tenantId
  }

  // 同时在请求头中添加会话ID，以防后端需要
  if (sessionId) {
    defaultOptions.headers['X-Session-Id'] = sessionId
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
    // ...

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '请求失败' }))
      // API返回格式为 {success: false, message: "..."}
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    // 处理ApiResponse格式：{success: true, message: "...", data: {...}}
    // 如果响应包含data字段，返回data；否则返回整个响应
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data
    }

    return result
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
  register: async (data) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// 租户管理API
export const tenantApi = {
  createTenant: async (data) => {
    return apiRequest('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getUserTenants: async () => {
    return apiRequest('/auth/user-tenants')
  },
  switchTenant: async (tenantId) => {
    return apiRequest('/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    })
  },
  joinTenant: async (code) => {
    return apiRequest('/tenants/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },
}

// 系统设置API
export const settingsApi = {
  // 门店信息
  getStoreInfo: async () => {
    return apiRequest('/store')
  },
  updateStoreInfo: async (data) => {
    return apiRequest('/store', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // 员工管理
  getAllEmployees: async () => {
    return apiRequest('/employees')
  },
  getEmployee: async (id) => {
    return apiRequest(`/employees/${id}`)
  },
  createEmployee: async (data) => {
    return apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateEmployee: async (id, data) => {
    return apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteEmployee: async (id) => {
    return apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    })
  },

  // 角色管理
  getAllRoles: async () => {
    return apiRequest('/roles')
  },
  createRole: async (data) => {
    return apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateRole: async (id, data) => {
    return apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteRole: async (id) => {
    return apiRequest(`/roles/${id}`, {
      method: 'DELETE',
    })
  },

  // 自定义查询
  getAllQueries: async (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiRequest(`/queries${queryString}`)
  },
  createQuery: async (data) => {
    return apiRequest('/queries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // 库存预警设置
  getInventoryAlert: async () => {
    return apiRequest('/inventory-alert')
  },
  updateInventoryAlert: async (data) => {
    return apiRequest('/inventory-alert', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // 系统参数
  getParams: async () => {
    return apiRequest('/system-params')
  },
  updateParams: async (data) => {
    return apiRequest('/system-params', {
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
    // API文档要求：request参数是必需的，需要包装查询参数
    // 同时支持pageNo和pageSize参数
    const request = params || {}
    const pageNo = params?.pageNo || 1
    const pageSize = params?.pageSize || 100
    // 构建查询字符串：pageNo, pageSize, request
    const queryParams = new URLSearchParams()
    queryParams.append('pageNo', pageNo.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('request', JSON.stringify(request))
    return apiRequest(`/purchases?${queryParams.toString()}`)
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
    // API文档要求：request参数是必需的，需要包装查询参数
    // 同时支持pageNo和pageSize参数
    const request = params || {}
    const pageNo = params?.pageNo || 1
    const pageSize = params?.pageSize || 100
    // 构建查询字符串：pageNo, pageSize, request
    const queryParams = new URLSearchParams()
    queryParams.append('pageNo', pageNo.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('request', JSON.stringify(request))
    return apiRequest(`/sales?${queryParams.toString()}`)
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
    // API文档要求：request参数是必需的，需要包装查询参数
    // 同时支持pageNo和pageSize参数
    const request = params || {}
    const pageNo = params?.pageNo || 1
    const pageSize = params?.pageSize || 100
    // 构建查询字符串：pageNo, pageSize, request
    const queryParams = new URLSearchParams()
    queryParams.append('pageNo', pageNo.toString())
    queryParams.append('pageSize', pageSize.toString())
    queryParams.append('request', JSON.stringify(request))
    return apiRequest(`/dyeing?${queryParams.toString()}`)
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
