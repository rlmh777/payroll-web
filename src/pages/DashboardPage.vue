<template>
  <q-page class="dashboard-page q-pa-md">
    <div class="dashboard-grid">
      <q-card v-for="kpi in kpis" :key="kpi.label" flat bordered class="kpi-card">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-7">{{ kpi.label }}</div>
          <div class="text-h6 text-weight-bold">{{ kpi.value }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="panel panel--wide">
        <q-card-section class="panel__header">Payroll Trend</q-card-section>
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
import { computed, provide } from 'vue';
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

const kpis = [
  { label: 'Current Payroll', value: '$412,300' },
  { label: 'YTD Payroll', value: '$3,982,450' },
  { label: 'Net Pay', value: '$327,990' },
  { label: 'Employer Cost', value: '$455,220' },
  { label: 'Headcount Paid', value: '143' },
  { label: 'Overtime Cost', value: '$29,180' },
];

const payrollTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0 },
  grid: { left: 36, right: 16, top: 28, bottom: 24 },
  xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Gross', type: 'line', smooth: true, data: [360, 372, 389, 401, 395, 412] },
    { name: 'Net', type: 'line', smooth: true, data: [288, 296, 309, 319, 313, 328] },
    { name: 'Employer Cost', type: 'line', smooth: true, data: [395, 408, 423, 438, 441, 455] },
  ],
}));

const departmentShareOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', right: 0, top: 'middle', textStyle: { fontSize: 10 } },
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['35%', '52%'],
      label: { show: false },
      data: [
        { value: 26, name: 'Operations' },
        { value: 21, name: 'Sales' },
        { value: 18, name: 'Support' },
        { value: 15, name: 'Finance' },
        { value: 20, name: 'Other' },
      ],
    },
  ],
}));

const departmentStackOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 0, textStyle: { fontSize: 10 } },
  grid: { left: 38, right: 8, top: 30, bottom: 28 },
  xAxis: { type: 'category', data: ['Ops', 'Sales', 'Support', 'Finance', 'IT'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Regular', type: 'bar', stack: 'total', data: [120, 96, 88, 66, 52] },
    { name: 'Overtime', type: 'bar', stack: 'total', data: [20, 14, 16, 8, 9] },
    { name: 'Holiday', type: 'bar', stack: 'total', data: [6, 4, 5, 2, 3] },
    { name: 'Allowances', type: 'bar', stack: 'total', data: [9, 10, 8, 6, 4] },
  ],
}));

const deductionsOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['45%', '72%'],
      label: { formatter: '{b}\n{d}%' },
      data: [
        { value: 49, name: 'Tax' },
        { value: 33, name: 'Social' },
        { value: 18, name: 'Other' },
      ],
    },
  ],
}));

const ytdVsCurrentOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { top: 0, textStyle: { fontSize: 10 } },
  grid: { left: 40, right: 10, top: 30, bottom: 24 },
  xAxis: { type: 'category', data: ['Ops', 'Sales', 'Support', 'Finance', 'IT'] },
  yAxis: { type: 'value' },
  series: [
    { name: 'Current', type: 'bar', data: [155, 124, 117, 82, 68] },
    { name: 'YTD', type: 'bar', data: [1320, 1110, 1030, 760, 640] },
  ],
}));

const overtimeHeatmapOption = computed(() => ({
  tooltip: { position: 'top' },
  grid: { left: 52, right: 10, top: 10, bottom: 24 },
  xAxis: { type: 'category', data: ['W1', 'W2', 'W3', 'W4'] },
  yAxis: { type: 'category', data: ['Ops', 'Sales', 'Support', 'Finance', 'IT'] },
  visualMap: {
    min: 0,
    max: 24,
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
      data: [
        [0, 0, 20], [1, 0, 18], [2, 0, 22], [3, 0, 24],
        [0, 1, 10], [1, 1, 12], [2, 1, 14], [3, 1, 11],
        [0, 2, 13], [1, 2, 11], [2, 2, 15], [3, 2, 14],
        [0, 3, 6], [1, 3, 7], [2, 3, 8], [3, 3, 9],
        [0, 4, 9], [1, 4, 10], [2, 4, 12], [3, 4, 11],
      ],
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 6 } },
    },
  ],
}));
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
