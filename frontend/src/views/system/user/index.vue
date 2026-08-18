<template>
  <div class="user-page">
    <!-- 条件筛选栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item label="用户名">
          <el-input
            v-model="query.username"
            placeholder="请输入用户名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="query.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="query.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 160px"
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
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作工具栏 + 分页表格 -->
    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button
          v-permission="'sys:user:add'"
          type="primary"
          :icon="Plus"
          @click="openDialog()"
        >
          新增用户
        </el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="160">
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="140">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles || []"
              :key="role.id"
              size="small"
              class="role-tag"
            >
              {{ role.roleName }}
            </el-tag>
            <span v-if="!row.roles?.length">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="hasPermission('sys:user:status')"
              :model-value="row.status === 1"
              :disabled="row.username === 'admin'"
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
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'sys:user:edit'"
              type="primary"
              link
              @click="openDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'sys:user:remove'"
              type="danger"
              link
              :disabled="row.username === 'admin'"
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formModel.id ? '编辑用户' : '新增用户'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="88px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formModel.username"
            placeholder="请输入用户名"
            :disabled="!!formModel.id"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item
          label="密码"
          prop="password"
          :required="!formModel.id"
        >
          <el-input
            v-model="formModel.password"
            type="password"
            show-password
            :placeholder="formModel.id ? '留空则不修改' : '请输入密码'"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="formModel.nickname"
            placeholder="请输入昵称"
            maxlength="64"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formModel.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formModel.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formModel.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="formModel.roleIds"
            multiple
            clearable
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formModel.remark"
            type="textarea"
            :rows="3"
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
/**
 * 用户管理页面
 * 结构：条件筛选栏 + 操作工具栏 + 分页表格 + 新增/编辑弹窗
 */
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createUserApi,
  deleteUserApi,
  getRoleOptionsApi,
  getUserListApi,
  updateUserApi,
  updateUserStatusApi,
} from '@/api'
import { usePermission } from '@/hooks/usePermission'
import type { RoleOption, SysUserItem, UserFormModel, UserQueryParams } from '@/types/api'

const { hasPermission } = usePermission()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<SysUserItem[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)
const roleOptions = ref<RoleOption[]>([])

const query = reactive<UserQueryParams>({
  page: 1,
  pageSize: 10,
  username: '',
  nickname: '',
  phone: '',
  status: '',
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<UserFormModel>({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  gender: 0,
  status: 1,
  remark: '',
  roleIds: [],
})

/** 动态校验：新增必填密码，编辑可选 */
const validatePassword = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void,
) => {
  if (!formModel.id && !value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value && value.length < 6) {
    callback(new Error('密码至少 6 位'))
    return
  }
  callback()
}

const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 64, message: '长度 2-64 个字符', trigger: 'blur' },
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  phone: [
    {
      pattern: /^1\d{10}$/,
      message: '手机号格式不正确',
      trigger: 'blur',
    },
  ],
}

async function fetchList() {
  loading.value = true
  try {
    const params: UserQueryParams = {
      page: query.page,
      pageSize: query.pageSize,
      username: query.username || undefined,
      nickname: query.nickname || undefined,
      phone: query.phone || undefined,
      status: query.status === '' ? undefined : query.status,
      beginTime: dateRange.value?.[0],
      endTime: dateRange.value?.[1],
    }
    const res = await getUserListApi(params)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.username = ''
  query.nickname = ''
  query.phone = ''
  query.status = ''
  dateRange.value = null
  query.page = 1
  fetchList()
}

function openDialog(row?: SysUserItem) {
  resetForm()
  if (row) {
    formModel.id = row.id
    formModel.username = row.username
    formModel.nickname = row.nickname
    formModel.email = row.email || ''
    formModel.phone = row.phone || ''
    formModel.gender = row.gender
    formModel.status = row.status
    formModel.remark = row.remark || ''
    formModel.password = ''
    formModel.roleIds = row.roles?.map((r) => Number(r.id)) || []
  }
  dialogVisible.value = true
}

function resetForm() {
  formModel.id = undefined
  formModel.username = ''
  formModel.password = ''
  formModel.nickname = ''
  formModel.email = ''
  formModel.phone = ''
  formModel.gender = 0
  formModel.status = 1
  formModel.remark = ''
  formModel.roleIds = []
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload: UserFormModel = {
      username: formModel.username,
      nickname: formModel.nickname,
      email: formModel.email || undefined,
      phone: formModel.phone || undefined,
      gender: formModel.gender,
      status: formModel.status,
      remark: formModel.remark || undefined,
      roleIds: formModel.roleIds,
    }
    if (formModel.password) {
      payload.password = formModel.password
    }

    if (formModel.id) {
      await updateUserApi(formModel.id, payload)
      ElMessage.success('修改成功')
    } else {
      payload.password = formModel.password
      await createUserApi(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: SysUserItem) {
  await ElMessageBox.confirm(`确认删除用户「${row.username}」吗？`, '提示', {
    type: 'warning',
  })
  await deleteUserApi(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleStatusChange(row: SysUserItem, enabled: boolean) {
  const status = enabled ? 1 : 0
  try {
    await updateUserStatusApi(row.id, status)
    row.status = status
    ElMessage.success(status === 1 ? '已启用' : '已禁用')
  } catch {
    // 失败时保持原状态（switch 为受控）
  }
}

onMounted(async () => {
  fetchList()
  try {
    roleOptions.value = await getRoleOptionsApi()
  } catch {
    roleOptions.value = []
  }
})
</script>

<style scoped lang="scss">
.user-page {
  .search-card {
    margin-bottom: 12px;
  }

  .toolbar {
    margin-bottom: 12px;
  }

  .role-tag {
    margin-right: 4px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
