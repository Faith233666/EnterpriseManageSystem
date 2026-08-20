import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { constantRoutes, notFoundRoute } from './routes'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

NProgress.configure({ showSpinner: false })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 }),
})

const whiteList = ['/login']

/**
 * 全局前置守卫
 * 1. 无 Token → 跳转登录
 * 2. 有 Token 且未加载动态路由 → 拉取权限菜单并 addRoute
 * 3. 菜单持久化：权限存在 Pinia；刷新后重新拉取并注册
 */
router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  const token = getToken()

  if (!token) {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    return
  }

  // 已登录访问登录页 → 回首页
  if (to.path === '/login') {
    next({ path: '/' })
    return
  }

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (permissionStore.isRoutesLoaded) {
    next()
    return
  }

  try {
    const info = await userStore.fetchPermissionInfo()
    const dynamicRoutes = permissionStore.setRoutes(info.menus)

    dynamicRoutes.forEach((route) => {
      router.addRoute('Root', route)
    })
    // 必须在动态路由之后、作为 Root 子路由注册 404，否则会吞掉业务路径
    if (!router.hasRoute('NotFound')) {
      router.addRoute('Root', notFoundRoute)
    }

    next({ ...to, replace: true })
  } catch (e) {
    console.error('[router] 加载权限失败', e)
    userStore.logout()
    permissionStore.reset()
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
