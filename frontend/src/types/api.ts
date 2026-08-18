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
