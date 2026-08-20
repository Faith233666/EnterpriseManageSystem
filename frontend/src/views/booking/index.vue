<template>
  <div class="booking-page">
    <div class="stat-row">
      <button
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
        :class="{ 'is-active': card.active }"
        type="button"
        @click="card.onClick"
      >
        <div class="stat-card__icon" :style="{ background: card.bg, color: card.color }">
          <el-icon :size="18"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <span class="label">{{ card.label }}</span>
          <strong class="value">{{ card.value }}</strong>
        </div>
      </button>
    </div>

    <el-card shadow="never" class="search-card">
      <el-form :model="query" class="search-form" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="姓名 / 手机号 / 预约单号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="预约状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            unlink-panels
          />
        </el-form-item>
        <el-form-item class="search-form__actions">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <div class="toolbar__left">
          <el-button
            v-permission="'booking:add'"
            type="primary"
            :icon="Plus"
            @click="openForm()"
          >
            新增预约
          </el-button>
          <el-button
            v-permission="'booking:remove'"
            type="danger"
            :icon="Delete"
            plain
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
        <span class="toolbar__hint">已选 {{ selectedIds.length }} 条</span>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        row-key="id"
        :header-cell-style="headerCellStyle"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="预约单号" min-width="168">
          <template #default="{ row }">
            <div class="cell-main">{{ row.orderNo }}</div>
            <div class="cell-sub">{{ row.createdAt }}</div>
          </template>
        </el-table-column>
        <el-table-column label="客户信息" min-width="150">
          <template #default="{ row }">
            <div class="cell-main">{{ row.customerName }}</div>
            <div class="cell-sub">{{ row.phone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="服务项目" min-width="130">
          <template #default="{ row }">
            <div class="cell-main">{{ row.service?.name || '-' }}</div>
            <div v-if="row.service?.duration" class="cell-sub">
              {{ row.service.duration }} 分钟
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务人员 / 门店" min-width="150">
          <template #default="{ row }">
            <div class="cell-main">{{ row.staff?.name || '-' }}</div>
            <div class="cell-sub">{{ row.staff?.storeName || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="预约时间" min-width="168">
          <template #default="{ row }">
            <div class="cell-main">{{ formatDate(row.appointDate) }}</div>
            <div class="cell-sub">{{ row.slotStart }} - {{ row.slotEnd }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small" effect="light" round>
              {{ statusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="248" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
            <el-button
              v-permission="'booking:edit'"
              type="primary"
              link
              :disabled="row.status !== 1"
              @click="openForm(row)"
            >
              改约
            </el-button>
            <el-button
              v-permission="'booking:cancel'"
              type="warning"
              link
              :disabled="row.status !== 1"
              @click="openCancel(row)"
            >
              取消
            </el-button>
            <el-button
              v-permission="'booking:remove'"
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
      v-model="formVisible"
      :title="formModel.id ? '修改预约 / 改约' : '新增预约'"
      width="720px"
      destroy-on-close
      align-center
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="108px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="formModel.customerName" maxlength="64" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系手机" prop="phone">
              <el-input v-model="formModel.phone" maxlength="11" placeholder="请输入11位手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务项目" prop="serviceId">
              <el-select v-model="formModel.serviceId" placeholder="请选择服务项目" style="width: 100%">
                <el-option
                  v-for="item in serviceOptions"
                  :key="item.id"
                  :label="`${item.name}（${item.duration}分钟）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务人员" prop="staffId">
              <el-select
                v-model="formModel.staffId"
                placeholder="请选择服务人员"
                style="width: 100%"
                @change="reloadSlots"
              >
                <el-option
                  v-for="item in staffOptions"
                  :key="item.id"
                  :label="`${item.name} · ${item.storeName}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预约日期" prop="appointDate">
              <el-date-picker
                v-model="formModel.appointDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
                :disabled-date="disablePastDate"
                style="width: 100%"
                @change="reloadSlots"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约时段" prop="slotStart">
              <div v-loading="slotLoading" class="slot-grid">
                <button
                  v-for="slot in slots"
                  :key="slot.start"
                  class="slot-chip"
                  :class="{
                    'is-active': formModel.slotStart === slot.start,
                    'is-full': !slot.available && formModel.slotStart !== slot.start,
                  }"
                  type="button"
                  :disabled="!slot.available && formModel.slotStart !== slot.start"
                  @click="selectSlot(slot)"
                >
                  {{ slot.label }}
                  <span v-if="!slot.available && formModel.slotStart !== slot.start">满</span>
                </button>
                <el-empty
                  v-if="!slotLoading && slots.length === 0"
                  description="请先选择人员与日期"
                  :image-size="56"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约备注" prop="remark">
              <el-input
                v-model="formModel.remark"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="选填，如到店注意事项"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelVisible" title="取消预约" width="460px" destroy-on-close align-center>
      <p class="cancel-hint">取消后不可恢复。距预约开始不足 2 小时将无法取消。</p>
      <el-form ref="cancelFormRef" :model="cancelForm" :rules="cancelRules" label-width="88px">
        <el-form-item label="取消原因" prop="reason">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请填写取消原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">返回</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="handleCancel">
          确认取消
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="预约详情" size="440px">
      <template v-if="detail">
        <div class="voucher">
          <div class="voucher__no">{{ detail.orderNo }}</div>
          <div class="voucher__status">
            <el-tag :type="statusMeta(detail.status).type" effect="dark">
              {{ statusMeta(detail.status).label }}
            </el-tag>
          </div>
          <p class="voucher__tip">请凭此单号到店核销</p>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="客户姓名">{{ detail.customerName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.phone }}</el-descriptions-item>
          <el-descriptions-item label="服务项目">{{ detail.service?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务人员">{{ detail.staff?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="门店/网点">{{ detail.staff?.storeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">
            {{ formatDate(detail.appointDate) }} {{ detail.slotStart }}-{{ detail.slotEnd }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.cancelReason" label="取消原因">
            {{ detail.cancelReason }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createdAt }}</el-descriptions-item>
        </el-descriptions>
        <div class="drawer-actions">
          <el-button
            v-permission="'booking:edit'"
            :disabled="detail.status !== 1"
            @click="openForm(detail)"
          >
            改约
          </el-button>
          <el-button
            v-permission="'booking:cancel'"
            type="warning"
            :disabled="detail.status !== 1"
            @click="openCancel(detail)"
          >
            取消预约
          </el-button>
          <el-button v-permission="'booking:remove'" type="danger" @click="handleDelete(detail)">
            删除记录
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 预约管理
 * 状态流转：待服务(1) → 已完成(2) / 已取消(3) / 已过期(4)
 * 时段：选择人员+日期后拉取库存，约满置灰；提交时后端再次校验防超卖
 */
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar,
  CircleCheck,
  Clock,
  Delete,
  Plus,
  Refresh,
  Search,
  WarningFilled,
} from '@element-plus/icons-vue'
import {
  batchDeleteBookingApi,
  cancelBookingApi,
  createBookingApi,
  deleteBookingApi,
  getBookingDetailApi,
  getBookingListApi,
  getBookingOptionsApi,
  getBookingSlotsApi,
  getBookingStatsApi,
  updateBookingApi,
} from '@/api'
import type {
  BookingFormModel,
  BookingItem,
  BookingQueryParams,
  BookingServiceOption,
  BookingSlot,
  BookingStaffOption,
  BookingStats,
  BookingStatus,
} from '@/types/api'

const statusOptions: Array<{ label: string; value: BookingStatus; type: string }> = [
  { label: '待服务', value: 1, type: 'warning' },
  { label: '已完成', value: 2, type: 'success' },
  { label: '已取消', value: 3, type: 'info' },
  { label: '已过期', value: 4, type: 'danger' },
]

const headerCellStyle = {
  background: '#f7f8fa',
  color: '#606266',
  fontWeight: 600,
}

const loading = ref(false)
const tableData = ref<BookingItem[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const dateRange = ref<[string, string] | null>(null)
const stats = ref<BookingStats>({
  pending: 0,
  done: 0,
  cancelled: 0,
  expired: 0,
  today: 0,
  total: 0,
})

const query = reactive<BookingQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
})

const serviceOptions = ref<BookingServiceOption[]>([])
const staffOptions = ref<BookingStaffOption[]>([])
const slots = ref<BookingSlot[]>([])
const slotLoading = ref(false)

const formVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formModel = reactive<BookingFormModel>({
  customerName: '',
  phone: '',
  serviceId: undefined,
  staffId: undefined,
  appointDate: '',
  slotStart: '',
  remark: '',
})

const formRules: FormRules = {
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  serviceId: [{ required: true, message: '请选择服务项目', trigger: 'change' }],
  staffId: [{ required: true, message: '请选择服务人员', trigger: 'change' }],
  appointDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  slotStart: [{ required: true, message: '请选择预约时段', trigger: 'change' }],
}

const cancelVisible = ref(false)
const cancelLoading = ref(false)
const cancelTargetId = ref<number>()
const cancelFormRef = ref<FormInstance>()
const cancelForm = reactive({ reason: '' })
const cancelRules: FormRules = {
  reason: [{ required: true, message: '请填写取消原因', trigger: 'blur' }],
}

const detailVisible = ref(false)
const detail = ref<BookingItem | null>(null)

const todayKey = todayStr()
const todayFilterActive = computed(
  () => dateRange.value?.[0] === todayKey && dateRange.value?.[1] === todayKey,
)

const statCards = computed(() => [
  {
    key: 'today',
    label: '今日预约',
    value: stats.value.today,
    icon: Calendar,
    color: '#2563eb',
    bg: '#eff6ff',
    active: todayFilterActive.value && query.status === '',
    onClick: () => filterByToday(),
  },
  {
    key: 'pending',
    label: '待服务',
    value: stats.value.pending,
    icon: Clock,
    color: '#d97706',
    bg: '#fffbeb',
    active: query.status === 1,
    onClick: () => filterByStatus(1),
  },
  {
    key: 'done',
    label: '已完成',
    value: stats.value.done,
    icon: CircleCheck,
    color: '#16a34a',
    bg: '#f0fdf4',
    active: query.status === 2,
    onClick: () => filterByStatus(2),
  },
  {
    key: 'cancelled',
    label: '已取消',
    value: stats.value.cancelled,
    icon: WarningFilled,
    color: '#64748b',
    bg: '#f8fafc',
    active: query.status === 3,
    onClick: () => filterByStatus(3),
  },
])

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function statusMeta(status: number) {
  return statusOptions.find((i) => i.value === status) ?? statusOptions[0]
}

function formatDate(value: string) {
  return String(value).slice(0, 10)
}

function disablePastDate(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

async function fetchStats() {
  stats.value = await getBookingStatsApi()
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getBookingListApi({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status === '' ? undefined : query.status,
      beginDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    })
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([fetchList(), fetchStats()])
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  dateRange.value = null
  query.page = 1
  fetchList()
}

function filterByStatus(status: BookingStatus) {
  query.status = query.status === status ? '' : status
  query.page = 1
  fetchList()
}

function filterByToday() {
  if (todayFilterActive.value && query.status === '') {
    dateRange.value = null
  } else {
    dateRange.value = [todayKey, todayKey]
    query.status = ''
  }
  query.page = 1
  fetchList()
}

function onSelectionChange(rows: BookingItem[]) {
  selectedIds.value = rows.map((r) => Number(r.id))
}

async function loadOptions() {
  const data = await getBookingOptionsApi()
  serviceOptions.value = data.services
  staffOptions.value = data.staffs
}

/** 联动加载时段库存；改约时保留原时段（若仍有效） */
async function reloadSlots() {
  const keep = formModel.slotStart
  formModel.slotStart = ''
  if (!formModel.staffId || !formModel.appointDate) {
    slots.value = []
    return
  }
  slotLoading.value = true
  try {
    slots.value = await getBookingSlotsApi({
      date: formModel.appointDate,
      staffId: formModel.staffId,
      excludeId: formModel.id,
    })
    const stillOk = slots.value.find((s) => s.start === keep)
    if (stillOk && (stillOk.available || formModel.id)) {
      formModel.slotStart = keep
    }
  } finally {
    slotLoading.value = false
  }
}

function selectSlot(slot: BookingSlot) {
  if (!slot.available && formModel.slotStart !== slot.start) return
  formModel.slotStart = slot.start
}

function resetForm() {
  formModel.id = undefined
  formModel.customerName = ''
  formModel.phone = ''
  formModel.serviceId = undefined
  formModel.staffId = undefined
  formModel.appointDate = ''
  formModel.slotStart = ''
  formModel.remark = ''
  slots.value = []
  formRef.value?.clearValidate()
}

async function openForm(row?: BookingItem) {
  resetForm()
  if (!serviceOptions.value.length) {
    await loadOptions()
  }
  if (row) {
    formModel.id = Number(row.id)
    formModel.customerName = row.customerName
    formModel.phone = row.phone
    formModel.serviceId = Number(row.serviceId)
    formModel.staffId = Number(row.staffId)
    formModel.appointDate = formatDate(row.appointDate)
    formModel.slotStart = row.slotStart
    formModel.remark = row.remark || ''
    await reloadSlots()
    formModel.slotStart = row.slotStart
  }
  detailVisible.value = false
  formVisible.value = true
}

async function handleSubmit() {
  if (submitLoading.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload: BookingFormModel = {
      customerName: formModel.customerName,
      phone: formModel.phone,
      serviceId: formModel.serviceId,
      staffId: formModel.staffId,
      appointDate: formModel.appointDate,
      slotStart: formModel.slotStart,
      remark: formModel.remark || undefined,
    }
    if (formModel.id) {
      await updateBookingApi(formModel.id, payload)
      ElMessage.success('改约成功')
    } else {
      await createBookingApi(payload)
      ElMessage.success('预约成功')
    }
    formVisible.value = false
    refreshAll()
  } finally {
    submitLoading.value = false
  }
}

function openCancel(row: BookingItem) {
  cancelTargetId.value = Number(row.id)
  cancelForm.reason = ''
  detailVisible.value = false
  cancelVisible.value = true
}

async function handleCancel() {
  const valid = await cancelFormRef.value?.validate().catch(() => false)
  if (!valid || !cancelTargetId.value) return
  cancelLoading.value = true
  try {
    await cancelBookingApi(cancelTargetId.value, cancelForm.reason)
    ElMessage.success('已取消预约')
    cancelVisible.value = false
    refreshAll()
  } finally {
    cancelLoading.value = false
  }
}

async function openDetail(row: BookingItem) {
  detail.value = await getBookingDetailApi(row.id)
  detailVisible.value = true
}

async function afterDelete() {
  if (tableData.value.length <= 1 && (query.page || 1) > 1) {
    query.page = (query.page || 1) - 1
  }
  selectedIds.value = []
  detailVisible.value = false
  await refreshAll()
}

async function handleDelete(row: BookingItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除预约单「${row.orderNo}」吗？删除后不可恢复，待服务时段将释放。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  await deleteBookingApi(row.id)
  ElMessage.success('删除成功')
  await afterDelete()
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${selectedIds.value.length} 条预约记录吗？删除后不可恢复。`,
      '批量删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  await batchDeleteBookingApi(selectedIds.value)
  ElMessage.success('删除成功')
  await afterDelete()
}

onMounted(async () => {
  refreshAll()
  loadOptions()
})
</script>

<style scoped lang="scss">
.booking-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover,
  &.is-active {
    border-color: #c6d4f5;
    box-shadow: 0 4px 12px rgb(37 99 235 / 8%);
  }

  &.is-active {
    border-color: #409eff;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .label {
      font-size: 13px;
      color: #909399;
    }

    .value {
      margin-top: 2px;
      font-size: 22px;
      line-height: 1.2;
      color: #303133;
    }
  }
}

.search-card,
.table-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 220px;
  }

  :deep(.el-date-editor) {
    width: 260px;
  }

  &__actions {
    margin-left: auto;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  &__left {
    display: flex;
    gap: 8px;
  }

  &__hint {
    font-size: 13px;
    color: #909399;
  }
}

.cell-main {
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  width: 100%;
}

.slot-chip {
  min-width: 108px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 13px;

  &:hover:not(:disabled) {
    border-color: #409eff;
    color: #409eff;
  }

  &.is-active {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
  }

  &.is-full,
  &:disabled {
    background: #f5f7fa;
    color: #c0c4cc;
    cursor: not-allowed;
  }
}

.cancel-hint {
  color: #e6a23c;
  margin-bottom: 12px;
  font-size: 13px;
}

.voucher {
  text-align: center;
  padding: 18px 12px 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff;
  border-radius: 12px;

  &__no {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  &__status {
    margin: 10px 0 6px;
  }

  &__tip {
    font-size: 12px;
    opacity: 0.85;
  }
}

.drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-form__actions {
    margin-left: 0;
  }
}
</style>
