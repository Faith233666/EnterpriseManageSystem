<template>
  <div class="menu-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item label="菜单名称">
          <el-input
            v-model="query.menuName"
            placeholder="请输入菜单名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchTree">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="'sys:menu:add'"
          type="primary"
          :icon="Plus"
          @click="openDialog()"
        >
          新增菜单
        </el-button>
        <el-button @click="toggleExpandAll">展开/折叠</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="menuName" label="菜单名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="90" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon"><component :is="row.icon" /></el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="menuTypeTag(row.menuType)" size="small">
              {{ menuTypeLabel(row.menuType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140">
          <template #default="{ row }">{{ row.path || '-' }}</template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="160">
          <template #default="{ row }">{{ row.component || '-' }}</template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" min-width="150">
          <template #default="{ row }">{{ row.perms || '-' }}</template>
        </el-table-column>
        <el-table-column label="显示" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'info'" size="small">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'sys:menu:add'"
              type="primary"
              link
              :disabled="row.menuType === 3"
              @click="openDialog(undefined, row)"
            >
              新增
            </el-button>
            <el-button
              v-permission="'sys:menu:edit'"
              type="primary"
              link
              @click="openDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'sys:menu:remove'"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="formModel.id ? '编辑菜单' : '新增菜单'"
      width="640px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="上级菜单" prop="parentId">
          <el-tree-select
            v-model="formModel.parentId"
            :data="parentOptions"
            check-strictly
            :render-after-expand="false"
            :props="{ label: 'menuName', value: 'id', children: 'children' }"
            placeholder="顶级菜单"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="formModel.menuType">
            <el-radio :value="1">目录</el-radio>
            <el-radio :value="2">菜单</el-radio>
            <el-radio :value="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="formModel.menuName" maxlength="64" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item v-if="formModel.menuType !== 3" label="图标" prop="icon">
          <el-input v-model="formModel.icon" placeholder="Element Plus 图标名，如 Setting" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formModel.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item
          v-if="formModel.menuType !== 3"
          label="路由地址"
          prop="path"
        >
          <el-input
            v-model="formModel.path"
            :placeholder="formModel.menuType === 1 ? '/system' : 'user'"
          />
        </el-form-item>
        <el-form-item
          v-if="formModel.menuType === 1"
          label="组件"
          prop="component"
        >
          <el-input v-model="formModel.component" placeholder="Layout" />
        </el-form-item>
        <el-form-item
          v-if="formModel.menuType === 2"
          label="组件路径"
          prop="component"
        >
          <el-input
            v-model="formModel.component"
            placeholder="如 system/user/index"
          />
        </el-form-item>
        <el-form-item v-if="formModel.menuType === 1" label="重定向" prop="redirect">
          <el-input v-model="formModel.redirect" placeholder="如 /system/user" />
        </el-form-item>
        <el-form-item
          v-if="formModel.menuType === 3 || formModel.menuType === 2"
          label="权限标识"
          prop="perms"
        >
          <el-input
            v-model="formModel.perms"
            placeholder="如 sys:user:add"
          />
        </el-form-item>
        <el-form-item v-if="formModel.menuType !== 3" label="显示状态" prop="visible">
          <el-radio-group v-model="formModel.visible">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createMenuApi,
  deleteMenuApi,
  getMenuTreeApi,
  updateMenuApi,
} from '@/api'
import { refreshDynamicAuth } from '@/utils/refresh-auth'
import type { MenuFormModel, MenuQueryParams, SysMenuItem } from '@/types/api'

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<SysMenuItem[]>([])
const tableRef = ref<TableInstance>()
const expandAll = ref(true)

const query = reactive<MenuQueryParams>({
  menuName: '',
  status: '',
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<MenuFormModel>({
  parentId: 0,
  menuName: '',
  menuType: 1,
  path: '',
  component: 'Layout',
  redirect: '',
  perms: '',
  icon: '',
  sort: 0,
  visible: 1,
  status: 1,
  isFrame: 0,
  isCache: 0,
})

const formRules = computed<FormRules>(() => ({
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  path:
    formModel.menuType === 3
      ? []
      : [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
  component:
    formModel.menuType === 2
      ? [{ required: true, message: '请输入组件路径', trigger: 'blur' }]
      : [],
  perms:
    formModel.menuType === 3
      ? [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
      : [],
}))

/** 上级菜单选项：根节点 + 树（排除按钮） */
const parentOptions = computed(() => {
  const root = {
    id: 0,
    parentId: -1,
    menuName: '顶级菜单',
    menuType: 1,
    path: null,
    component: null,
    redirect: null,
    perms: null,
    icon: null,
    sort: 0,
    visible: 1,
    status: 1,
    isFrame: 0,
    isCache: 0,
    children: filterNonButton(tableData.value),
  }
  return [root]
})

function filterNonButton(list: SysMenuItem[]): SysMenuItem[] {
  return list
    .filter((m) => m.menuType !== 3)
    .map((m) => ({
      ...m,
      children: m.children ? filterNonButton(m.children) : undefined,
    }))
}

function menuTypeLabel(type: number) {
  return ({ 1: '目录', 2: '菜单', 3: '按钮' } as Record<number, string>)[type] || '-'
}

function menuTypeTag(type: number) {
  return ({ 1: 'warning', 2: 'success', 3: 'info' } as Record<number, string>)[type] || 'info'
}

async function fetchTree() {
  loading.value = true
  try {
    tableData.value = await getMenuTreeApi({
      menuName: query.menuName || undefined,
      status: query.status === '' ? undefined : query.status,
    })
  } finally {
    loading.value = false
  }
}

function handleReset() {
  query.menuName = ''
  query.status = ''
  fetchTree()
}

function toggleExpandAll() {
  expandAll.value = !expandAll.value
  toggleRowExpansion(tableData.value, expandAll.value)
}

function toggleRowExpansion(rows: SysMenuItem[], expanded: boolean) {
  rows.forEach((row) => {
    tableRef.value?.toggleRowExpansion(row, expanded)
    if (row.children?.length) {
      toggleRowExpansion(row.children, expanded)
    }
  })
}

function resetForm() {
  formModel.id = undefined
  formModel.parentId = 0
  formModel.menuName = ''
  formModel.menuType = 1
  formModel.path = ''
  formModel.component = 'Layout'
  formModel.redirect = ''
  formModel.perms = ''
  formModel.icon = ''
  formModel.sort = 0
  formModel.visible = 1
  formModel.status = 1
  formModel.isFrame = 0
  formModel.isCache = 0
  formRef.value?.clearValidate()
}

/**
 * @param row 编辑目标；为空则新增
 * @param parent 从某节点下新增时传入父节点
 */
function openDialog(row?: SysMenuItem, parent?: SysMenuItem) {
  resetForm()
  if (row) {
    formModel.id = row.id
    formModel.parentId = row.parentId
    formModel.menuName = row.menuName
    formModel.menuType = row.menuType
    formModel.path = row.path || ''
    formModel.component = row.component || ''
    formModel.redirect = row.redirect || ''
    formModel.perms = row.perms || ''
    formModel.icon = row.icon || ''
    formModel.sort = row.sort
    formModel.visible = row.visible
    formModel.status = row.status
    formModel.isFrame = row.isFrame
    formModel.isCache = row.isCache
  } else if (parent) {
    formModel.parentId = parent.id
    // 在目录下默认新增菜单；在菜单下默认新增按钮
    formModel.menuType = parent.menuType === 2 ? 3 : 2
    formModel.component = formModel.menuType === 2 ? '' : ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload: MenuFormModel = {
      parentId: formModel.parentId ?? 0,
      menuName: formModel.menuName,
      menuType: formModel.menuType,
      path: formModel.menuType === 3 ? undefined : formModel.path,
      component:
        formModel.menuType === 3
          ? undefined
          : formModel.component || (formModel.menuType === 1 ? 'Layout' : undefined),
      redirect: formModel.menuType === 1 ? formModel.redirect : undefined,
      perms: formModel.perms || undefined,
      icon: formModel.menuType === 3 ? undefined : formModel.icon,
      sort: formModel.sort,
      visible: formModel.visible,
      status: formModel.status,
      isFrame: formModel.isFrame,
      isCache: formModel.isCache,
    }

    if (formModel.id) {
      await updateMenuApi(formModel.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createMenuApi(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchTree()
    await refreshDynamicAuth(router)
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: SysMenuItem) {
  await ElMessageBox.confirm(`确认删除「${row.menuName}」吗？`, '提示', {
    type: 'warning',
  })
  await deleteMenuApi(row.id)
  ElMessage.success('删除成功')
  await fetchTree()
  await refreshDynamicAuth(router)
}

onMounted(() => {
  fetchTree()
})
</script>

<style scoped lang="scss">
.menu-page {
  .search-card {
    margin-bottom: 12px;
  }

  .toolbar {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
  }
}
</style>
