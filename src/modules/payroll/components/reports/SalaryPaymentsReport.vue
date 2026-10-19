<template>
  <div class="salary-payments-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Salary Payments</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Hours and pay for a date range, for the whole company or one department. Double time is holiday pay
      at double time. Base salary holiday time stays in regular pay.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report filters</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <DateField
              v-model="startDate"
              label="Start date"
              required
              :disable="reportsStore.isLoadingSalaryPayments"
            />
          </div>
          <div class="col-12 col-md-3">
            <DateField
              v-model="endDate"
              label="End date"
              required
              :disable="reportsStore.isLoadingSalaryPayments"
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
          <div v-if="scope === 'department'" class="col-12 col-md-4">
            <ParentDepartmentSelect
              v-model="departmentId"
              label="Department"
              outlined
              dense
              clearable
              :disable="reportsStore.isLoadingSalaryPayments"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              use-chips
              label="Sort by"
              :disable="reportsStore.isLoadingSalaryPayments"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="visibleColumnKeys"
              :options="columnOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              options-dense
              label="Columns"
              :display-value="columnSelectionLabel"
              :menu-props="{ maxHeight: '320px' }"
              :disable="reportsStore.isLoadingSalaryPayments"
              @update:model-value="columnsCustomized = true"
            >
              <template #before-options>
                <div class="row items-center justify-end q-px-sm q-py-xs">
                  <q-btn flat dense no-caps size="sm" label="All" @click.stop="selectAllColumns" />
                  <q-btn flat dense no-caps size="sm" label="None" @click.stop="clearColumns" />
                </div>
                <q-separator />
              </template>
              <template #option="{ itemProps, opt, selected, toggleOption }">
                <q-item v-if="opt.isHeader" dense class="text-caption text-weight-bold text-grey-7 bg-grey-2">
                  <q-item-section>{{ opt.label }}</q-item-section>
                </q-item>
                <q-item v-else v-bind="itemProps" dense>
                  <q-item-section side>
                    <q-checkbox
                      :model-value="selected"
                      dense
                      @update:model-value="toggleOption(opt)"
                      @click.stop
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
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
              :loading="reportsStore.isLoadingSalaryPayments"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-end q-col-gutter-md q-mb-md">
          <div class="col">
            <div class="text-h6 text-weight-bold">{{ report.title }}</div>
            <div class="text-body2">Payments for Period: {{ formatDate(report.startDate) }} to {{ formatDate(report.endDate) }}</div>
            <div class="text-caption text-grey-8">{{ report.scopeLabel }} · {{ report.employeeCount }} employees</div>
          </div>
          <div class="col-auto">
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
          No salary payments were found for the selected dates.
        </q-banner>

        <div v-else class="salary-payments-report__table-wrap">
          <table class="salary-payments-report__table">
            <thead>
              <tr>
                <th rowspan="2">Employee Name</th>
                <template v-for="(group, index) in headerGroups" :key="`group-${index}`">
                  <th v-if="group.label" :colspan="group.columns.length" class="text-center">{{ group.label }}</th>
                  <th v-else rowspan="2" :class="isTextColumn(group.columns[0]) ? '' : 'text-right'">{{ group.columns[0]?.label }}</th>
                </template>
              </tr>
              <tr>
                <template v-for="(group, index) in headerGroups" :key="`sub-${index}`">
                  <template v-if="group.label">
                    <th v-for="column in group.columns" :key="column.key" class="text-right">{{ column.label }}</th>
                  </template>
                </template>
              </tr>
            </thead>
            <tbody>
              <template v-if="grouped">
                <template v-for="department in groupedDepartments" :key="department.departmentId ?? department.departmentName">
                  <tr class="salary-payments-report__dept-row">
                    <td :colspan="visibleColumns.length + 1">{{ department.departmentName }}</td>
                  </tr>
                  <tr v-for="row in department.rows" :key="row.employeeId">
                    <td>{{ row.displayName }}</td>
                    <td v-for="column in visibleColumns" :key="column.key" :class="isTextColumn(column) ? '' : 'text-right'">
                      {{ formatCell(column, row) }}
                    </td>
                  </tr>
                  <tr class="salary-payments-report__subtotal-row">
                    <td>{{ department.departmentName }} total</td>
                    <td v-for="column in visibleColumns" :key="column.key" :class="isTextColumn(column) ? '' : 'text-right text-weight-bold'">
                      {{ formatTotal(column, department.totals) }}
                    </td>
                  </tr>
                </template>
              </template>
              <template v-else>
                <tr v-for="row in sortedRows" :key="row.employeeId">
                  <td>{{ row.displayName }}</td>
                  <td v-for="column in visibleColumns" :key="column.key" :class="isTextColumn(column) ? '' : 'text-right'">
                    {{ formatCell(column, row) }}
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="salary-payments-report__totals-row">
                <td>TOTAL</td>
                <td v-for="column in visibleColumns" :key="column.key" :class="isTextColumn(column) ? '' : 'text-right'">
                  {{ formatTotal(column, report.totals) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import { formatDate } from '../attendance/utils';
import {
  useReportsStore,
  type SalaryPaymentsColumn,
  type SalaryPaymentsRow,
  type SalaryPaymentsScope,
  type SalaryPaymentsSortKey,
} from '@payroll/stores/reports-store';
import {
  cellValue,
  exportSalaryPaymentsExcel,
  exportSalaryPaymentsPdf,
  type SalaryPaymentsDepartmentView,
} from '@payroll/utils/salary-payments-export';

const COLUMN_STORAGE_KEY = 'payroll.salary-payments.columns';
const SORT_STORAGE_KEY = 'payroll.salary-payments.sort';

const LEGACY_COLUMN_KEYS = new Set([
  'regularHours',
  'regularPay',
  'overtimeHours',
  'overtimePay',
  'doubletimeHours',
  'doubletimePay',
  'butler',
  'nhcSa',
  'staffGratuity',
  'glcTips',
  'tips',
  'extraTrips',
]);

function profileColumn(
  key: string,
  label: string,
  category: string,
  type: SalaryPaymentsColumn['type'] = 'text',
): SalaryPaymentsColumn {
  return { key, label, category, group: null, type, defaultVisible: false, total: false };
}

const FALLBACK_COLUMNS: SalaryPaymentsColumn[] = [
  profileColumn('employeeCode', 'Code', 'Employee'),
  profileColumn('firstName', 'First name', 'Employee'),
  profileColumn('middleName', 'Middle name', 'Employee'),
  profileColumn('lastName', 'Last name', 'Employee'),
  profileColumn('email', 'Email', 'Employee'),
  profileColumn('phone', 'Phone', 'Employee'),
  profileColumn('employmentStatus', 'Employment status', 'Employee'),
  profileColumn('employeeStatus', 'Employee status', 'Employee'),
  profileColumn('paymentMethod', 'Payment method', 'Employee'),
  profileColumn('payFrequency', 'Pay frequency', 'Employee'),
  profileColumn('department', 'Department', 'Department'),
  profileColumn('parentDepartment', 'Parent department', 'Department'),
  profileColumn('jobTitle', 'Job title', 'Contract'),
  profileColumn('contractType', 'Contract type', 'Contract'),
  profileColumn('contractStart', 'Contract start', 'Contract', 'date'),
  profileColumn('contractEnd', 'Contract end', 'Contract', 'date'),
  profileColumn('worksite', 'Worksite', 'Contract'),
  profileColumn('compensationMethod', 'Compensation method', 'Compensation'),
  profileColumn('hourlyRate', 'Hourly rate', 'Compensation', 'money'),
  profileColumn('dailyRate', 'Daily rate', 'Compensation', 'money'),
  profileColumn('yearlyRate', 'Yearly rate', 'Compensation', 'money'),
  profileColumn('weeklyHours', 'Weekly hours', 'Compensation', 'hours'),
  { key: 'gross', label: 'Gross', category: 'Earnings', group: null, type: 'money', defaultVisible: true, total: true },
];

const $q = useQuasar();
const reportsStore = useReportsStore();
const { salaryPaymentsReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<SalaryPaymentsScope>('company');
const departmentId = ref<number | null>(null);
const sortBy = ref<SalaryPaymentsSortKey[]>(readSort());
const storedColumnKeys = readColumns();
const columnsCustomized = ref(storedColumnKeys.length > 0);
const visibleColumnKeys = ref<string[]>(
  storedColumnKeys.length
    ? storedColumnKeys
    : FALLBACK_COLUMNS.filter((column) => column.defaultVisible).map((column) => column.key),
);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
];

const sortOptions = [
  { label: 'Department', value: 'department' },
  { label: 'Last name', value: 'lastName' },
  { label: 'First name', value: 'firstName' },
  { label: 'Employee code', value: 'employeeCode' },
];

const availableColumns = computed(() => report.value?.columns ?? FALLBACK_COLUMNS);

const columnOptions = computed(() => {
  const groups = new Map<string, { label: string; value: string; isHeader?: boolean }[]>();
  for (const column of availableColumns.value) {
    const category = column.category || 'Other';
    const options = groups.get(category) ?? [];
    options.push({
      label: column.group ? `${column.group} — ${column.label}` : column.label,
      value: column.key,
    });
    groups.set(category, options);
  }
  return [...groups.entries()].flatMap(([label, options]) => [
    { label, value: `group:${label}`, isHeader: true },
    ...options,
  ]);
});

const columnSelectionLabel = computed(() => {
  const selected = visibleColumnKeys.value.length;
  const total = availableColumns.value.length;
  if (selected === 0) return 'No columns';
  if (selected === total) return 'All columns';
  return `${selected} of ${total} columns`;
});

function selectAllColumns() {
  columnsCustomized.value = true;
  visibleColumnKeys.value = availableColumns.value.map((column) => column.key);
}

function clearColumns() {
  columnsCustomized.value = true;
  visibleColumnKeys.value = [];
}

const visibleColumns = computed(() => {
  const selected = new Set(visibleColumnKeys.value);
  return availableColumns.value.filter((column) => selected.has(column.key));
});

const grouped = computed(() => sortBy.value.includes('department'));

const sortedRows = computed(() => {
  const rows = [...(report.value?.rows ?? [])];
  const keys = sortBy.value.length ? sortBy.value : (['department', 'lastName'] as SalaryPaymentsSortKey[]);
  return rows.sort((left, right) => compareRows(left, right, keys));
});

const groupedDepartments = computed<SalaryPaymentsDepartmentView[]>(() => {
  if (!grouped.value) {
    return [];
  }
  const groups: SalaryPaymentsDepartmentView[] = [];
  for (const row of sortedRows.value) {
    const key = row.departmentId ?? null;
    let group = groups.find((item) => item.departmentId === key && item.departmentName === row.departmentName);
    if (!group) {
      group = {
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        rows: [],
        totals: {},
      };
      groups.push(group);
    }
    group.rows.push(row);
  }
  const columns = report.value?.columns ?? [];
  return groups.map((group) => ({
    ...group,
    totals: sumTotals(group.rows, columns),
  }));
});

const headerGroups = computed(() => {
  const groups: { label: string | null; columns: SalaryPaymentsColumn[] }[] = [];
  for (const column of visibleColumns.value) {
    const last = groups[groups.length - 1];
    if (column.group && last?.label === column.group) {
      last.columns.push(column);
    } else {
      groups.push({ label: column.group, columns: [column] });
    }
  }
  return groups;
});

const canGenerate = computed(() => {
  if (!startDate.value || !endDate.value || startDate.value > endDate.value) {
    return false;
  }
  return scope.value !== 'department' || departmentId.value != null;
});

function compareRows(left: SalaryPaymentsRow, right: SalaryPaymentsRow, keys: SalaryPaymentsSortKey[]): number {
  for (const key of keys) {
    const comparison = sortValue(left, key).localeCompare(sortValue(right, key), undefined, { sensitivity: 'base' });
    if (comparison !== 0) {
      return comparison;
    }
  }
  return left.employeeCode.localeCompare(right.employeeCode);
}

function sortValue(row: SalaryPaymentsRow, key: SalaryPaymentsSortKey): string {
  if (key === 'department') return row.departmentName;
  if (key === 'lastName') return row.lastName;
  if (key === 'firstName') return row.firstName;
  return row.employeeCode;
}

function sumTotals(rows: SalaryPaymentsRow[], columns: SalaryPaymentsColumn[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const column of columns) {
    if (!column.total) continue;
    totals[column.key] = rows.reduce((sum, row) => sum + Number(row.values[column.key] ?? 0), 0);
  }
  return totals;
}

function isTextColumn(column: SalaryPaymentsColumn | undefined): boolean {
  return column?.type === 'text' || column?.type === 'date';
}

function formatCell(column: SalaryPaymentsColumn, row: SalaryPaymentsRow): string {
  const value = cellValue(row, column);
  if (column.type === 'text') return String(value);
  if (column.type === 'date') return value ? formatDate(String(value)) : '';
  if (column.type === 'hours' || column.type === 'number') return Number(value).toFixed(2);
  return formatCurrency(Number(value));
}

function formatTotal(column: SalaryPaymentsColumn, totals: Record<string, number>): string {
  if (!column.total) return '';
  const value = Number(totals[column.key] ?? 0);
  return column.type === 'hours' || column.type === 'number' ? value.toFixed(2) : formatCurrency(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(1);
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

function readSort(): SalaryPaymentsSortKey[] {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  if (!stored) return ['department', 'lastName'];
  try {
    const parsed = JSON.parse(stored) as SalaryPaymentsSortKey[];
    return parsed.length ? parsed : ['department', 'lastName'];
  } catch {
    return ['department', 'lastName'];
  }
}

function readColumns(): string[] {
  const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as string[];
    if (!Array.isArray(parsed) || parsed.some((key) => LEGACY_COLUMN_KEYS.has(key))) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function defaultColumnKeys(columns: SalaryPaymentsColumn[]): string[] {
  return columns.filter((column) => column.defaultVisible).map((column) => column.key);
}

watch(sortBy, (value) => {
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(value));
});

watch(visibleColumnKeys, (value) => {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(value));
});

watch(report, (value) => {
  if (!value) return;
  const allowed = new Set(value.columns.map((column) => column.key));
  if (!columnsCustomized.value) {
    visibleColumnKeys.value = defaultColumnKeys(value.columns);
    return;
  }
  const kept = visibleColumnKeys.value.filter((key) => allowed.has(key));
  if (kept.length !== visibleColumnKeys.value.length) {
    visibleColumnKeys.value = kept.length ? kept : defaultColumnKeys(value.columns);
  }
});

watch(scope, () => {
  reportsStore.clearSalaryPaymentsReport();
});

async function generateReport() {
  if (!canGenerate.value || !startDate.value || !endDate.value) return;
  const loaded = await reportsStore.fetchSalaryPaymentsReport({
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    sortBy: sortBy.value,
  });
  if (loaded && report.value && !visibleColumnKeys.value.length && !columnsCustomized.value) {
    visibleColumnKeys.value = defaultColumnKeys(report.value.columns);
  }
}

function handleExportExcel() {
  if (!report.value) return;
  exportSalaryPaymentsExcel(
    report.value,
    visibleColumns.value,
    groupedDepartments.value,
    grouped.value ? null : sortedRows.value,
    report.value.totals,
  );
  $q.notify({ type: 'positive', message: 'Salary payments exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportSalaryPaymentsPdf(
    report.value,
    visibleColumns.value,
    groupedDepartments.value,
    grouped.value ? null : sortedRows.value,
    report.value.totals,
  );
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}

onUnmounted(() => {
  reportsStore.clearSalaryPaymentsReport();
});
</script>

<style scoped>
.salary-payments-report__table-wrap {
  overflow-x: auto;
}

.salary-payments-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.salary-payments-report__table th,
.salary-payments-report__table td {
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  white-space: nowrap;
}

.salary-payments-report__table thead th {
  background: #f5f5f5;
  font-weight: 600;
}

.salary-payments-report__dept-row td {
  background: #e8eef6;
  font-weight: 700;
}

.salary-payments-report__subtotal-row td,
.salary-payments-report__totals-row td {
  background: #f3f3f3;
  font-weight: 700;
}
</style>
