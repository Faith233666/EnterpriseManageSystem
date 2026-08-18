import type { RouteRecordRaw } from 'vue-router'
import type { RouteMenuNode } from '@/types/api'
import Layout from '@/layouts/MainLayout.vue'

/**
 * Vite 动态导入 views 下所有页面组件
 * 约定：后端 component 字段为相对 views 的路径，如 system/user/index
 */
const viewModules = import.meta.glob('../views/**/*.vue')

function resolveViewComponent(component: string) {
  const path = `../views/${component}.vue`
  const loader = viewModules[path]
  if (!loader) {
    console.warn(`[router] 未找到组件: ${component} -> ${path}`)
    return () => import('../views/error/404.vue')
  }
  return loader
}

/**
 * 将后端菜单树转换为 Vue Router 路由表
 * - 顶级目录挂到 Layout
 * - 菜单节点挂 component
 * - 按钮(menuType=3)不参与路由
 */
export function transformMenusToRoutes(menus: RouteMenuNode[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const menu of menus) {
    if (menu.menuType === 3) continue

    const route: RouteRecordRaw = {
      path: menu.path.startsWith('/') ? menu.path : `/${menu.path}`,
      name: `Menu_${menu.id}`,
      meta: {
        title: menu.name,
        icon: menu.icon,
        perms: menu.perms,
        hidden: menu.visible === 0,
      },
      children: [],
    }

    // 一级目录：使用 Layout
    if (menu.menuType === 1 && menu.component === 'Layout') {
      route.component = Layout
      if (menu.redirect) {
        route.redirect = menu.redirect
      }
      if (menu.children?.length) {
        route.children = buildChildren(menu.children)
      }
    } else if (menu.menuType === 2 && menu.component) {
      // 极端情况：顶级就是菜单页
      route.component = resolveViewComponent(menu.component)
    }

    result.push(route)
  }

  return result
}

function buildChildren(menus: RouteMenuNode[]): RouteRecordRaw[] {
  return menus
    .filter((m) => m.menuType !== 3)
    .map((menu) => {
      const child = {
        path: menu.path.replace(/^\//, ''),
        name: `Menu_${menu.id}`,
        component: menu.component && menu.component !== 'Layout'
          ? resolveViewComponent(menu.component)
          : undefined,
        meta: {
          title: menu.name,
          icon: menu.icon,
          perms: menu.perms,
          hidden: menu.visible === 0,
        },
        children: menu.children?.length
          ? buildChildren(menu.children)
          : undefined,
      } as unknown as RouteRecordRaw

      return child
    })
}
