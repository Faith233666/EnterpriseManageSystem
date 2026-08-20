<template>
  <div class="member-page">
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline @submit.prevent>
        <el-form-item label="姓名">
          <el-input
            v-model="query.name"
            placeholder="请输入姓名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="query.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select
            v-model="query.level"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
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
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <el-button
          v-permission="'member:add'"
          type="primary"
          :icon="Plus"
          @click="openDialog()"
        >
          新增会员
        </el-button>
        <el-button
          v-permission="'member:remove'"
          type="danger"
          :icon="Delete"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="id" label="会员ID" width="90" />
        <el-table-column prop="name" label="姓名" min-width="110" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column label="会员等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="levelTag(row.level)" size="small">
              {{ levelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="100" align="right">
          <template #default="{ row }">{{ row.points }}</template>
        </el-table-column>
        <el-table-column label="余额" width="120" align="right">
          <template #default="{ row }">¥ {{ formatBalance(row.balance) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" min-width="170" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'member:edit'"
              type="primary"
              link
              @click="openDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'member:remove'"
              type="danger"
              link
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

    <el-dialog
      v-model="dialogVisible"
      :title="formModel.id ? '编辑会员' : '新增会员'"
      width="520px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="96px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formModel.name" maxlength="64" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formModel.phone" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="初始等级" prop="level">
          <el-select v-model="formModel.level" placeholder="请选择等级" style="width: 100%">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="积分" prop="points">
          <el-input-number v-model="formModel.points" :min="0" :max="99999999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="余额" prop="balance">
          <el-input-number
            v-model="formModel.balance"
            :min="0"
            :max="99999999"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  batchDeleteMemberApi,
  createMemberApi,
  deleteMemberApi,
  getMemberListApi,
  updateMemberApi,
} from '@/api'
import type { MemberFormModel, MemberItem, MemberQueryParams } from '@/types/api'

const levelOptions = [
  { label: '普通', value: 1 },
  { label: '黄金', value: 2 },
  { label: '钻石', value: 3 },
] as const

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<MemberItem[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])

const query = reactive<MemberQueryParams>({
  page: 1,
  pageSize: 10,
  name: '',
  phone: '',
  level: '',
  status: '',
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<MemberFormModel>({
  name: '',
  phone: '',
  level: 1,
  points: 0,
  balance: 0,
  status: 1,
  remark: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  level: [{ required: true, message: '请选择会员等级', trigger: 'change' }],
}

function levelLabel(level: number) {
  return levelOptions.find((i) => i.value === level)?.label ?? '-'
}

function levelTag(level: number) {
  return ({ 1: 'info', 2: 'warning', 3: 'danger' } as Record<number, string>)[level] || 'info'
}

function formatBalance(value: string | number) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getMemberListApi({
      page: query.page,
      pageSize: query.pageSize,
      name: query.name || undefined,
      phone: query.phone || undefined,
      level: query.level === '' ? undefined : query.level,
      status: query.status === '' ? undefined : query.status,
    })
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
  query.name = ''
  query.phone = ''
  query.level = ''
  query.status = ''
  query.page = 1
  fetchList()
}

function onSelectionChange(rows: MemberItem[]) {
  selectedIds.value = rows.map((r) => Number(r.id))
}

function resetForm() {
  formModel.id = undefined
  formModel.name = ''
  formModel.phone = ''
  formModel.level = 1
  formModel.points = 0
  formModel.balance = 0
  formModel.status = 1
  formModel.remark = ''
  formRef.value?.clearValidate()
}

function openDialog(row?: MemberItem) {
  resetForm()
  if (row) {
    formModel.id = Number(row.id)
    formModel.name = row.name
    formModel.phone = row.phone
    formModel.level = row.level
    formModel.points = Number(row.points)
    formModel.balance = Number(row.balance)
    formModel.status = row.status
    formModel.remark = row.remark || ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload: MemberFormModel = {
      name: formModel.name,
      phone: formModel.phone,
      level: formModel.level,
      points: formModel.points,
      balance: formModel.balance,
      status: formModel.status,
      remark: formModel.remark || undefined,
    }
    if (formModel.id) {
      await updateMemberApi(formModel.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createMemberApi(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row: MemberItem) {
  await ElMessageBox.confirm(
    `确认删除会员「${row.name}」吗？删除后不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  await deleteMemberApi(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(
    `确认删除选中的 ${selectedIds.value.length} 名会员吗？删除后不可恢复。`,
    '批量删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  await batchDeleteMemberApi(selectedIds.value)
  ElMessage.success('删除成功')
  selectedIds.value = []
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.member-page {
  .search-card {
    margin-bottom: 12px;
  }

  .toolbar {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
