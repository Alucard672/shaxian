// API客户端类型声明

export interface ApiClient {
    get: (endpoint: string, params?: Record<string, any>) => Promise<any>
    post: (endpoint: string, data?: any) => Promise<any>
    put: (endpoint: string, data?: any) => Promise<any>
    delete: (endpoint: string) => Promise<any>
}

export interface ProductApi {
    getAll: () => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<void>
    getColors: (productId: string) => Promise<any[]>
    createColor: (productId: string, data: any) => Promise<any>
    updateColor: (id: string, data: any) => Promise<any>
    deleteColor: (id: string) => Promise<void>
    getBatches: (colorId: string) => Promise<any[]>
    createBatch: (colorId: string, data: any) => Promise<any>
    updateBatch: (id: string, data: any) => Promise<any>
    deleteBatch: (id: string) => Promise<void>
}

export interface AuthApi {
    login: (data: { phone: string; password: string }) => Promise<{
        success: boolean
        message: string
        user: {
            id: string
            name: string
            phone?: string
            email?: string
            role?: string
            position?: string
        }
    }>
    logout: () => Promise<{ success: boolean; message: string }>
    changePassword?: (data: {
        username: string
        oldPassword: string
        newPassword: string
    }) => Promise<{ message: string }>
    getMe?: (username: string) => Promise<any>
}

export interface ContactApi {
    getAllCustomers: () => Promise<any[]>
    getCustomer: (id: string) => Promise<any>
    createCustomer: (data: any) => Promise<any>
    updateCustomer: (id: string, data: any) => Promise<any>
    deleteCustomer: (id: string) => Promise<void>
    getAllSuppliers: () => Promise<any[]>
    getSupplier: (id: string) => Promise<any>
    createSupplier: (data: any) => Promise<any>
    updateSupplier: (id: string, data: any) => Promise<any>
    deleteSupplier: (id: string) => Promise<void>
}

export interface SettingsApi {
    getStoreInfo: () => Promise<any>
    updateStoreInfo: (data: any) => Promise<any>
    getAllEmployees: () => Promise<any[]>
    getEmployee: (id: string) => Promise<any>
    createEmployee: (data: any) => Promise<any>
    updateEmployee: (id: string, data: any) => Promise<any>
    deleteEmployee: (id: string) => Promise<void>
    getAllRoles: () => Promise<any[]>
    createRole: (data: any) => Promise<any>
    updateRole: (id: string, data: any) => Promise<any>
    deleteRole: (id: string) => Promise<void>
    getAllQueries: (params?: any) => Promise<any[]>
    createQuery: (data: any) => Promise<any>
    getInventoryAlert: () => Promise<any>
    updateInventoryAlert: (data: any) => Promise<any>
    getParams: () => Promise<any>
    updateParams: (data: any) => Promise<any>
}

export interface TemplateApi {
    getAll: (params?: any) => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<void>
    incrementUsage: (id: string) => Promise<any>
}

export interface AccountApi {
    getAllReceivables: (params?: any) => Promise<any[]>
    createReceivable: (data: any) => Promise<any>
    getReceipts: (id: string) => Promise<any[]>
    createReceipt: (id: string, data: any) => Promise<any>
    getAllReceipts: () => Promise<any[]>
    getAllPayables: (params?: any) => Promise<any[]>
    createPayable: (data: any) => Promise<any>
    getPayments: (id: string) => Promise<any[]>
    createPayment: (id: string, data: any) => Promise<any>
    getAllPayments: () => Promise<any[]>
}

export interface PurchaseApi {
    getAll: (params?: any) => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<void>
}

export interface SalesApi {
    getAll: (params?: any) => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<void>
    checkStock: (batchId: string, quantity: number) => Promise<any>
}

export interface DyeingApi {
    getAll: (params?: any) => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<void>
}

export interface InventoryApi {
    getAllAdjustments: (params?: any) => Promise<any[]>
    getAdjustment: (id: string) => Promise<any>
    createAdjustment: (data: any) => Promise<any>
    updateAdjustment: (id: string, data: any) => Promise<any>
    deleteAdjustment: (id: string) => Promise<void>
    getAllChecks: (params?: any) => Promise<any[]>
    getCheck: (id: string) => Promise<any>
    createCheck: (data: any) => Promise<any>
    updateCheck: (id: string, data: any) => Promise<any>
    deleteCheck: (id: string) => Promise<void>
}

export const api: ApiClient
export const productApi: ProductApi
export const authApi: AuthApi
export const contactApi: ContactApi
export const settingsApi: SettingsApi
export const templateApi: TemplateApi
export const accountApi: AccountApi
export const purchaseApi: PurchaseApi
export const salesApi: SalesApi
export const dyeingApi: DyeingApi
export const inventoryApi: InventoryApi

export default api
