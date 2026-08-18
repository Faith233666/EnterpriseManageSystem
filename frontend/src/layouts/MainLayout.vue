<template>
  <div class="layout">
    <aside class="layout__aside" :class="{ 'is-collapse': collapsed }">
      <div class="logo">
        <span v-if="!collapsed">企业管理后台</span>
        <span v-else>EMS</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          background-color="#001529"
          text-color="#ffffffa6"
          active-text-color="#fff"
          router
        >
          <template v-for="item in sidebarMenus" :key="item.index">
            <!-- 多子项：折叠菜单 -->
            <el-sub-menu v-if="item.children?.length" :index="item.index">
              <template #title>
                <el-icon v-if="item.icon">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </template>
              <el-menu-item
                v-for="child in item.children"
                :key="child.index"
                :index="child.index"
              >
                <el-icon v-if="child.icon">
                  <component :is="child.icon" />
                </el-icon>
                <span>{{ child.title }}</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 独立菜单（含首页） -->
            <el-menu-item v-else :index="item.index">
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>
    </aside>

    <section class="layout__main">
      <header class="layout__header">
        <div class="left">
          <el-icon class="trigger" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta?.title">
              {{ route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="right">
          <el-dropdown @command="onCommand">
            <span class="user-entry">
              <el-avatar :size="28">{{ avatarText }}</el-avatar>
              <span class="name">{{ userStore.userInfo?.nickname || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="layout__content">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'

interface SidebarMenuItem {
  index: string
  title: string
  icon?: string
  children?: SidebarMenuItem[]
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const collapsed = ref(false)
const activeMenu = computed(() => route.path)
const avatarText = computed(
  () => (userStore.userInfo?.nickname || 'U').slice(0, 1),
)

/**
 * 侧边栏菜单：
 * - 仅 1 个可见子路由时提升为独立一级菜单（首页不再变成子菜单）
 * - 多个子路由仍显示为折叠菜单
 */
const sidebarMenus = computed<SidebarMenuItem[]>(() => {
  const result: SidebarMenuItem[] = []
  for (const r of permissionStore.routes) {
    if (r.meta?.hidden || r.path === '/login' || r.name === 'NotFound') continue

    const children = visibleChildren(r)
    if (children.length === 1 && !(r.meta as Record<string, unknown> | undefined)?.alwaysShow) {
      const only = children[0]
      result.push({
        index: resolvePath(r.path, String(only.path || '')),
        title: String(only.meta?.title || r.meta?.title || ''),
        icon: only.meta?.icon ? String(only.meta.icon) : undefined,
      })
      continue
    }

    if (children.length > 0) {
      result.push({
        index: resolvePath(r.path),
        title: String(r.meta?.title || ''),
        icon: r.meta?.icon ? String(r.meta.icon) : undefined,
        children: children.map((c) => ({
          index: resolvePath(r.path, String(c.path || '')),
          title: String(c.meta?.title || ''),
          icon: c.meta?.icon ? String(c.meta.icon) : undefined,
        })),
      })
      continue
    }

    result.push({
      index: resolvePath(r.path),
      title: String(r.meta?.title || ''),
      icon: r.meta?.icon ? String(r.meta.icon) : undefined,
    })
  }
  return result
})

function visibleChildren(parent: RouteRecordRaw) {
  return (parent.children || []).filter((c) => !c.meta?.hidden)
}

function resolvePath(parent: string, child = '') {
  const base = parent === '/' ? '' : parent.replace(/\/$/, '')
  const normalized = !base || base.startsWith('/') ? base : `/${base}`
  if (!child) return normalized || '/'
  return `${normalized}/${child.replace(/^\//, '')}`
}

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    userStore.logout()
    permissionStore.reset()
    await router.replace('/login')
    window.location.reload()
  }
}
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100%;

  &__aside {
    width: 220px;
    background: #001529;
    transition: width 0.2s;
    display: flex;
    flex-direction: column;

    &.is-collapse {
      width: 64px;
    }

    .logo {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 1px;
      border-bottom: 1px solid #ffffff14;
    }

    .el-menu {
      border-right: none;
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__header {
    height: 56px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    box-shadow: 0 1px 4px rgb(0 21 41 / 8%);

    .left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .trigger {
      font-size: 20px;
      cursor: pointer;
    }

    .user-entry {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .name {
        font-size: 14px;
      }
    }
  }

  &__content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }
}
</style>
