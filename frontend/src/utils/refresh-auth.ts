import type { Router } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import { notFoundRoute } from '@/router/routes'

/**
 * 角色/菜单变更后软刷新权限（不整页 reload）
 * - 重新拉取权限码与菜单
 * - 重新注册动态路由（侧边栏随之更新）
 * - v-permission 监听 permissions，按钮即时显隐
 */
export async function refreshDynamicAuth(router: Router) {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const currentFullPath = router.currentRoute.value.fullPath

  router
    .getRoutes()
    .map((r) => r.name)
    .filter((name): name is string | symbol => !!name && String(name).startsWith('Menu_'))
    .forEach((name) => {
      if (router.hasRoute(name)) {
        router.removeRoute(name)
      }
    })
  if (router.hasRoute('NotFound')) {
    router.removeRoute('NotFound')
  }

  permissionStore.reset()
  const info = await userStore.fetchPermissionInfo()
  const dynamicRoutes = permissionStore.setRoutes(info.menus)
  dynamicRoutes.forEach((route) => {
    router.addRoute('Root', route)
  })
  if (!router.hasRoute('NotFound')) {
    router.addRoute('Root', notFoundRoute)
  }

  // 当前页已无对应路由时回首页
  const resolved = router.resolve(currentFullPath)
  const lost =
    !resolved.matched.length ||
    resolved.name === 'NotFound' ||
    resolved.matched.some((m) => m.name === 'NotFound')
  if (lost) {
    await router.replace('/dashboard')
  }
}
