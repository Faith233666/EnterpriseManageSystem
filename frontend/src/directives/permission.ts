import type { App, Directive, DirectiveBinding } from 'vue'
import { watch } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * 按钮级权限指令 v-permission
 * 使用显示/隐藏（而非移除 DOM），以便权限变更后可即时恢复
 * @example
 *   <el-button v-permission="'sys:user:add'">新增</el-button>
 *   <el-button v-permission="['sys:user:edit', 'sys:user:add']">编辑</el-button>
 */
type PermEl = HTMLElement & {
  __permStop?: () => void
  __permDisplay?: string
}

const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding: DirectiveBinding<string | string[]>) {
    const permEl = el as PermEl
    permEl.__permDisplay = el.style.display
    applyPermission(permEl, binding)

    const userStore = useUserStore()
    // 权限码变化时自动重新校验（无需整页刷新）
    permEl.__permStop = watch(
      () => userStore.permissions.slice(),
      () => applyPermission(permEl, binding),
    )
  },
  updated(el, binding: DirectiveBinding<string | string[]>) {
    applyPermission(el as PermEl, binding)
  },
  unmounted(el) {
    const permEl = el as PermEl
    permEl.__permStop?.()
    delete permEl.__permStop
  },
}

function applyPermission(
  el: PermEl,
  binding: DirectiveBinding<string | string[]>,
) {
  const { value } = binding
  if (!value || (Array.isArray(value) && value.length === 0)) {
    throw new Error(`[v-permission] 需要权限标识，如 v-permission="'sys:user:add'"`)
  }

  const userStore = useUserStore()
  const ok = userStore.hasPermission(value)
  if (ok) {
    el.style.display = el.__permDisplay ?? ''
    el.removeAttribute('disabled')
  } else {
    el.style.display = 'none'
  }
}

export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective)
}

export default permissionDirective
