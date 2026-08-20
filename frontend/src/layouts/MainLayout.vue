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
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import type { RouteMenuNode } from '@/types/api'

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
const avatarText = computed(
  () => (userStore.userInfo?.nickname || 'U').slice(0, 1),
)

function absPath(parent: string, child = '') {
  const base = parent.startsWith('/') ? parent : `/${parent}`
  if (!child) return base || '/'
  if (child.startsWith('/')) return child
  return `${base.replace(/\/$/, '')}/${child}`
}

function menusToSidebar(menus: RouteMenuNode[]): SidebarMenuItem[] {
  return menus
    .filter((m) => m.menuType !== 3 && m.visible !== 0)
    .flatMap((m) => {
      const kids = (m.children || []).filter(
        (c) => c.menuType !== 3 && c.visible !== 0,
      )
      // 空目录不展示，避免点进去 404
      if (m.menuType === 1 && kids.length === 0) {
        return []
      }
      // 只有一个子页的目录（预约中心/会员中心）显示为一级菜单
      if (m.menuType === 1 && kids.length === 1) {
        return [
          {
            index: absPath(m.path),
            title: m.name,
            icon: m.icon || kids[0]?.icon || undefined,
          },
        ]
      }
      if (kids.length > 0) {
        return [
          {
            index: absPath(m.path),
            title: m.name,
            icon: m.icon || undefined,
            children: kids.map((c) => ({
              index: absPath(m.path, c.path),
              title: c.name,
              icon: c.icon || undefined,
            })),
          },
        ]
      }
      return [
        {
          index: absPath(m.path),
          title: m.name,
          icon: m.icon || undefined,
        },
      ]
    })
}

const sidebarMenus = computed<SidebarMenuItem[]>(() => [
  { index: '/dashboard', title: '首页', icon: 'HomeFilled' },
  ...menusToSidebar(userStore.menus),
])

const activeMenu = computed(() => {
  const path = route.path
  const indexes: string[] = []
  for (const item of sidebarMenus.value) {
    indexes.push(item.index)
    item.children?.forEach((c) => indexes.push(c.index))
  }
  return (
    indexes
      .filter((i) => path === i || path.startsWith(`${i}/`))
      .sort((a, b) => b.length - a.length)[0] || path
  )
})

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
