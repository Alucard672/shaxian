export interface Tenant {
    id: number
    name: string
    code: string
    address: string
    contactPerson?: string
    phone?: string
    status: 'ACTIVE' | 'INACTIVE'
    expiresAt?: string
    createdAt?: string
    updatedAt?: string
}

export interface UserTenant {
    id: number
    userId: number
    tenantId: number
    isDefault: boolean
    tenant: Tenant
    createdAt?: string
    updatedAt?: string
}

export interface CreateTenantRequest {
    name: string
    address: string
}
