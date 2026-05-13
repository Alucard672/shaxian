/**
 * 当前登录用户信息统一来源。
 * 直接读 localStorage.user（在 Login.tsx 写入），并暴露 getOperatorName() 给 store 使用，
 * 替换历史散落的 operator: '当前用户' / '管理员' 硬编码。
 */

export interface CurrentUser {
  userId?: number | string
  username?: string | null
  phone?: string
  tenantId?: number | string
  tenantName?: string
  tenantCode?: string
  superAdmin?: boolean
  tenantExpiresAt?: string
}

function readUserFromStorage(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw)
    return u as CurrentUser
  } catch {
    return null
  }
}

/** 获取当前用户对象（懒读 localStorage，避免 store 提前实例化的循环依赖） */
export function getCurrentUser(): CurrentUser | null {
  return readUserFromStorage()
}

/**
 * 获取用于"操作人"字段的显示名：username → phone → '未知用户'
 * 所有 store 中原来硬编码 '当前用户' / '管理员' 的地方应该改用本函数。
 */
export function getOperatorName(): string {
  const u = readUserFromStorage()
  if (!u) return '未知用户'
  return (u.username && u.username.trim()) || u.phone || '未知用户'
}
