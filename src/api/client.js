// API 基础配置（支持运行时 localStorage apiBaseOverride 切换 /api 与 /biz/api）
import { getApiBaseUrl } from './apiBase'

// 公开的API请求函数（用于商品详情页等公开访问的场景，401时不跳转登录）
async function publicApiRequest(endpoint, options = {}) {
  // 从localStorage获取会话信息（如果有的话）
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

  // 获取租户ID：优先从 URL query（含 hash 内 ?tenantId=）获取（扫码访问），其次 localStorage
  let tenantId = null
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    tenantId = urlParams.get('tenantId')
    if (!tenantId && window.location.hash) {
      const q = window.location.hash.indexOf('?')
      if (q !== -1) {
        const hp = new URLSearchParams(window.location.hash.slice(q))
        tenantId = hp.get('tenantId')
      }
    }
    if (tenantId) {
      // 若 URL 明确带 tenantId，以其为准，避免跨租户扫码读到旧租户数据
      localStorage.setItem('currentTenantId', tenantId)
    } else {
      tenantId = localStorage.getItem('currentTenantId')
    }
  } else {
    tenantId = localStorage.getItem('currentTenantId')
  }

  // 构建带sessionId和tenantId的URL
  let url = `${getApiBaseUrl()}${endpoint}`
  const queryParams = []
  if (sessionId) {
    queryParams.push(`sessionId=${sessionId}`)
  }
  if (tenantId) {
    queryParams.push(`tenantId=${tenantId}`)
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

    if (!response.ok) {
      // 公开API请求：401时不跳转登录，直接抛出错误
      if (response.status === 401) {
        throw new Error('未授权访问，请先登录')
      }

      const contentType = response.headers.get('content-type') || ''
      let message = `HTTP error! status: ${response.status}`

      try {
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null)
          if (errorData && typeof errorData === 'object') {
            message = errorData.message || message
          }
        } else {
          const text = await response.text().catch(() => '')
          if (text) {
            message = `${message} (${text.slice(0, 200)})`
          }
        }
      } catch {
        // ignore
      }

      throw new Error(message)
    }

    let result = null

    try {
      const text = await response.text()
      
      if (!text || text.trim() === '') {
        return null
      }
      
      const ct = (response.headers.get('content-type') || '').toLowerCase()
      if (ct && !ct.includes('application/json') && (ct.includes('text/html') || ct.includes('text/plain'))) {
        return null
      }
      const t = text.trim()
      if (t.toLowerCase().startsWith('<!doctype') || t.startsWith('<')) {
        return null
      }
      
      result = JSON.parse(text)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return null
      }
      throw error
    }

    if (result && typeof result === 'object' && 'data' in result) {
      return result.data
    }

    return result
  } catch (error) {
    const message = error?.message || ''

    if (message.includes('Failed to fetch')) {
      if (typeof window !== 'undefined') {
        const pageProtocol = window.location?.protocol
        if (pageProtocol === 'https:' && getApiBaseUrl().startsWith('http://')) {
          throw new Error(
            `当前页面是 HTTPS，但接口地址是 HTTP（${getApiBaseUrl()}）。浏览器会拦截请求，导致无法登录/请求失败。` +
              `请将页面部署到 HTTP，或给后端接口配置 HTTPS，或通过同源反向代理转发接口。`
          )
        }
      }

      throw new Error(`请求失败（网络异常或被浏览器拦截）。请检查接口地址是否可访问：${getApiBaseUrl()}`)
    }
    throw error
  }
}

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

  // 获取租户ID：优先 currentTenantId；缺失时从 user.tenantId 兜底
  // 安全要求：兜底前必须校验"currentTenantId 缺失"是临时丢失还是被篡改
  // - 如果 currentTenantId 存在但跟 user.tenantId 不一致 → 不允许（强制重登）
  // - 如果 currentTenantId 缺失且 user.tenantId 存在 → 兜底 + warn
  let tenantId = localStorage.getItem('currentTenantId')
  let userTenantId = null
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user && user.tenantId !== null && user.tenantId !== undefined) {
        userTenantId = String(user.tenantId)
      }
    } catch {
      // ignore
    }
  }
  if (tenantId && userTenantId && tenantId !== userTenantId) {
    console.error(
      '[安全] currentTenantId 与 user.tenantId 不一致，清登录态强制重登',
      { currentTenantId: tenantId, userTenantId }
    )
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    localStorage.removeItem('currentTenantId')
    localStorage.removeItem('currentTenantName')
    localStorage.removeItem('currentTenantCode')
    const baseUrl = import.meta.env.BASE_URL || '/'
    const basename = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')
    window.location.href = `${basename}/login`
    return
  }
  if (!tenantId && userTenantId) {
    console.warn('[兜底] currentTenantId 丢失，回退到 user.tenantId =', userTenantId)
    tenantId = userTenantId
    localStorage.setItem('currentTenantId', tenantId)
  }

  // 构建带sessionId和tenantId的URL
  let url = `${getApiBaseUrl()}${endpoint}`
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

    if (!response.ok) {
      // 处理 401 未授权错误 - 会话过期 / 顶号 / 租户停用到期，跳转到登录页
      if (response.status === 401) {
        // 读后端 message 决定 toast 文案（区分 4 类原因，避免用户云里雾里）
        let reason = '会话已过期'
        try {
          const data = await response.clone().json().catch(() => null)
          const msg = data?.message || ''
          if (msg.includes('租户已停用')) reason = '租户已停用，请联系平台运营'
          else if (msg.includes('租户已到期')) reason = '租户已到期，请联系平台运营续费'
          else if (msg.includes('账号已在其它地方登录') || msg.includes('已在其它地方登录')) reason = '账号已在其它设备登录，本次会话失效'
          else if (msg) reason = msg
        } catch { /* ignore */ }

        // 在 sessionStorage 记下跳转原因，登录页可读取展示
        try { sessionStorage.setItem('logoutReason', reason) } catch {}

        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('user')
        localStorage.removeItem('currentTenantId')
        localStorage.removeItem('currentTenantName')
        localStorage.removeItem('currentTenantCode')

        const baseUrl = import.meta.env.BASE_URL || '/'
        const basename = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')

        console.warn('[401]', reason, '→ 跳登录')
        window.location.href = `${basename}/login`
        return
      }

      const contentType = response.headers.get('content-type') || ''
      let message = `HTTP error! status: ${response.status}`

      // 优先读取后端返回的 message（兼容 JSON / 非 JSON）
      try {
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null)
          if (errorData && typeof errorData === 'object') {
            message = errorData.message || message
          }
        } else {
          const text = await response.text().catch(() => '')
          if (text) {
            message = `${message} (${text.slice(0, 200)})`
          }
        }
      } catch {
        // ignore
      }

      // 对于 500 错误且是商品色号/缸号相关的请求，静默处理，不记录错误
      const isProductColorOrBatchRequest = 
        url.includes('/products/') && (url.includes('/colors') || url.includes('/batches'))
      
      if (response.status === 500 && isProductColorOrBatchRequest) {
        // 静默处理，不记录到控制台，直接抛出错误让调用方处理
        throw new Error(message)
      }
      
      console.error('API request failed', {
        url,
        status: response.status,
        contentType,
        message,
      })

      // API返回格式为 {success: false, message: "..."}
      throw new Error(message)
    }

    // 成功响应：先读取响应文本（Response 只能读取一次）
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')
    
    // 对于 DELETE 操作或 204 状态码，可能返回空响应体
    if (options.method === 'DELETE' || response.status === 204) {
      // 检查是否有内容
      if (contentLength === '0') {
        return null
      }
      // 尝试读取文本，如果为空则返回 null
      try {
        const text = await response.text()
        if (!text || text.trim() === '') {
          return null
        }
        // 如果有内容，尝试解析为 JSON
        try {
          return JSON.parse(text)
        } catch {
          // 不是 JSON，返回文本
          return text
        }
      } catch {
        return null
      }
    }

    // 对于其他请求，尝试解析 JSON
    let result
    try {
      const text = await response.text()
      
      if (!text || text.trim() === '') {
        return null
      }
      
      const ct = (response.headers.get('content-type') || '').toLowerCase()
      if (ct && !ct.includes('application/json') && (ct.includes('text/html') || ct.includes('text/plain'))) {
        return null
      }
      const t = text.trim()
      if (t.toLowerCase().startsWith('<!doctype') || t.startsWith('<')) {
        return null
      }
      
      result = JSON.parse(text)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return null
      }
      throw error
    }

    // 处理ApiResponse格式：{success: true, message: "...", data: {...}}
    // 如果响应包含data字段，返回data；否则返回整个响应
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data
    }

    return result
  } catch (error) {
    const message = error?.message || ''

    // fetch 网络错误 / 被浏览器拦截（如 Mixed Content）
    if (message.includes('Failed to fetch')) {
      if (typeof window !== 'undefined') {
        const pageProtocol = window.location?.protocol
        // https 页面请求 http 接口会被浏览器拦截（Mixed Content）
        if (pageProtocol === 'https:' && getApiBaseUrl().startsWith('http://')) {
          throw new Error(
            `当前页面是 HTTPS，但接口地址是 HTTP（${getApiBaseUrl()}）。浏览器会拦截请求，导致无法登录/请求失败。` +
              `请将页面部署到 HTTP，或给后端接口配置 HTTPS，或通过同源反向代理转发接口。`
          )
        }
      }

      throw new Error(`请求失败（网络异常或被浏览器拦截）。请检查接口地址是否可访问：${getApiBaseUrl()}`)
    }
    throw error
  }
}

// 从响应体解析错误信息（支持 message / error / detail / msg）
function parseAuthError(res, text) {
  const ct = res.headers.get('content-type') || ''
  if (!text || !ct.includes('application/json')) return null
  try {
    const j = JSON.parse(text)
    if (j && typeof j === 'object') {
      const m = j.message ?? j.error ?? j.detail ?? j.msg
      if (typeof m === 'string' && m.trim()) return m.trim()
    }
  } catch (_) {}
  return null
}

// 认证API
export const authApi = {
  // 登录仅校验手机号+密码，不传租户；注册表有对应用户即可登录
  login: async (data) => {
    const { phone, password } = data
    const url = `${getApiBaseUrl()}/auth/login`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    })
    const text = await res.text()
    const dataResp = (() => {
      try {
        return text && (res.headers.get('content-type') || '').includes('application/json')
          ? JSON.parse(text)
          : null
      } catch (_) {
        return null
      }
    })()

    if (!res.ok) {
      const detail = parseAuthError(res, text)
      let msg = detail || `请求失败（${res.status}）`
      if (res.status >= 500) {
        msg = detail
          ? `服务器错误：${detail}`
          : '服务器暂时异常（500），请稍后重试。可点击下方切换接口重试，或联系管理员。'
        if (import.meta.env.DEV) console.error('[login]', res.status, url, text?.slice(0, 500))
      } else if (res.status === 405) {
        msg = detail || '该接口返回 405（方法不允许），可能路径或配置有误。可点击下方切换接口重试。'
      }
      throw new Error(msg)
    }

    if (dataResp && typeof dataResp === 'object' && 'data' in dataResp) return dataResp.data
    return dataResp
  },
  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    })
  },
  register: async (data) => {
    const url = `${getApiBaseUrl()}/auth/register`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const text = await res.text()
    const dataResp = (() => {
      try {
        return text && (res.headers.get('content-type') || '').includes('application/json')
          ? JSON.parse(text)
          : null
      } catch (_) {
        return null
      }
    })()

    if (!res.ok) {
      const detail = parseAuthError(res, text)
      throw new Error(detail || `注册失败（${res.status}）`)
    }
    return dataResp
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
  /** 仅更新收款信息（已完成等非草稿订单适用；后端仅支持 PUT，若仍限制草稿则提示通过账款管理收款） */
  updatePayment: async (id, data) => {
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
  /** 作废销售单：后端事务处理（还库存 + 冲销关联未收款应收 + 状态置 CANCELLED） */
  cancel: async (id) => {
    return apiRequest(`/sales/${id}/cancel`, {
      method: 'POST',
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
// 公开的商品API（用于商品详情页等公开访问的场景）
export const publicProductApi = {
  getById: async (id) => {
    return publicApiRequest(`/products/${id}`)
  },
  getColors: async (productId) => {
    return publicApiRequest(`/products/${productId}/colors`)
  },
  getBatches: async (colorId) => {
    return publicApiRequest(`/products/colors/${colorId}/batches`)
  },
}

export const productApi = {
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
    return apiRequest(`/products?${queryParams.toString()}`)
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

// 商品分享API（需要登录，用于生成分享码）
export const productShareApi = {
  generateShareCode: async (id) => {
    // share-code 接口需要 session 参数（不是 sessionId）
    // 从 localStorage 获取 sessionId，然后作为 session 参数传递
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
    
    // 构建 URL，使用 session 参数名（按 Swagger 文档要求）
    let url = `${getApiBaseUrl()}/products/${id}/share-code`
    const queryParams = []
    if (sessionId) {
      queryParams.push(`session=${sessionId}`) // 注意：使用 session 而不是 sessionId
    }
    
    // 获取 tenantId
    let tenantId = localStorage.getItem('currentTenantId')
    if (!tenantId && userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user && user.tenantId !== null && user.tenantId !== undefined) {
          tenantId = String(user.tenantId)
        }
      } catch {}
    }
    if (tenantId) {
      queryParams.push(`tenantId=${tenantId}`)
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    if (tenantId) {
      defaultOptions.headers['X-Tenant-Id'] = tenantId
    }
    if (sessionId) {
      defaultOptions.headers['X-Session-Id'] = sessionId
    }
    
    const response = await fetch(url, {
      ...defaultOptions,
      method: 'POST',
    })
    
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || ''
      let message = `HTTP error! status: ${response.status}`
      
      try {
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null)
          if (errorData && typeof errorData === 'object') {
            message = errorData.message || message
          }
        }
      } catch {}
      
      throw new Error(message)
    }
    
    const result = await response.json()
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data
    }
    return result
  },
}

// 公开的商品分享API（不需要登录，通过分享码获取商品详情）
export const publicProductShareApi = {
  getByCode: async (code) => {
    return publicApiRequest(`/products/share/${code}`)
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
