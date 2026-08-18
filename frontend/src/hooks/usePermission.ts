import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 按钮级权限 Hooks
 * @example
 *   const { hasPermission } = usePermission()
 *   if (hasPermission('sys:user:add')) { ... }
 */
export function usePermission() {
  const userStore = useUserStore()

  const permissions = computed(() => userStore.permissions)
  const roles = computed(() => userStore.roles)

  function hasPermission(perm: string | string[]): boolean {
    return userStore.hasPermission(perm)
  }

  function hasRole(role: string | string[]): boolean {
    const list = Array.isArray(role) ? role : [role]
    return list.some((r) => roles.value.includes(r))
  }

  return {
    permissions,
    roles,
    hasPermission,
    hasRole,
  }
}
