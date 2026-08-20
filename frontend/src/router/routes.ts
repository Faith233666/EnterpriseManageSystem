import type { RouteRecordRaw } from 'vue-router'

/**
 * 常量路由（无需权限即可访问）
 * 注意：404 不在此处注册，避免抢先匹配动态路由；
 * 由路由守卫在 addRoute 动态菜单后再挂载。
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    name: 'Root',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled', affix: true },
      },
    ],
  },
]

/**
 * 404 挂到 Root 下，避免顶级 catch-all 抢走 /booking 等子路由
 * 动态菜单 addRoute('Root') 完成后再注册
 */
export const notFoundRoute: RouteRecordRaw = {
  path: ':pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/error/404.vue'),
  meta: { title: '404', hidden: true },
}
