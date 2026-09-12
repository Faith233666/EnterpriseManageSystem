<template>
  <div v-loading="loading" class="report-page">
    <!-- 头部栏 -->
    <div class="page-header">
      <div class="header-info">
        <h2 class="title">
          <el-icon class="title-icon"><TrendCharts /></el-icon> 业务数据报表中心
        </h2>
        <p class="subtitle">
          全方位业务数据聚合分析、预约状态分布与数据明细导出
        </p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadAllData">刷新数据</el-button>
        <el-button
          type="primary"
          :icon="Download"
          v-permission="['report:export']"
          @click="handleExport"
        >
          导出 CSV 报表
        </el-button>
      </div>
    </div>

    <!-- KPI 核心指标卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="kpi-card gradient-blue">
          <div class="kpi-meta">
            <span class="kpi-label">累计预约单量</span>
            <strong class="kpi-value">{{ overview?.kpi.totalAppointments ?? 0 }}</strong>
            <span class="kpi-hint">全平台数据记录</span>
          </div>
          <div class="kpi-icon-wrap">
            <el-icon><Calendar /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="kpi-card gradient-emerald">
          <div class="kpi-meta">
            <span class="kpi-label">服务完成率</span>
            <strong class="kpi-value">{{ overview?.kpi.completionRate ?? '0%' }}</strong>
            <span class="kpi-hint">已履约订单比例</span>
          </div>
          <div class="kpi-icon-wrap">
            <el-icon><SuccessFilled /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="kpi-card gradient-purple">
          <div class="kpi-meta">
            <span class="kpi-label">会员档案总数</span>
            <strong class="kpi-value">{{ overview?.kpi.totalMembers ?? 0 }}</strong>
            <span class="kpi-hint">VIP 尊享：{{ overview?.kpi.vipMembers ?? 0 }} 人</span>
          </div>
          <div class="kpi-icon-wrap">
            <el-icon><UserFilled /></el-icon>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="kpi-card gradient-orange">
          <div class="kpi-meta">
            <span class="kpi-label">在业服务人员</span>
            <strong class="kpi-value">{{ overview?.kpi.activeStaffCount ?? 0 }}</strong>
            <span class="kpi-hint">服务项目：{{ overview?.kpi.serviceItemCount ?? 0 }} 项</span>
          </div>
          <div class="kpi-icon-wrap">
            <el-icon><Avatar /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 可视化图表网格 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 预约趋势图表 -->
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-flex">
              <div class="card-title">
                <el-icon><DataAnalysis /></el-icon> 近 7 日预约单量与完成趋势
              </div>
              <el-tag size="small" type="primary" effect="plain">单量分析</el-tag>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-box" />
        </el-card>
      </el-col>

      <!-- 预约状态分布图 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-flex">
              <div class="card-title">
                <el-icon><PieChart /></el-icon> 预约状态分布
              </div>
              <el-tag size="small" type="success" effect="plain">状态占比</el-tag>
            </div>
          </template>
          <div ref="statusPieRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <!-- 服务项目占比分析 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-flex">
              <div class="card-title">
                <el-icon><Grid /></el-icon> 服务项目热度占比
              </div>
              <el-tag size="small" type="warning" effect="plain">项目占比</el-tag>
            </div>
          </template>
          <div ref="servicePieRef" class="chart-box" />
        </el-card>
      </el-col>

      <!-- 员工服务业绩 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header-flex">
              <div class="card-title">
                <el-icon><Opportunity /></el-icon> 员工服务工作量对比
              </div>
              <el-tag size="small" type="success" effect="plain">绩效对比</el-tag>
            </div>
          </template>
          <div ref="staffBarRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 明细数据与筛选表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-card-head">
          <div class="card-title">
            <el-icon><List /></el-icon> 业务数据明细记录
          </div>
          <!-- 筛选表单 -->
          <el-form :inline="true" :model="queryForm" class="filter-form" size="default">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 240px"
                @change="handleDateChange"
              />
            </el-form-item>
            <el-form-item label="服务状态">
              <el-select
                v-model="queryForm.status"
                placeholder="全部状态"
                clearable
                style="width: 130px"
                @change="fetchDetailList"
              >
                <el-option label="待服务" :value="1" />
                <el-option label="已完成" :value="2" />
                <el-option label="已取消" :value="3" />
                <el-option label="已过期" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input
                v-model="queryForm.keyword"
                placeholder="单号/客户/手机"
                clearable
                style="width: 180px"
                @keyup.enter="fetchDetailList"
                @clear="fetchDetailList"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="fetchDetailList">查询</el-button>
              <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNo" label="预约单号" min-width="160" align="center">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户姓名" width="110" align="center" />
        <el-table-column prop="phone" label="联系电话" width="130" align="center" />
        <el-table-column prop="serviceName" label="服务项目" min-width="130">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.serviceName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="服务时长" width="100" align="center" />
        <el-table-column prop="staffName" label="服务人员" width="110" align="center" />
        <el-table-column prop="storeName" label="所属门店" min-width="120" align="center" />
        <el-table-column prop="appointDate" label="预约日期" width="120" align="center" />
        <el-table-column prop="timeSlot" label="时间段" width="130" align="center" />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="tableTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchDetailList"
          @current-change="fetchDetailList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  Calendar,
  DataAnalysis,
  Download,
  Grid,
  List,
  Opportunity,
  PieChart,
  Refresh,
  RefreshRight,
  Search,
  SuccessFilled,
  TrendCharts,
  UserFilled,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart as EPieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import { getReportDetailApi, getReportOverviewApi } from '@/api'
import type { ReportDetailItem, ReportOverviewData, ReportQueryParams } from '@/types/api'

echarts.use([
  LineChart,
  BarChart,
  EPieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

const loading = ref(false)
const tableLoading = ref(false)
const overview = ref<ReportOverviewData | null>(null)

// 筛选表单
const dateRange = ref<[string, string] | null>(null)
const queryForm = reactive<ReportQueryParams>({
  page: 1,
  pageSize: 10,
  startDate: '',
  endDate: '',
  status: '',
  keyword: '',
})

const tableData = ref<ReportDetailItem[]>([])
const tableTotal = ref(0)

// 图表 DOM 引用与实例
const trendChartRef = ref<HTMLDivElement>()
const statusPieRef = ref<HTMLDivElement>()
const servicePieRef = ref<HTMLDivElement>()
const staffBarRef = ref<HTMLDivElement>()

const trendInstance = shallowRef<EChartsType>()
const statusPieInstance = shallowRef<EChartsType>()
const servicePieInstance = shallowRef<EChartsType>()
const staffBarInstance = shallowRef<EChartsType>()

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await loadAllData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})

function handleResize() {
  trendInstance.value?.resize()
  statusPieInstance.value?.resize()
  servicePieInstance.value?.resize()
  staffBarInstance.value?.resize()
}

function disposeCharts() {
  trendInstance.value?.dispose()
  statusPieInstance.value?.dispose()
  servicePieInstance.value?.dispose()
  staffBarInstance.value?.dispose()
}

async function loadAllData() {
  loading.value = true
  try {
    const res = await getReportOverviewApi()
    overview.value = res
    await fetchDetailList()
    await nextTick()
    renderCharts()
  } catch (error) {
    console.error('加载报表数据失败', error)
    ElMessage.error('加载报表数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchDetailList() {
  tableLoading.value = true
  try {
    const res = await getReportDetailApi(queryForm)
    tableData.value = res.list
    tableTotal.value = res.total
  } catch (error) {
    console.error('获取明细列表失败', error)
  } finally {
    tableLoading.value = false
  }
}

function handleDateChange(val: [string, string] | null) {
  if (val) {
    queryForm.startDate = val[0]
    queryForm.endDate = val[1]
  } else {
    queryForm.startDate = ''
    queryForm.endDate = ''
  }
  fetchDetailList()
}

function resetQuery() {
  dateRange.value = null
  queryForm.startDate = ''
  queryForm.endDate = ''
  queryForm.status = ''
  queryForm.keyword = ''
  queryForm.page = 1
  fetchDetailList()
}

// 渲染 ECharts 图表
function renderCharts() {
  if (!overview.value) return

  // 1. 趋势折线图
  if (trendChartRef.value) {
    if (!trendInstance.value) {
      trendInstance.value = echarts.init(trendChartRef.value)
    }
    const { dates, totalList, completedList } = overview.value.trend
    trendInstance.value.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['总预约量', '已完成量'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '总预约量',
          type: 'line',
          smooth: true,
          data: totalList,
          itemStyle: { color: '#409EFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.4)' },
              { offset: 1, color: 'rgba(64,158,255,0.05)' },
            ]),
          },
        },
        {
          name: '已完成量',
          type: 'line',
          smooth: true,
          data: completedList,
          itemStyle: { color: '#67C23A' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103,194,58,0.4)' },
              { offset: 1, color: 'rgba(103,194,58,0.05)' },
            ]),
          },
        },
      ],
    })
  }

  // 2. 状态分布饼图
  if (statusPieRef.value) {
    if (!statusPieInstance.value) {
      statusPieInstance.value = echarts.init(statusPieRef.value)
    }
    statusPieInstance.value.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          name: '状态分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          data: overview.value.statusDistribution,
        },
      ],
    })
  }

  // 3. 服务占比饼图
  if (servicePieRef.value) {
    if (!servicePieInstance.value) {
      servicePieInstance.value = echarts.init(servicePieRef.value)
    }
    servicePieInstance.value.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { top: 'bottom' },
      series: [
        {
          name: '服务占比',
          type: 'pie',
          radius: [20, 100],
          center: ['50%', '45%'],
          roseType: 'area',
          itemStyle: { borderRadius: 5 },
          data: overview.value.serviceDistribution,
        },
      ],
    })
  }

  // 4. 员工量柱状图（精细化排列与线性渐变）
  if (staffBarRef.value) {
    if (!staffBarInstance.value) {
      staffBarInstance.value = echarts.init(staffBarRef.value)
    }
    const staffNames = overview.value.staffPerformance.map((s) => s.name)
    const totalData = overview.value.staffPerformance.map((s) => s.total)
    const completedData = overview.value.staffPerformance.map((s) => s.completed)

    staffBarInstance.value.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['接待总量', '完成单量'],
        top: 0,
        right: 10,
      },
      grid: {
        top: 40,
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: staffNames,
        axisTick: { alignWithLabel: true },
        axisLabel: { color: '#606266', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', color: '#e4e7ed' } },
      },
      series: [
        {
          name: '接待总量',
          type: 'bar',
          barWidth: 18,
          barGap: '30%',
          data: totalData,
          label: {
            show: true,
            position: 'top',
            color: '#409EFF',
            fontSize: 11,
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#a0cfff' },
            ]),
          },
        },
        {
          name: '完成单量',
          type: 'bar',
          barWidth: 18,
          data: completedData,
          label: {
            show: true,
            position: 'top',
            color: '#67C23A',
            fontSize: 11,
          },
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67C23A' },
              { offset: 1, color: '#b3e19d' },
            ]),
          },
        },
      ],
    })
  }
}

// 客户端导出 CSV 报表功能
function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无明细数据可导出')
    return
  }

  const headers = [
    '预约单号',
    '客户姓名',
    '联系电话',
    '服务项目',
    '服务时长',
    '服务人员',
    '所属门店',
    '预约日期',
    '时间段',
    '状态',
    '创建时间',
  ]

  const rows = tableData.value.map((item) => [
    `"${item.orderNo}"`,
    `"${item.customerName}"`,
    `"${item.phone}"`,
    `"${item.serviceName}"`,
    `"${item.duration}"`,
    `"${item.staffName}"`,
    `"${item.storeName}"`,
    `"${item.appointDate}"`,
    `"${item.timeSlot}"`,
    `"${getStatusText(item.status)}"`,
    `"${formatDate(item.createdAt)}"`,
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `业务数据报表_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('报表导出成功！')
}

function getStatusText(status: number) {
  const map: Record<number, string> = {
    1: '待服务',
    2: '已完成',
    3: '已取消',
    4: '已过期',
  }
  return map[status] || '未知'
}

function getStatusTagType(status: number) {
  const map: Record<number, 'primary' | 'success' | 'info' | 'danger'> = {
    1: 'primary',
    2: 'success',
    3: 'info',
    4: 'danger',
  }
  return map[status] || 'info'
}

function formatDate(val: string) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}
</script>

<style scoped lang="scss">
.report-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 90px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: #fff;
  padding: 18px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2d3d;
    display: flex;
    align-items: center;
    gap: 8px;

    .title-icon {
      color: #409eff;
    }
  }

  .subtitle {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #909399;
  }
}

/* KPI 卡片 */
.kpi-row {
  margin-bottom: 20px;
}

.kpi-card {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  color: #fff;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  &.gradient-blue {
    background: linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%);
  }
  &.gradient-emerald {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  }
  &.gradient-purple {
    background: linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%);
  }
  &.gradient-orange {
    background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
  }

  .kpi-meta {
    display: flex;
    flex-direction: column;

    .kpi-label {
      font-size: 13px;
      opacity: 0.9;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      margin: 4px 0;
    }

    .kpi-hint {
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .kpi-icon-wrap {
    font-size: 42px;
    opacity: 0.35;
  }
}

/* 图表区 */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  margin-bottom: 16px;

  .card-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .chart-box {
    width: 100%;
    height: 320px;
  }
}

/* 明细表格 */
.table-card {
  border-radius: 8px;

  .table-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-form {
      margin-bottom: -18px;
    }
  }

  .order-no {
    font-family: monospace;
    font-weight: 600;
    color: #409eff;
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
