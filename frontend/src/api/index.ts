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
  MemberFormModel,
  MemberItem,
  MemberQueryParams,
  BookingFormModel,
  BookingItem,
  BookingQueryParams,
  BookingSlot,
  BookingServiceOption,
  BookingStaffOption,
  BookingStats,
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

// -------------------- 会员档案 --------------------

export function getMemberListApi(params: MemberQueryParams) {
  return request<PageResult<MemberItem>>({
    url: '/member/list',
    method: 'get',
    params,
  })
}

export function createMemberApi(data: MemberFormModel) {
  return request<MemberItem>({
    url: '/member',
    method: 'post',
    data,
  })
}

export function updateMemberApi(id: number, data: MemberFormModel) {
  return request<MemberItem>({
    url: `/member/${id}`,
    method: 'put',
    data,
  })
}

export function deleteMemberApi(id: number) {
  return request<null>({
    url: `/member/${id}`,
    method: 'delete',
  })
}

export function batchDeleteMemberApi(ids: number[]) {
  return request<null>({
    url: '/member/batch-remove',
    method: 'post',
    data: { ids },
  })
}

// -------------------- 预约管理 --------------------

export function getBookingOptionsApi() {
  return request<{
    services: BookingServiceOption[]
    staffs: BookingStaffOption[]
  }>({
    url: '/booking/options',
    method: 'get',
  })
}

export function getBookingSlotsApi(params: {
  date: string
  staffId: number
  excludeId?: number
}) {
  return request<BookingSlot[]>({
    url: '/booking/slots',
    method: 'get',
    params,
  })
}

export function getBookingStatsApi() {
  return request<BookingStats>({
    url: '/booking/stats',
    method: 'get',
  })
}

export function getBookingListApi(params: BookingQueryParams) {
  return request<PageResult<BookingItem>>({
    url: '/booking/list',
    method: 'get',
    params,
  })
}

export function getBookingDetailApi(id: number) {
  return request<BookingItem>({
    url: `/booking/${id}`,
    method: 'get',
  })
}

export function createBookingApi(data: BookingFormModel) {
  return request<BookingItem>({
    url: '/booking',
    method: 'post',
    data,
  })
}

export function updateBookingApi(id: number, data: BookingFormModel) {
  return request<BookingItem>({
    url: `/booking/${id}`,
    method: 'put',
    data,
  })
}

export function cancelBookingApi(id: number, reason: string) {
  return request<BookingItem>({
    url: `/booking/${id}/cancel`,
    method: 'post',
    data: { reason },
  })
}

export function deleteBookingApi(id: number) {
  return request<null>({
    url: `/booking/${id}`,
    method: 'delete',
  })
}

export function batchDeleteBookingApi(ids: number[]) {
  return request<null>({
    url: '/booking/batch-remove',
    method: 'post',
    data: { ids },
  })
}
