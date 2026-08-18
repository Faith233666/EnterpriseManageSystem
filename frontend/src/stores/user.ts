import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi, getAuthInfoApi } from '@/api'
import {
  clearAuthStorage,
  getToken,
  setCachedUserInfo,
  setToken,
} from '@/utils/auth'
import type { PermissionInfo, RouteMenuNode, UserInfo } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const userInfo = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])
  /** 后端返回的菜单树（持久化到 store，刷新后重新拉取） */
  const menus = ref<RouteMenuNode[]>([])

  async function login(username: string, password: string) {
    const data = await loginApi({ username, password })
    token.value = data.accessToken
    setToken(data.accessToken)
    userInfo.value = data.userInfo
    setCachedUserInfo(data.userInfo)
  }

  /** 拉取权限信息（角色 + 按钮权限 + 菜单） */
  async function fetchPermissionInfo(): Promise<PermissionInfo> {
    const info = await getAuthInfoApi()
    userInfo.value = info.userInfo
    setCachedUserInfo(info.userInfo)
    roles.value = info.roles
    permissions.value = info.permissions
    menus.value = info.menus
    return info
  }

  function logout() {
    token.value = null
    userInfo.value = null
    roles.value = []
    permissions.value = []
    menus.value = []
    clearAuthStorage()
  }

  /** 是否具备某权限（按后端下发的权限码严格校验） */
  function hasPermission(perm: string | string[]): boolean {
    const list = Array.isArray(perm) ? perm : [perm]
    return list.some((p) => permissions.value.includes(p))
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    menus,
    login,
    fetchPermissionInfo,
    logout,
    hasPermission,
  }
})
