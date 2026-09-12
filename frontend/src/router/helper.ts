import type { RouteRecordRaw } from 'vue-router'
import type { RouteMenuNode } from '@/types/api'

/**
 * 页面组件显式映射：避免 Vite glob 扫不到后加的页面而落到 404
 */
const pageLoaders: Record<string, () => Promise<unknown>> = {
  'booking/index': () => import('../views/booking/index.vue'),
  'member/index': () => import('../views/member/index.vue'),
  'report/index': () => import('../views/report/index.vue'),
  'system/user/index': () => import('../views/system/user/index.vue'),
  'system/role/index': () => import('../views/system/role/index.vue'),
  'system/menu/index': () => import('../views/system/menu/index.vue'),
}

const viewModules = import.meta.glob('../views/**/*.vue')

function resolveViewComponent(component: string) {
  const normalized = component.replace(/^\/+/, '').replace(/\.vue$/i, '')
  if (pageLoaders[normalized]) {
    return pageLoaders[normalized]
  }
  const wanted = `/views/${normalized}.vue`
  const matched = Object.entries(viewModules).find(([key]) =>
    key.replace(/\\/g, '/').endsWith(wanted),
  )
  if (matched) {
    return matched[1]
  }
  console.warn(`[router] 未找到组件: ${component}`)
  return () => import('../views/error/404.vue')
}

function toAbs(parentAbs: string, path: string | null | undefined): string {
  const raw = (path || '').trim()
  if (!raw) return parentAbs || '/'
  if (raw.startsWith('/')) return raw
  const base = parentAbs.replace(/\/$/, '')
  return `${base}/${raw}`.replace(/\/{2,}/g, '/')
}

function findFirstPage(menu: RouteMenuNode): RouteMenuNode | null {
  if (menu.menuType === 2 && menu.component && menu.component !== 'Layout') {
    return menu
  }
  for (const child of menu.children || []) {
    const found = findFirstPage(child)
    if (found) return found
  }
  return null
}

/**
 * 转成 Root 布局下的扁平子路由（不要再包一层 Layout，否则空白/404）
 * path 使用相对路径，如 booking、booking/list、system/user
 */
export function transformMenusToRoutes(menus: RouteMenuNode[]): RouteRecordRaw[] {
  const routeMap = new Map<string, RouteRecordRaw>()

  const put = (route: RouteRecordRaw) => {
    routeMap.set(String(route.path), route)
  }

  const walk = (nodes: RouteMenuNode[], parentAbs: string) => {
    for (const menu of nodes) {
      if (menu.menuType === 3) continue
      const abs = toAbs(parentAbs, menu.path)
      const rel = abs.replace(/^\//, '')

      if (menu.menuType === 2 && menu.component && menu.component !== 'Layout') {
        put({
          path: rel,
          name: `Menu_${menu.id}`,
          component: resolveViewComponent(menu.component) as RouteRecordRaw['component'],
          meta: {
            title: menu.name,
            icon: menu.icon,
            perms: menu.perms,
            hidden: menu.visible === 0,
          },
        } as unknown as RouteRecordRaw)
      }

      if (menu.children?.length) {
        walk(menu.children, abs)
      }

      // 目录本身也挂第一个业务页：点「预约中心」进入 /booking 而不是 404
      if (menu.menuType === 1) {
        const first = findFirstPage(menu)
        if (first?.component) {
          put({
            path: rel,
            name: `Menu_${menu.id}`,
            component: resolveViewComponent(first.component) as RouteRecordRaw['component'],
            meta: {
              title: menu.name,
              icon: menu.icon,
              hidden: menu.visible === 0,
            },
          } as unknown as RouteRecordRaw)
        }
      }
    }
  }

  walk(menus, '')
  return Array.from(routeMap.values())
}
