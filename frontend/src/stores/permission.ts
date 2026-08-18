import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@/router/routes'
import { transformMenusToRoutes } from '@/router/helper'
import type { RouteMenuNode } from '@/types/api'

/**
 * 权限路由 Store
 * - 登录后根据菜单动态生成路由并 addRoute
 * - routes 持久在内存；刷新页面由守卫重新拉取并注册
 */
export const usePermissionStore = defineStore('permission', () => {
  /** 最终侧边栏展示用完整路由（常量 + 动态） */
  const routes = ref<RouteRecordRaw[]>([])
  /** 是否已完成动态路由注册（防重复 addRoute） */
  const isRoutesLoaded = ref(false)

  function setRoutes(menus: RouteMenuNode[]) {
    const dynamicRoutes = transformMenusToRoutes(menus)
    routes.value = constantRoutes.concat(dynamicRoutes)
    isRoutesLoaded.value = true
    return dynamicRoutes
  }

  function reset() {
    routes.value = []
    isRoutesLoaded.value = false
  }

  return {
    routes,
    isRoutesLoaded,
    setRoutes,
    reset,
  }
})
