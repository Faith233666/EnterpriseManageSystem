const TOKEN_KEY = 'ems_access_token'
const USER_KEY = 'ems_user_info'

/** Token 持久化 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 用户信息简易缓存（刷新后快速展示） */
export function getCachedUserInfo(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function setCachedUserInfo(info: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(info))
}

export function clearAuthStorage(): void {
  removeToken()
  localStorage.removeItem(USER_KEY)
}
