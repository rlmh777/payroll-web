<template>
  <div class="labor-cost-to-date-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Labor Cost to Date</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Period-to-date hours and cost from current timesheets, even if payroll has not been processed.
      Tax and social security are estimates for the selected dates.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report period and scope</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <DateField
              v-model="startDate"
              label="Start date"
              required
              :disable="reportsStore.isLoadingLaborCostToDate"
            />
          </div>
          <div class="col-12 col-md-3">
            <DateField
              v-model="endDate"
              label="End date"
              required
              :disable="reportsStore.isLoadingLaborCostToDate"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-option-group
              v-model="scope"
              :options="scopeOptions"
              color="primary"
              dense
              inline
              class="q-pt-sm"
            />
          </div>
          <div v-if="scope === 'department'" class="col-12 col-md-6">
            <ParentDepartmentSelect
              v-model="departmentId"
              label="Department"
              outlined
              dense
              clearable
              :disable="reportsStore.isLoadingLaborCostToDate"
            />
          </div>
          <div v-if="scope === 'group'" class="col-12 col-md-6">
            <EmployeeGroupSelect
              v-model="employeeGroupId"
              label="Employee group"
              :show-add-new="false"
              :show-edit="false"
              :disable="reportsStore.isLoadingLaborCostToDate"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="visibleColumnKeys"
              :options="columnOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              use-chips
              label="Columns to display"
              :disable="!report"
            />
          </div>
          <div class="col-12 col-md-4">
            <ReportHeaderSelect />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="reportsStore.isLoadingLaborCostToDate"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="text-subtitle1 text-weight-bold">{{ report.scopeLabel }}</div>
            <div class="text-body2 text-grey-7">
              {{ formatDate(report.startDate) }} - {{ formatDate(report.endDate) }}
              · {{ report.employeeCount }} employees
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              class="q-mr-sm"
              :disable="!report.rows.length || !visibleColumns.length"
              @click="handleExportExcel"
            />
            <q-btn
              outline
              color="primary"
              icon="picture_as_pdf"
              label="Export PDF"
              :disable="!report.rows.length || !visibleColumns.length"
              @click="handleExportPdf"
            />
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No timesheet or pay data was found for the selected dates and scope.
        </q-banner>

        <q-table
          v-else
          :rows="report.rows"
          :columns="tableColumns"
          row-key="employeeId"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingLaborCostToDate"
          no-data-label="No employees found."
          :pagination="{ rowsPerPage: 25 }"
        >
          <template #body-cell="props">
            <q-td :props="props" :class="cellAlign(props.col.name)">
              {{ formatCell(props.row, props.col.name) }}
            </q-td>
          </template>
          <template #bottom-row>
            <q-tr class="labor-cost-to-date-report__totals-row">
              <q-td
                v-for="column in visibleColumns"
                :key="`total-${column.key}`"
                class="text-weight-bold"
                :class="cellAlign(column.key)"
              >
                {{ formatTotal(column) }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import EmployeeGroupSelect from '@hr/components/employee-group/EmployeeGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import {
  useReportsStore,
  type LaborCostToDateColumn,
  type LaborCostToDateRow,
  type LaborCostToDateScope,
} from '@payroll/stores/reports-store';
import { exportLaborCostToDateExcel, exportLaborCostToDatePdf } from '@payroll/utils/labor-cost-to-date-export';

const COLUMN_STORAGE_KEY = 'payroll.labor-cost-to-date.columns';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { laborCostToDateReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<LaborCostToDateScope>('company');
const departmentId = ref<number | null>(null);
const employeeGroupId = ref<string | null>(null);
const visibleColumnKeys = ref<string[]>([]);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
  { label: 'Group', value: 'group' },
];

const canGenerate = computed(() => {
  if (!startDate.value || !endDate.value || startDate.value > endDate.value) {
    return false;
  }
  if (scope.value === 'department') {
    return departmentId.value != null;
  }
  if (scope.value === 'group') {
    return Boolean(employeeGroupId.value);
  }
  return true;
});

const columnOptions = computed(() =>
  (report.value?.columns ?? []).map((column) => ({
    label: column.label,
    value: column.key,
  })),
);

const visibleColumns = computed<LaborCostToDateColumn[]>(() => {
  const selected = new Set(visibleColumnKeys.value);
  return (report.value?.columns ?? []).filter((column) => selected.has(column.key));
});

const tableColumns = computed<NonNullable<QTableProps['columns']>>(() =>
  visibleColumns.value.map((column) => ({
    name: column.key,
    label: column.label,
    field: (row: LaborCostToDateRow) => rawValue(row, column),
    align: column.type === 'text' || column.type === 'date' ? 'left' : 'right',
    sortable: true,
  })),
);

function defaultStartDate(): string {
  const date = new Date();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toIsoDate(date);
}

function defaultEndDate(): string {
  return toIsoDate(new Date());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rawValue(row: LaborCostToDateRow, column: LaborCostToDateColumn): string | number | null {
  if (column.key === 'employeeCode') {
    return row.employeeCode;
  }
  if (column.key === 'employeeName') {
    return row.employeeName;
  }
  if (column.key === 'departments') {
    return row.departments;
  }
  const value = row.values[column.key];
  return value === undefined ? null : value;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatCell(row: LaborCostToDateRow, columnKey: string): string {
  const column = visibleColumns.value.find((item) => item.key === columnKey);
  if (!column) {
    return '';
  }
  const value = rawValue(row, column);
  if (column.type === 'money') {
    return formatMoney(Number(value ?? 0));
  }
  if (column.type === 'number') {
    return Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  if (column.type === 'date') {
    return value ? formatDate(String(value)) : '—';
  }
  return value == null || value === '' ? '—' : String(value);
}

function formatTotal(column: LaborCostToDateColumn): string {
  if (column.key === 'employeeName') {
    return 'Totals';
  }
  if (column.type === 'money') {
    return formatMoney(report.value?.totals[column.key] ?? 0);
  }
  if (column.type === 'number') {
    return Number(report.value?.totals[column.key] ?? 0).toLocaleString('en-US', {
      maximumFractionDigits: 4,
    });
  }
  return '';
}

function cellAlign(columnKey: string): string {
  const column = visibleColumns.value.find((item) => item.key === columnKey);
  return column && (column.type === 'money' || column.type === 'number') ? 'text-right' : '';
}

function storedColumnKeys(): string[] | null {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : null;
  } catch {
    return null;
  }
}

function syncVisibleColumns(columns: LaborCostToDateColumn[]): void {
  const available = columns.map((column) => column.key);
  const stored = storedColumnKeys();
  if (!stored) {
    visibleColumnKeys.value = columns.filter((column) => column.defaultVisible).map((column) => column.key);
    return;
  }
  const kept = stored.filter((key) => available.includes(key));
  const added = available.filter((key) => !stored.includes(key));
  visibleColumnKeys.value = kept.length ? [...kept, ...added] : available;
}

watch(
  () => report.value?.columns,
  (columns) => {
    if (columns?.length) {
      syncVisibleColumns(columns);
    }
  },
);

watch(visibleColumnKeys, (keys) => {
  if (!keys.length) {
    return;
  }
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(keys));
});

watch(scope, () => {
  reportsStore.clearLaborCostToDateReport();
});

async function generateReport() {
  if (!canGenerate.value || !startDate.value || !endDate.value) {
    return;
  }

  await reportsStore.fetchLaborCostToDateReport({
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    employeeGroupId: employeeGroupId.value,
  });
}

function handleExportExcel() {
  if (!report.value || !visibleColumns.value.length) {
    return;
  }
  exportLaborCostToDateExcel(report.value, visibleColumns.value);
  $q.notify({ type: 'positive', message: 'Labor cost to date exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value || !visibleColumns.value.length) {
    return;
  }
  const opened = exportLaborCostToDatePdf(report.value, visibleColumns.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}
</script>

<style scoped>
.labor-cost-to-date-report__totals-row {
  background: #d6eaf8;
}
</style>
