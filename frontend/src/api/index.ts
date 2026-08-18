import { request } from '@/utils/request'
import type {
  MenuFormModel,
  MenuQueryParams,
  PageResult,
  PermissionInfo,
  RoleFormModel,
  RoleOption,
  RoleQueryParams,
  SysMenuItem,
  SysRoleItem,
  SysUserItem,
  UserFormModel,
  UserInfo,
  UserQueryParams,
  DashboardStats,
} from '@/types/api'

/** 登录 */
export function loginApi(data: { username: string; password: string }) {
  return request<{
    accessToken: string
    tokenType: string
    userInfo: UserInfo
  }>({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

/** 获取当前用户角色 / 权限码 / 菜单树 */
export function getAuthInfoApi() {
  return request<PermissionInfo>({
    url: '/auth/info',
    method: 'get',
  })
}

// -------------------- 用户 --------------------

export function getUserListApi(params: UserQueryParams) {
  return request<PageResult<SysUserItem>>({
    url: '/system/user/list',
    method: 'get',
    params,
  })
}

export function createUserApi(data: UserFormModel) {
  return request<SysUserItem>({
    url: '/system/user',
    method: 'post',
    data,
  })
}

export function updateUserApi(id: number, data: UserFormModel) {
  return request<SysUserItem>({
    url: `/system/user/${id}`,
    method: 'put',
    data,
  })
}

export function deleteUserApi(id: number) {
  return request<null>({
    url: `/system/user/${id}`,
    method: 'delete',
  })
}

export function updateUserStatusApi(id: number, status: number) {
  return request<null>({
    url: `/system/user/${id}/status`,
    method: 'patch',
    data: { status },
  })
}

/** 首页看板统计 */
export function getDashboardStatsApi() {
  return request<DashboardStats>({
    url: '/dashboard/stats',
    method: 'get',
  })
}

// -------------------- 角色 --------------------

export function getRoleListApi(params: RoleQueryParams) {
  return request<PageResult<SysRoleItem>>({
    url: '/system/role/list',
    method: 'get',
    params,
  })
}

export function getRoleOptionsApi() {
  return request<RoleOption[]>({
    url: '/system/role/options',
    method: 'get',
  })
}

export function getRoleDetailApi(id: number) {
  return request<SysRoleItem>({
    url: `/system/role/${id}`,
    method: 'get',
  })
}

export function createRoleApi(data: RoleFormModel) {
  return request<SysRoleItem>({
    url: '/system/role',
    method: 'post',
    data,
  })
}

export function updateRoleApi(id: number, data: RoleFormModel) {
  return request<SysRoleItem>({
    url: `/system/role/${id}`,
    method: 'put',
    data,
  })
}

export function deleteRoleApi(id: number) {
  return request<null>({
    url: `/system/role/${id}`,
    method: 'delete',
  })
}

export function updateRoleStatusApi(id: number, status: number) {
  return request<null>({
    url: `/system/role/${id}/status`,
    method: 'patch',
    data: { status },
  })
}

// -------------------- 菜单 --------------------

export function getMenuTreeApi(params?: MenuQueryParams) {
  return request<SysMenuItem[]>({
    url: '/system/menu/tree',
    method: 'get',
    params,
  })
}

export function getMenuTreeSelectApi() {
  return request<SysMenuItem[]>({
    url: '/system/menu/treeselect',
    method: 'get',
  })
}

export function createMenuApi(data: MenuFormModel) {
  return request<SysMenuItem>({
    url: '/system/menu',
    method: 'post',
    data,
  })
}

export function updateMenuApi(id: number, data: MenuFormModel) {
  return request<SysMenuItem>({
    url: `/system/menu/${id}`,
    method: 'put',
    data,
  })
}

export function deleteMenuApi(id: number) {
  return request<null>({
    url: `/system/menu/${id}`,
    method: 'delete',
  })
}
