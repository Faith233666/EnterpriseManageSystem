<template>
  <div class="role-page">
    <!-- 条件筛选栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item label="角色名称">
          <el-input
            v-model="query.roleName"
            placeholder="请输入角色名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="角色标识">
          <el-input
            v-model="query.roleKey"
            placeholder="请输入角色标识"
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
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="'sys:role:add'"
          type="primary"
          :icon="Plus"
          @click="openDialog()"
        >
          新增角色
        </el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" min-width="140" />
        <el-table-column prop="roleKey" label="角色标识" min-width="140" />
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="hasPermission('sys:role:edit')"
              :model-value="row.status === 1"
              :disabled="row.roleKey === 'admin'"
              inline-prompt
              active-text="启"
              inactive-text="禁"
              @change="(val: string | number | boolean) => handleStatusChange(row, Boolean(val))"
            />
            <el-tag v-else :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'sys:role:edit'"
              type="primary"
              link
              @click="openDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'sys:role:remove'"
              type="danger"
              link
              :disabled="row.roleKey === 'admin'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formModel.id ? '编辑角色' : '新增角色'"
      width="560px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="96px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formModel.roleName" maxlength="64" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色标识" prop="roleKey">
          <el-input
            v-model="formModel.roleKey"
            maxlength="64"
            placeholder="如 admin / editor"
            :disabled="formModel.roleKey === 'admin' && !!formModel.id"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formModel.sort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限" prop="menuIds">
          <div class="menu-tree-wrap">
            <div class="menu-tree-tools">
              <el-checkbox v-model="menuExpand" @change="toggleExpand">展开/折叠</el-checkbox>
              <el-checkbox v-model="menuCheckStrictly">父子联动</el-checkbox>
            </div>
            <el-tree
              ref="menuTreeRef"
              :data="menuTree"
              node-key="id"
              show-checkbox
              :check-strictly="!menuCheckStrictly"
              :default-expand-all="menuExpand"
              :props="{ label: 'menuName', children: 'children' }"
              style="max-height: 280px; overflow: auto"
            />
          </div>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formModel.remark"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
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
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createRoleApi,
  deleteRoleApi,
  getMenuTreeSelectApi,
  getRoleDetailApi,
  getRoleListApi,
  updateRoleApi,
  updateRoleStatusApi,
} from '@/api'
import { usePermission } from '@/hooks/usePermission'
import { refreshDynamicAuth } from '@/utils/refresh-auth'
import type { RoleFormModel, RoleQueryParams, SysMenuItem, SysRoleItem } from '@/types/api'

const { hasPermission } = usePermission()
const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<SysRoleItem[]>([])
const total = ref(0)
const menuTree = ref<SysMenuItem[]>([])
const menuTreeRef = ref<InstanceType<typeof ElTree>>()
const menuExpand = ref(true)
const menuCheckStrictly = ref(true)

const query = reactive<RoleQueryParams>({
  page: 1,
  pageSize: 10,
  roleName: '',
  roleKey: '',
  status: '',
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<RoleFormModel>({
  roleName: '',
  roleKey: '',
  sort: 0,
  status: 1,
  remark: '',
  menuIds: [],
})

const formRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      message: '以字母开头，仅含字母数字_-',
      trigger: 'blur',
    },
  ],
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleListApi({
      page: query.page,
      pageSize: query.pageSize,
      roleName: query.roleName || undefined,
      roleKey: query.roleKey || undefined,
      status: query.status === '' ? undefined : query.status,
    })
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadMenuTree() {
  menuTree.value = await getMenuTreeSelectApi()
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.roleName = ''
  query.roleKey = ''
  query.status = ''
  query.page = 1
  fetchList()
}

function resetForm() {
  formModel.id = undefined
  formModel.roleName = ''
  formModel.roleKey = ''
  formModel.sort = 0
  formModel.status = 1
  formModel.remark = ''
  formModel.menuIds = []
  menuTreeRef.value?.setCheckedKeys([])
  formRef.value?.clearValidate()
}

async function openDialog(row?: SysRoleItem) {
  resetForm()
  if (!menuTree.value.length) {
    await loadMenuTree()
  }
  dialogVisible.value = true
  await nextTick()

  if (row) {
    const detail = await getRoleDetailApi(row.id)
    formModel.id = Number(detail.id)
    formModel.roleName = detail.roleName
    formModel.roleKey = detail.roleKey
    formModel.sort = detail.sort
    formModel.status = detail.status
    formModel.remark = detail.remark || ''
    formModel.menuIds = (detail.menuIds || []).map(Number)
    await nextTick()
    /**
     * 回显只勾选叶子节点。
     * 若把父节点一并 setCheckedKeys，在父子联动下会把已取消的子权限又全部勾上。
     */
    menuTreeRef.value?.setCheckedKeys(
      getLeafCheckedKeys(menuTree.value, formModel.menuIds),
    )
  }
}

/** 从已授权 ID 中提取叶子节点，供树回显 */
function getLeafCheckedKeys(tree: SysMenuItem[], selectedIds: number[]): number[] {
  const selected = new Set(selectedIds.map(Number))
  const leaves: number[] = []
  const walk = (nodes: SysMenuItem[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        walk(node.children)
      } else if (selected.has(Number(node.id))) {
        leaves.push(Number(node.id))
      }
    }
  }
  walk(tree)
  return leaves
}

function collectCheckedMenuIds(): number[] {
  const tree = menuTreeRef.value
  if (!tree) return []
  const checked = (tree.getCheckedKeys(false) as Array<string | number>).map(Number)
  const half = (tree.getHalfCheckedKeys() as Array<string | number>).map(Number)
  // 半选父节点也要保存，否则路由目录会丢失
  return [...new Set([...checked, ...half])]
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload: RoleFormModel = {
      roleName: formModel.roleName,
      roleKey: formModel.roleKey,
      sort: formModel.sort,
      status: formModel.status,
      remark: formModel.remark,
      menuIds: collectCheckedMenuIds(),
    }
    if (formModel.id) {
      await updateRoleApi(formModel.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createRoleApi(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchList()
    await refreshDynamicAuth(router)
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: SysRoleItem) {
  await ElMessageBox.confirm(`确认删除角色「${row.roleName}」吗？`, '提示', {
    type: 'warning',
  })
  await deleteRoleApi(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleStatusChange(row: SysRoleItem, enabled: boolean) {
  const status = enabled ? 1 : 0
  try {
    await updateRoleStatusApi(row.id, status)
    row.status = status
    ElMessage.success(status === 1 ? '已启用' : '已禁用')
  } catch {
    // keep original
  }
}

function toggleExpand(val: string | number | boolean) {
  const nodes = menuTreeRef.value?.store?.nodesMap
  if (!nodes) return
  Object.values(nodes).forEach((node: { expanded: boolean }) => {
    node.expanded = Boolean(val)
  })
}

onMounted(() => {
  fetchList()
  loadMenuTree()
})
</script>

<style scoped lang="scss">
.role-page {
  .search-card {
    margin-bottom: 12px;
  }

  .toolbar {
    margin-bottom: 12px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .menu-tree-wrap {
    width: 100%;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    padding: 8px 12px;
  }

  .menu-tree-tools {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
  }
}
</style>
