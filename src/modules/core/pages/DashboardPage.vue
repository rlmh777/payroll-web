<template>
  <q-page class="dashboard-page q-pa-md">
    <div v-if="store.isLoading" class="row justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="store.error" class="q-pa-md">
      <q-banner class="bg-negative text-white" rounded>
        {{ store.error }}
        <template #action>
          <q-btn flat label="Retry" @click="reload" />
        </template>
      </q-banner>
    </div>

    <div v-else class="dashboard-grid">
      <q-card v-for="kpi in kpis" :key="kpi.label" flat bordered class="kpi-card">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-7">{{ kpi.label }}</div>
          <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--wide">
        <q-card-section class="panel__header">
          Payroll Trend
          <span v-if="periodLabel" class="text-caption text-grey-7 q-ml-sm">{{ periodLabel }}</span>
        </q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="payrollTrendOption" autoresize />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--department-share">
        <q-card-section class="panel__header">Department Share</q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="departmentShareOption" autoresize />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--department-stack">
        <q-card-section class="panel__header">Cost by Department</q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="departmentStackOption" autoresize />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--deductions">
        <q-card-section class="panel__header">Deductions Mix</q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="deductionsOption" autoresize />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--ytd">
        <q-card-section class="panel__header">YTD vs Current</q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="ytdVsCurrentOption" autoresize />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--heatmap">
        <q-card-section class="panel__header">Overtime Heatmap</q-card-section>
        <q-card-section class="panel__body">
          <VChart class="chart" :option="overtimeHeatmapOption" autoresize />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, LineChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  VisualMapComponent,
} from 'echarts/components';
import { useDashboardStore } from 'src/stores/dashboard-store';

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  VisualMapComponent,
]);

provide(THEME_KEY, 'light');

const store = useDashboardStore();

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function money(value: number | null | undefined): string {
  return currency.format(Number(value || 0));
}

const periodLabel = computed(() => {
  const period = store.data?.meta?.currentPeriod;
  if (!period?.startDate || !period?.endDate) return '';
  const label = period.label ? `${period.label} · ` : '';
  return `${label}${period.startDate} → ${period.endDate}`;
});

const kpis = computed(() => {
  const data = store.data?.kpis;
  return [
    { label: 'Current Payroll', value: money(data?.currentPayroll) },
    { label: 'YTD Payroll', value: money(data?.ytdPayroll) },
    { label: 'Net Pay', value: money(data?.netPay) },
    { label: 'Employer Cost', value: money(data?.employerCost) },
    { label: 'Headcount Paid', value: numberFormat.format(data?.headcountPaid || 0) },
    { label: 'Overtime Cost', value: money(data?.overtimeCost) },
  ];
});

const emptyMessage = {
  title: {
    text: 'No posted payroll data',
    left: 'center',
    top: 'middle',
    textStyle: { fontSize: 12, color: '#9e9e9e', fontWeight: 400 },
  },
};

const payrollTrendOption = computed(() => {
  const trend = store.data?.payrollTrend;
  if (!trend?.labels?.length) return emptyMessage;
  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => money(value),
    },
    legend: { top: 0 },
    grid: { left: 48, right: 16, top: 28, bottom: 24 },
    xAxis: { type: 'category', data: trend.labels },
    yAxis: { type: 'value' },
    series: [
      { name: 'Gross', type: 'line', smooth: true, data: trend.gross },
      { name: 'Net', type: 'line', smooth: true, data: trend.net },
      { name: 'Employer Cost', type: 'line', smooth: true, data: trend.employerCost },
    ],
  };
});

const departmentShareOption = computed(() => {
  const share = store.data?.departmentShare ?? [];
  if (!share.length) return emptyMessage;
  return {
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: number) => money(value),
    },
    legend: { orient: 'vertical', right: 0, top: 'middle', textStyle: { fontSize: 10 } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['35%', '52%'],
        label: { show: false },
        data: share.map((item) => ({ value: item.value, name: item.name })),
      },
    ],
  };
});

const departmentStackOption = computed(() => {
  const cost = store.data?.costByDepartment;
  if (!cost?.departments?.length) return emptyMessage;
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => money(value),
    },
    legend: { top: 0, textStyle: { fontSize: 10 } },
    grid: { left: 48, right: 8, top: 30, bottom: 28 },
    xAxis: { type: 'category', data: cost.departments },
    yAxis: { type: 'value' },
    series: [
      { name: 'Regular', type: 'bar', stack: 'total', data: cost.regular },
      { name: 'Overtime', type: 'bar', stack: 'total', data: cost.overtime },
      { name: 'Holiday', type: 'bar', stack: 'total', data: cost.holiday },
      { name: 'Other Payments', type: 'bar', stack: 'total', data: cost.allowances },
    ],
  };
});

const deductionsOption = computed(() => {
  const mix = store.data?.deductionsMix ?? [];
  if (!mix.length) return emptyMessage;
  return {
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: number) => money(value),
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        label: { formatter: '{b}\n{d}%' },
        data: mix.map((item) => ({ value: item.value, name: item.name })),
      },
    ],
  };
});

const ytdVsCurrentOption = computed(() => {
  const compare = store.data?.ytdVsCurrentByDepartment;
  if (!compare?.departments?.length) return emptyMessage;
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: number) => money(value),
    },
    legend: { top: 0, textStyle: { fontSize: 10 } },
    grid: { left: 48, right: 10, top: 30, bottom: 24 },
    xAxis: { type: 'category', data: compare.departments },
    yAxis: { type: 'value' },
    series: [
      { name: 'Current', type: 'bar', data: compare.current },
      { name: 'YTD', type: 'bar', data: compare.ytd },
    ],
  };
});

const overtimeHeatmapOption = computed(() => {
  const heatmap = store.data?.overtimeHeatmap;
  if (!heatmap?.weeks?.length || !heatmap.departments?.length) return emptyMessage;
  const max = Math.max(1, ...heatmap.cells.map((cell) => Number(cell[2] || 0)));
  return {
    tooltip: { position: 'top' },
    grid: { left: 72, right: 10, top: 10, bottom: 24 },
    xAxis: { type: 'category', data: heatmap.weeks },
    yAxis: { type: 'category', data: heatmap.departments },
    visualMap: {
      min: 0,
      max,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 90,
      itemHeight: 8,
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        type: 'heatmap',
        data: heatmap.cells,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6 } },
      },
    ],
  };
});

async function reload() {
  await store.fetchDashboard(6);
}

onMounted(() => {
  void reload();
});
</script>

<style scoped>
.dashboard-page {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.dashboard-grid {
  display: grid;
  height: 100%;
  gap: 10px;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(12, minmax(0, 1fr));
}

.kpi-card {
  min-height: 0;
}

.kpi-card:nth-child(1),
.kpi-card:nth-child(2),
.kpi-card:nth-child(3),
.kpi-card:nth-child(4),
.kpi-card:nth-child(5),
.kpi-card:nth-child(6) {
  grid-row: span 2;
}

.kpi-card:nth-child(1) { grid-column: 1 / span 2; }
.kpi-card:nth-child(2) { grid-column: 3 / span 2; }
.kpi-card:nth-child(3) { grid-column: 5 / span 2; }
.kpi-card:nth-child(4) { grid-column: 7 / span 2; }
.kpi-card:nth-child(5) { grid-column: 9 / span 2; }
.kpi-card:nth-child(6) { grid-column: 11 / span 2; }

.panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel--wide {
  grid-column: 1 / span 8;
  grid-row: 3 / span 4;
}

.panel--department-share {
  grid-column: 9 / span 4;
  grid-row: 3 / span 4;
}

.panel--department-stack {
  grid-column: 1 / span 4;
  grid-row: 7 / span 3;
}

.panel--deductions {
  grid-column: 5 / span 4;
  grid-row: 7 / span 3;
}

.panel--ytd {
  grid-column: 9 / span 4;
  grid-row: 7 / span 3;
}

.panel--heatmap {
  grid-column: 1 / span 12;
  grid-row: 10 / span 3;
}

.panel__header {
  font-size: 12px;
  font-weight: 700;
  padding: 8px 10px;
}

.panel__body {
  flex: 1;
  min-height: 0;
  padding: 4px 6px 6px;
}

.chart {
  width: 100%;
  height: 100%;
}

@media (max-width: 1200px) {
  .dashboard-page {
    overflow: auto;
  }

  .dashboard-grid {
    height: auto;
    min-height: 100%;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    grid-template-rows: unset;
    grid-auto-rows: 140px;
  }

  .kpi-card:nth-child(n) {
    grid-column: span 2;
    grid-row: span 1;
  }

  .panel {
    grid-column: span 3;
    grid-row: span 2;
  }

  .panel--heatmap {
    grid-column: 1 / -1;
  }
}
</style>
