// API 客户端 - 封装所有 HTTP 请求
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * 发送 API 请求
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // 204 No Content 没有响应体
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * API 客户端方法
 */
export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiRequest(url, { method: 'GET' });
  },

  post: (endpoint, data) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: (endpoint, data) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' });
  },
};

/**
 * 商品 API
 */
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getColors: (productId) => api.get(`/products/${productId}/colors`),
  createColor: (productId, data) => api.post(`/products/${productId}/colors`, data),
  updateColor: (id, data) => api.put(`/products/colors/${id}`, data),
  deleteColor: (id) => api.delete(`/products/colors/${id}`),
  getBatches: (colorId) => api.get(`/products/colors/${colorId}/batches`),
  createBatch: (colorId, data) => api.post(`/products/colors/${colorId}/batches`, data),
  updateBatch: (id, data) => api.put(`/products/batches/${id}`, data),
  deleteBatch: (id) => api.delete(`/products/batches/${id}`),
};

/**
 * 往来单位 API
 */
export const contactApi = {
  // 客户
  getAllCustomers: () => api.get('/contacts/customers'),
  getCustomer: (id) => api.get(`/contacts/customers/${id}`),
  createCustomer: (data) => api.post('/contacts/customers', data),
  updateCustomer: (id, data) => api.put(`/contacts/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/contacts/customers/${id}`),
  
  // 供应商
  getAllSuppliers: () => api.get('/contacts/suppliers'),
  getSupplier: (id) => api.get(`/contacts/suppliers/${id}`),
  createSupplier: (data) => api.post('/contacts/suppliers', data),
  updateSupplier: (id, data) => api.put(`/contacts/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/contacts/suppliers/${id}`),
};

/**
 * 进货单 API
 */
export const purchaseApi = {
  getAll: (params) => api.get('/purchases', params),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

/**
 * 销售单 API
 */
export const salesApi = {
  getAll: (params) => api.get('/sales', params),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  checkStock: (batchId, quantity) => api.post('/sales/check-stock', { batchId, quantity }),
};

/**
 * 染色加工单 API
 */
export const dyeingApi = {
  getAll: (params) => api.get('/dyeing', params),
  getById: (id) => api.get(`/dyeing/${id}`),
  create: (data) => api.post('/dyeing', data),
  update: (id, data) => api.put(`/dyeing/${id}`, data),
  delete: (id) => api.delete(`/dyeing/${id}`),
};

/**
 * 账款 API
 */
export const accountApi = {
  // 应收账款
  getAllReceivables: (params) => api.get('/accounts/receivables', params),
  createReceivable: (data) => api.post('/accounts/receivables', data),
  getReceipts: (id) => api.get(`/accounts/receivables/${id}/receipts`),
  getAllReceipts: (params) => api.get('/accounts/receipts', params),
  createReceipt: (id, data) => api.post(`/accounts/receivables/${id}/receipts`, data),
  
  // 应付账款
  getAllPayables: (params) => api.get('/accounts/payables', params),
  createPayable: (data) => api.post('/accounts/payables', data),
  getPayments: (id) => api.get(`/accounts/payables/${id}/payments`),
  getAllPayments: (params) => api.get('/accounts/payments', params),
  createPayment: (id, data) => api.post(`/accounts/payables/${id}/payments`, data),
};

/**
 * 库存 API
 */
export const inventoryApi = {
  // 库存调整单
  getAllAdjustments: (params) => api.get('/inventory/adjustments', params),
  getAdjustment: (id) => api.get(`/inventory/adjustments/${id}`),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  updateAdjustment: (id, data) => api.put(`/inventory/adjustments/${id}`, data),
  deleteAdjustment: (id) => api.delete(`/inventory/adjustments/${id}`),
  
  // 盘点单
  getAllChecks: (params) => api.get('/inventory/checks', params),
  getCheck: (id) => api.get(`/inventory/checks/${id}`),
  createCheck: (data) => api.post('/inventory/checks', data),
  updateCheck: (id, data) => api.put(`/inventory/checks/${id}`, data),
  deleteCheck: (id) => api.delete(`/inventory/checks/${id}`),
};

/**
 * 系统设置 API
 */
export const settingsApi = {
  // 门店信息
  getStoreInfo: () => api.get('/settings/store'),
  updateStoreInfo: (data) => api.put('/settings/store', data),
  
  // 员工
  getAllEmployees: () => api.get('/settings/employees'),
  getEmployee: (id) => api.get(`/settings/employees/${id}`),
  createEmployee: (data) => api.post('/settings/employees', data),
  updateEmployee: (id, data) => api.put(`/settings/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/settings/employees/${id}`),
  
  // 角色
  getAllRoles: () => api.get('/settings/roles'),
  createRole: (data) => api.post('/settings/roles', data),
  updateRole: (id, data) => api.put(`/settings/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/settings/roles/${id}`),
  
  // 自定义查询
  getAllQueries: (params) => api.get('/settings/queries', params),
  createQuery: (data) => api.post('/settings/queries', data),
  
  // 库存预警设置
  getInventoryAlert: () => api.get('/settings/inventory-alert'),
  updateInventoryAlert: (data) => api.put('/settings/inventory-alert', data),
  
  // 系统参数
  getParams: () => api.get('/settings/params'),
  updateParams: (data) => api.put('/settings/params', data),
};

/**
 * 打印模板 API
 */
export const templateApi = {
  getAll: (params) => api.get('/templates', params),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  incrementUsage: (id) => api.post(`/templates/${id}/usage`),
};

export default api;

