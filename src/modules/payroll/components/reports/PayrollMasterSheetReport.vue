<template>
  <div class="payroll-master-sheet-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Payroll Master Sheet</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Monthly hours, working pay, and gratuity by department. Pay is split by earning code. Holiday premiums
      such as 1.5, double time, and triple time apply only to hourly and daily pay. Base salary holiday time
      is the daily rate and stays on regular pay.
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
              :disable="reportsStore.isLoadingPayrollMasterSheet"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedYears"
              :options="yearOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              use-chips
              label="Years"
              :disable="reportsStore.isLoadingPayrollMasterSheet"
            />
          </div>
          <div
            v-for="year in selectedYears"
            :key="year"
            class="col-12 col-md-6"
          >
            <q-select
              :model-value="monthsForYear(year)"
              :options="monthOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              use-chips
              :label="`Months in ${year}`"
              :disable="reportsStore.isLoadingPayrollMasterSheet"
              @update:model-value="(value) => setMonthsForYear(year, value)"
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
              :loading="reportsStore.isLoadingPayrollMasterSheet"
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
            <div class="text-h6 text-weight-bold">{{ report.companyName }}</div>
            <div class="text-subtitle1">{{ report.title }}</div>
            <div class="text-caption text-grey-8">{{ report.scopeLabel }}</div>
          </div>
          <div class="col-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              class="q-mr-sm"
              :disable="!report.months.length"
              @click="handleExportExcel"
            />
            <q-btn
              outline
              color="primary"
              icon="picture_as_pdf"
              label="Export PDF"
              :disable="!report.months.length"
              @click="handleExportPdf"
            />
          </div>
        </div>

        <q-banner v-if="!report.months.length" rounded class="bg-grey-2 text-grey-8">
          No months were returned for the selected filters.
        </q-banner>

        <div
          v-for="month in report.months"
          :key="`${month.year}-${month.month}`"
          class="payroll-master-sheet-report__month q-mb-xl"
        >
          <div class="row items-end q-col-gutter-md q-mb-sm">
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{ month.label }}</div>
              <div class="text-caption text-grey-8">
                Grat $ / point {{ formatCurrency(month.gratuityRate) }}
              </div>
            </div>
            <div class="col-auto">
              <q-banner rounded class="bg-blue-1 text-primary q-px-md q-py-sm">
                <div class="text-caption text-weight-medium">Employees</div>
                <div class="text-h6 text-weight-bold">{{ month.employeeCount }}</div>
              </q-banner>
            </div>
          </div>

          <q-banner v-if="!month.departments.length" rounded class="bg-grey-2 text-grey-8">
            No payroll master sheet data was found for {{ month.label }}.
          </q-banner>

          <div v-else class="payroll-master-sheet-report__table-wrap">
            <table class="payroll-master-sheet-report__table">
              <thead>
                <tr>
                  <th rowspan="2">Employee Name</th>
                  <th rowspan="2">Job Description</th>
                  <th rowspan="2" class="text-right">Hourly base</th>
                  <th
                    v-for="column in earningColumns"
                    :key="column.key"
                    colspan="2"
                    class="text-center"
                  >
                    {{ column.name }}
                  </th>
                  <th rowspan="2" class="text-right">Total # of Hrs</th>
                  <th rowspan="2" class="text-right">working $ total</th>
                  <th rowspan="2" class="text-right">Grat PT</th>
                  <th rowspan="2" class="text-right">Grat % worked</th>
                  <th rowspan="2" class="text-right">Grat $ payout</th>
                  <th rowspan="2" class="text-right">Gross Salary</th>
                  <th rowspan="2" class="text-right">Total Gross per Hr</th>
                </tr>
                <tr>
                  <template v-for="column in earningColumns" :key="`${column.key}-sub`">
                    <th class="text-right">Hrs</th>
                    <th class="text-right">Pay</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="department in month.departments" :key="department.departmentId ?? 'unassigned'">
                  <tr class="payroll-master-sheet-report__dept-row">
                    <td :colspan="tableColumnCount">{{ department.departmentName }}</td>
                  </tr>
                  <tr v-for="row in department.rows" :key="row.employeeId">
                    <td>{{ row.employeeName }}</td>
                    <td>{{ row.jobDescription }}</td>
                    <td class="text-right">{{ formatCurrency(row.hourlyBase) }}</td>
                    <template v-for="column in earningColumns" :key="`${row.employeeId}-${column.key}`">
                      <td class="text-right">{{ formatHours(earningHours(row.earnings, column.key)) }}</td>
                      <td class="text-right">{{ formatCurrency(earningAmount(row.earnings, column.key)) }}</td>
                    </template>
                    <td class="text-right">{{ formatHours(row.totalHours) }}</td>
                    <td class="text-right">{{ formatCurrency(row.workingTotal) }}</td>
                    <td class="text-right">{{ formatNumber(row.gratuityPoints) }}</td>
                    <td class="text-right">{{ formatPercent(row.gratuityPercentWorked) }}</td>
                    <td class="text-right">{{ formatCurrency(row.gratuityPayout) }}</td>
                    <td class="text-right">{{ formatCurrency(row.grossSalary) }}</td>
                    <td class="text-right">{{ formatCurrency(row.totalGrossPerHour) }}</td>
                  </tr>
                  <tr class="payroll-master-sheet-report__subtotal-row">
                    <td colspan="3">{{ department.departmentName }} total</td>
                    <template v-for="column in earningColumns" :key="`${department.departmentId}-${column.key}`">
                      <td class="text-right text-weight-bold">
                        {{ formatHours(earningHours(department.totals.earnings, column.key)) }}
                      </td>
                      <td class="text-right text-weight-bold">
                        {{ formatCurrency(earningAmount(department.totals.earnings, column.key)) }}
                      </td>
                    </template>
                    <td class="text-right text-weight-bold">{{ formatHours(department.totals.totalHours) }}</td>
                    <td class="text-right text-weight-bold">{{ formatCurrency(department.totals.workingTotal) }}</td>
                    <td class="text-right text-weight-bold">{{ formatNumber(department.totals.gratuityPoints) }}</td>
                    <td></td>
                    <td class="text-right text-weight-bold">{{ formatCurrency(department.totals.gratuityPayout) }}</td>
                    <td class="text-right text-weight-bold">{{ formatCurrency(department.totals.grossSalary) }}</td>
                    <td class="text-right text-weight-bold">{{ formatCurrency(department.totals.totalGrossPerHour) }}</td>
                  </tr>
                </template>
              </tbody>
              <tfoot>
                <tr class="payroll-master-sheet-report__totals-row">
                  <td colspan="3">TOTAL</td>
                  <template v-for="column in earningColumns" :key="`total-${month.year}-${column.key}`">
                    <td class="text-right">{{ formatHours(earningHours(month.totals.earnings, column.key)) }}</td>
                    <td class="text-right">{{ formatCurrency(earningAmount(month.totals.earnings, column.key)) }}</td>
                  </template>
                  <td class="text-right">{{ formatHours(month.totals.totalHours) }}</td>
                  <td class="text-right">{{ formatCurrency(month.totals.workingTotal) }}</td>
                  <td class="text-right">{{ formatNumber(month.totals.gratuityPoints) }}</td>
                  <td></td>
                  <td class="text-right">{{ formatCurrency(month.totals.gratuityPayout) }}</td>
                  <td class="text-right">{{ formatCurrency(month.totals.grossSalary) }}</td>
                  <td class="text-right">{{ formatCurrency(month.totals.totalGrossPerHour) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
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
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import {
  useReportsStore,
  type PayrollMasterSheetEarningValue,
  type PayrollMasterSheetScope,
} from '@payroll/stores/reports-store';
import { exportPayrollMasterSheetExcel, exportPayrollMasterSheetPdf } from '@payroll/utils/payroll-master-sheet-export';
import { rememberReportMonth, sharedReportMonth, writeReportPeriod } from '@payroll/composables/use-report-period';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { payrollMasterSheetReport: report } = storeToRefs(reportsStore);

const earningColumns = computed(() => report.value?.earningColumns ?? []);
const tableColumnCount = computed(() => 3 + earningColumns.value.length * 2 + 7);

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const sharedMonth = sharedReportMonth();
const initialYear = sharedMonth?.year ?? currentYear;
const initialMonth = sharedMonth?.month ?? currentMonth;

const scope = ref<PayrollMasterSheetScope>('company');
const departmentId = ref<number | null>(null);
const selectedYears = ref<number[]>([initialYear]);
const monthsByYear = ref<Record<number, number[]>>({
  [initialYear]: [initialMonth],
});

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
];

const yearOptions = Array.from({ length: currentYear - 2016 }, (_, index) => {
  const year = 2017 + index;
  return { label: String(year), value: year };
}).concat(
  currentYear >= 2017
    ? [{ label: String(currentYear + 1), value: currentYear + 1 }]
    : [],
);

const monthOptions = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

const selectedPeriods = computed(() => {
  const periods: { year: number; month: number }[] = [];
  for (const year of selectedYears.value) {
    for (const month of monthsByYear.value[year] ?? []) {
      periods.push({ year, month });
    }
  }
  return periods.sort((left, right) => left.year - right.year || left.month - right.month);
});

const canGenerate = computed(() => {
  if (scope.value === 'department' && departmentId.value == null) {
    return false;
  }
  return selectedPeriods.value.length > 0;
});

function monthsForYear(year: number): number[] {
  return monthsByYear.value[year] ?? [];
}

function setMonthsForYear(year: number, value: number[] | null | undefined) {
  monthsByYear.value = {
    ...monthsByYear.value,
    [year]: [...(value ?? [])].sort((left, right) => left - right),
  };
}

watch(selectedYears, (years) => {
  const next: Record<number, number[]> = {};
  for (const year of years) {
    next[year] = monthsByYear.value[year] ?? (year === currentYear ? [currentMonth] : []);
  }
  monthsByYear.value = next;
  reportsStore.clearPayrollMasterSheetReport();
});

watch(scope, () => {
  reportsStore.clearPayrollMasterSheetReport();
});

watch(selectedPeriods, (periods) => {
  if (!periods.length) return;
  const first = periods[0];
  const last = periods[periods.length - 1];
  if (!first || !last) return;
  if (first.year === last.year && first.month === last.month) {
    rememberReportMonth(first.year, first.month);
    return;
  }
  const endDay = new Date(last.year, last.month, 0).getDate();
  writeReportPeriod(
    `${first.year}-${String(first.month).padStart(2, '0')}-01`,
    `${last.year}-${String(last.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
  );
});

async function generateReport() {
  if (!canGenerate.value) {
    return;
  }

  await reportsStore.fetchPayrollMasterSheetReport({
    scope: scope.value,
    departmentId: departmentId.value,
    periods: selectedPeriods.value,
  });
}

function handleExportExcel() {
  if (!report.value) {
    return;
  }
  exportPayrollMasterSheetExcel(report.value);
  $q.notify({ type: 'positive', message: 'Payroll master sheet exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) {
    return;
  }
  const opened = exportPayrollMasterSheetPdf(report.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}

function earningHours(
  earnings: Record<string, PayrollMasterSheetEarningValue> | undefined,
  key: string,
): number {
  return Number(earnings?.[key]?.hours ?? 0);
}

function earningAmount(
  earnings: Record<string, PayrollMasterSheetEarningValue> | undefined,
  key: string,
): number {
  return Number(earnings?.[key]?.amount ?? 0);
}

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));
}

function formatHours(value: number): string {
  return Number(value ?? 0).toFixed(2);
}

function formatNumber(value: number): string {
  return Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatPercent(value: number): string {
  return `${Number(value ?? 0)}%`;
}

onUnmounted(() => {
  reportsStore.clearPayrollMasterSheetReport();
});
</script>

<style scoped>
.payroll-master-sheet-report__table-wrap {
  overflow-x: auto;
}

.payroll-master-sheet-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.payroll-master-sheet-report__table th,
.payroll-master-sheet-report__table td {
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  white-space: nowrap;
}

.payroll-master-sheet-report__table thead th {
  background: #f5f5f5;
  font-weight: 600;
}

.payroll-master-sheet-report__dept-row td {
  background: #e8eef6;
  font-weight: 700;
}

.payroll-master-sheet-report__subtotal-row td {
  background: #f7f7f7;
}

.payroll-master-sheet-report__totals-row td {
  background: #ececec;
  font-weight: 700;
}
</style>
