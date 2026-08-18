<template>
  <div v-loading="loading" class="dashboard">
    <div class="welcome">
      <div>
        <h2>工作台</h2>
        <p>
          你好，{{ userStore.userInfo?.nickname || '用户' }}，欢迎回来。角色：
          {{ userStore.roles.join(' / ') || '-' }}
        </p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新数据</el-button>
    </div>

    <!-- 指标卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col v-for="item in statCards" :key="item.label" :xs="12" :sm="12" :md="6">
        <div class="stat-card" :style="{ borderColor: item.color }">
          <div class="stat-card__meta">
            <span class="label">{{ item.label }}</span>
            <strong class="value">{{ item.value }}</strong>
          </div>
          <el-icon class="stat-card__icon" :style="{ color: item.color }">
            <component :is="item.icon" />
          </el-icon>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-head">
              <span>近 7 日访问趋势</span>
              <el-tag size="small" type="info">PV / UV</el-tag>
            </div>
          </template>
          <div ref="trendRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-head">
              <span>角色用户分布</span>
            </div>
          </template>
          <div ref="rolePieRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-head">
              <span>业务模块访问量</span>
            </div>
          </template>
          <div ref="moduleBarRef" class="chart-box" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-head">
              <span>模块访问占比</span>
            </div>
          </template>
          <div ref="modulePieRef" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import {
  Menu,
  Refresh,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import { getDashboardStatsApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { DashboardStats } from '@/types/api'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const userStore = useUserStore()
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)

const trendRef = ref<HTMLDivElement>()
const rolePieRef = ref<HTMLDivElement>()
const moduleBarRef = ref<HTMLDivElement>()
const modulePieRef = ref<HTMLDivElement>()

const trendChart = shallowRef<EChartsType>()
const rolePieChart = shallowRef<EChartsType>()
const moduleBarChart = shallowRef<EChartsType>()
const modulePieChart = shallowRef<EChartsType>()

const statCards = computed(() => {
  const cards = stats.value?.cards
  return [
    {
      label: '用户总数',
      value: cards?.userTotal ?? 0,
      icon: User,
      color: '#3b82f6',
    },
    {
      label: '启用用户',
      value: cards?.userEnabled ?? 0,
      icon: UserFilled,
      color: '#10b981',
    },
    {
      label: '角色数量',
      value: cards?.roleTotal ?? 0,
      icon: UserFilled,
      color: '#f59e0b',
    },
    {
      label: '菜单权限',
      value: cards?.menuTotal ?? 0,
      icon: Menu,
      color: '#8b5cf6',
    },
  ]
})

function ensureChart(el: HTMLDivElement | undefined, inst: typeof trendChart) {
  if (!el) return
  if (!inst.value) {
    inst.value = echarts.init(el)
  }
}

function renderCharts() {
  if (!stats.value) return
  const { visitTrend, roleDistribution, moduleVisits } = stats.value

  ensureChart(trendRef.value, trendChart)
  trendChart.value?.setOption({
    color: ['#3b82f6', '#10b981'],
    tooltip: { trigger: 'axis' },
    legend: { data: ['PV', 'UV'], top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: visitTrend.days,
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: 'PV',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.12 },
        data: visitTrend.pv,
      },
      {
        name: 'UV',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        data: visitTrend.uv,
      },
    ],
  })

  ensureChart(rolePieRef.value, rolePieChart)
  rolePieChart.value?.setOption({
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '45%'],
        label: { formatter: '{b}\n{d}%' },
        data: roleDistribution,
      },
    ],
  })

  ensureChart(moduleBarRef.value, moduleBarChart)
  moduleBarChart.value?.setOption({
    color: ['#3b82f6'],
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: moduleVisits.map((i) => i.name),
      axisLabel: { interval: 0, rotate: 20 },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        type: 'bar',
        barWidth: 28,
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        data: moduleVisits.map((i) => i.value),
      },
    ],
  })

  ensureChart(modulePieRef.value, modulePieChart)
  modulePieChart.value?.setOption({
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: '65%',
        center: ['50%', '45%'],
        roseType: 'radius',
        itemStyle: { borderRadius: 6 },
        data: moduleVisits,
      },
    ],
  })
}

async function loadData() {
  loading.value = true
  try {
    stats.value = await getDashboardStatsApi()
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

function handleResize() {
  trendChart.value?.resize()
  rolePieChart.value?.resize()
  moduleBarChart.value?.resize()
  modulePieChart.value?.resize()
}

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart.value?.dispose()
  rolePieChart.value?.dispose()
  moduleBarChart.value?.dispose()
  modulePieChart.value?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard {
  .welcome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      font-size: 22px;
      margin-bottom: 6px;
    }

    p {
      color: #64748b;
      font-size: 14px;
    }
  }

  .stat-row {
    margin-bottom: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 16px;
    border-left: 4px solid #3b82f6;
    box-shadow: 0 1px 2px rgb(15 23 42 / 6%);

    .label {
      display: block;
      color: #64748b;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .value {
      font-size: 28px;
      color: #0f172a;
      line-height: 1;
    }

    &__icon {
      font-size: 36px;
      opacity: 0.9;
    }
  }

  .chart-row {
    margin-bottom: 16px;
  }

  .chart-card {
    margin-bottom: 16px;

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
    }
  }

  .chart-box {
    height: 320px;
    width: 100%;
  }
}
</style>
