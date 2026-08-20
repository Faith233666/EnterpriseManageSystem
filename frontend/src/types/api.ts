/** 统一 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

/** 分页结果 */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 登录用户信息 */
export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string | null
}

/** 后端菜单树节点（用于动态路由） */
export interface RouteMenuNode {
  id: number
  parentId: number
  name: string
  path: string
  component: string | null
  redirect: string | null
  perms: string | null
  icon: string | null
  menuType: number
  visible: number
  children?: RouteMenuNode[]
}

/** 权限信息 */
export interface PermissionInfo {
  userInfo: UserInfo
  roles: string[]
  permissions: string[]
  menus: RouteMenuNode[]
}

/** 系统用户（列表/表单） */
export interface SysUserItem {
  id: number
  username: string
  nickname: string
  email: string | null
  phone: string | null
  gender: number
  status: number
  remark: string | null
  createdAt: string
  roles?: Array<{ id: number; roleName: string; roleKey: string }>
}

/** 用户查询参数 */
export interface UserQueryParams {
  page?: number
  pageSize?: number
  username?: string
  nickname?: string
  phone?: string
  status?: number | ''
  beginTime?: string
  endTime?: string
}

/** 用户表单 */
export interface UserFormModel {
  id?: number
  username: string
  password?: string
  nickname: string
  email?: string
  phone?: string
  gender: number
  status: number
  remark?: string
  roleIds?: number[]
}

/** 角色 */
export interface SysRoleItem {
  id: number
  roleName: string
  roleKey: string
  sort: number
  status: number
  remark: string | null
  createdAt: string
  menuIds?: number[]
}

export interface RoleQueryParams {
  page?: number
  pageSize?: number
  roleName?: string
  roleKey?: string
  status?: number | ''
}

export interface RoleFormModel {
  id?: number
  roleName: string
  roleKey: string
  sort: number
  status: number
  remark?: string
  menuIds: number[]
}

export interface RoleOption {
  id: number
  roleName: string
  roleKey: string
}

/** 菜单（管理端树节点） */
export interface SysMenuItem {
  id: number
  parentId: number
  menuName: string
  menuType: number
  path: string | null
  component: string | null
  redirect: string | null
  perms: string | null
  icon: string | null
  sort: number
  visible: number
  status: number
  isFrame: number
  isCache: number
  children?: SysMenuItem[]
}

export interface MenuQueryParams {
  menuName?: string
  status?: number | ''
}

export interface MenuFormModel {
  id?: number
  parentId: number
  menuName: string
  menuType: number
  path?: string
  component?: string
  redirect?: string
  perms?: string
  icon?: string
  sort: number
  visible: number
  status: number
  isFrame: number
  isCache: number
}

/** 会员档案 */
export interface MemberItem {
  id: number
  name: string
  phone: string
  /** 1普通 2黄金 3钻石 */
  level: number
  points: number
  balance: string | number
  status: number
  remark: string | null
  createdAt: string
}

export interface MemberQueryParams {
  page?: number
  pageSize?: number
  name?: string
  phone?: string
  level?: number | ''
  status?: number | ''
}

export interface MemberFormModel {
  id?: number
  name: string
  phone: string
  level: number
  points: number
  balance: number
  status: number
  remark?: string
}

/** 预约状态：1待服务 2已完成 3已取消 4已过期 */
export type BookingStatus = 1 | 2 | 3 | 4

export interface BookingServiceOption {
  id: number
  name: string
  duration: number
}

export interface BookingStaffOption {
  id: number
  name: string
  storeName: string
}

export interface BookingSlot {
  start: string
  end: string
  label: string
  booked: number
  capacity: number
  available: boolean
}

export interface BookingItem {
  id: number
  orderNo: string
  customerName: string
  phone: string
  serviceId: number
  staffId: number
  appointDate: string
  slotStart: string
  slotEnd: string
  status: BookingStatus
  remark: string | null
  cancelReason: string | null
  cancelledAt: string | null
  createdAt: string
  service?: BookingServiceOption
  staff?: BookingStaffOption
}

export interface BookingQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: BookingStatus | ''
  beginDate?: string
  endDate?: string
}

export interface BookingStats {
  pending: number
  done: number
  cancelled: number
  expired: number
  today: number
  total: number
}

export interface BookingFormModel {
  id?: number
  customerName: string
  phone: string
  serviceId?: number
  staffId?: number
  appointDate: string
  slotStart: string
  remark?: string
}

/** 首页看板数据 */
export interface DashboardStats {
  cards: {
    userTotal: number
    userEnabled: number
    roleTotal: number
    menuTotal: number
  }
  visitTrend: {
    days: string[]
    pv: number[]
    uv: number[]
  }
  roleDistribution: Array<{ name: string; value: number }>
  moduleVisits: Array<{ name: string; value: number }>
}
