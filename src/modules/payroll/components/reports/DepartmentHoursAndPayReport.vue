<template>
  <div class="department-hours-and-pay-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Department Hours and Pay</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Hours, base salary, tips, special pay, and year-to-date totals by department for a payroll run or any date range.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report period, scope, and sort</div>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-option-group
              v-model="period"
              :options="periodOptions"
              color="primary"
              dense
              inline
            />
          </div>
          <template v-if="period === 'payroll_run'">
            <div class="col-12 col-md-6">
              <PayPeriodGroupSelect
                v-model="selectedPayPeriodGroupId"
                label="Pay period group"
                :clearable="false"
                :show-add-new="false"
                :show-edit="false"
                :disable="reportsStore.isLoadingDepartmentHoursAndPay"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="selectedPayrollRunId"
                outlined
                dense
                emit-value
                map-options
                label="Payroll run"
                :loading="isLoadingPayRunSetup"
                :options="payrollRunOptions"
                :disable="!selectedPayPeriodGroupId || reportsStore.isLoadingDepartmentHoursAndPay"
              >
                <template #option="optScope">
                  <q-item v-bind="optScope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ optScope.opt.label }}</q-item-label>
                      <q-item-label v-if="optScope.opt.caption" caption>
                        {{ optScope.opt.caption }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey-7">
                      No payroll runs found for this pay period group.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-3">
              <DateField
                v-model="startDate"
                label="Start date"
                required
                :disable="reportsStore.isLoadingDepartmentHoursAndPay"
              />
            </div>
            <div class="col-12 col-md-3">
              <DateField
                v-model="endDate"
                label="End date"
                required
                :disable="reportsStore.isLoadingDepartmentHoursAndPay"
              />
            </div>
          </template>
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
              :disable="reportsStore.isLoadingDepartmentHoursAndPay"
            />
          </div>
          <div v-if="scope === 'group'" class="col-12 col-md-6">
            <EmployeeGroupSelect
              v-model="employeeGroupId"
              label="Employee group"
              :show-add-new="false"
              :show-edit="false"
              :disable="reportsStore.isLoadingDepartmentHoursAndPay"
            />
          </div>
          <div class="col-12 col-md-6">
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
              hint="Order follows the selected fields: Department, then Name and/or Position"
              :disable="reportsStore.isLoadingDepartmentHoursAndPay"
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
              :loading="reportsStore.isLoadingDepartmentHoursAndPay"
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
              <template v-if="report.period === 'payroll_run' && report.payPeriodGroupName">
                · {{ report.payPeriodGroupName }}
              </template>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-banner rounded class="bg-blue-1 text-primary q-px-md q-py-sm">
              <div class="text-caption text-weight-medium">Employees</div>
              <div class="text-h5 text-weight-bold">{{ report.employeeCount }}</div>
            </q-banner>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              class="q-mr-sm"
              :disable="!report.rows.length"
              @click="handleExportExcel"
            />
            <q-btn
              outline
              color="primary"
              icon="picture_as_pdf"
              label="Export PDF"
              :disable="!report.rows.length"
              @click="handleExportPdf"
            />
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No timesheet data was found for the selected period and scope.
        </q-banner>

        <div v-else class="department-hours-and-pay-report__table-wrap">
          <table class="department-hours-and-pay-report__table">
            <thead>
              <tr>
                <th colspan="6" class="department-hours-and-pay-report__group department-hours-and-pay-report__group--employee">
                  Employee
                </th>
                <th colspan="5" class="department-hours-and-pay-report__group department-hours-and-pay-report__group--hours">
                  Hours
                </th>
                <th colspan="6" class="department-hours-and-pay-report__group department-hours-and-pay-report__group--pay">
                  Pay
                </th>
              </tr>
              <tr>
                <th>Dept</th>
                <th>Name</th>
                <th>Start Date MM/DD/YY</th>
                <th>Shares</th>
                <th>Position</th>
                <th>Reg 2 wk BASE Salary</th>
                <th class="department-hours-and-pay-report__hours">Reg Hrs</th>
                <th class="department-hours-and-pay-report__hours">OT Hrs</th>
                <th class="department-hours-and-pay-report__hours">Holiday Hrs</th>
                <th class="department-hours-and-pay-report__hours">Vacation Hrs</th>
                <th class="department-hours-and-pay-report__hours">Total Hrs</th>
                <th class="department-hours-and-pay-report__pay">TOTAL PAY</th>
                <th class="department-hours-and-pay-report__pay">Staff Grat</th>
                <th class="department-hours-and-pay-report__pay">Tips</th>
                <th class="department-hours-and-pay-report__pay">SPECIAL PAY</th>
                <th class="department-hours-and-pay-report__pay">Resv Comm</th>
                <th class="department-hours-and-pay-report__pay">Combined YTD TOTAL PAY (incl Grat, Tips, Trips, etc)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sortedRows" :key="row.employeeId">
                <td>{{ row.department || '—' }}</td>
                <td>
                  <div class="text-weight-medium">{{ row.employeeName }}</div>
                  <div class="text-caption text-grey-7">{{ row.employeeCode || row.employeeId }}</div>
                </td>
                <td>{{ formatStartDate(row.startDate) }}</td>
                <td class="text-right">{{ formatNumber(row.shares) }}</td>
                <td>{{ row.position || '—' }}</td>
                <td class="text-right">{{ formatCurrency(row.biweeklyBaseSalary) }}</td>
                <td class="text-right">{{ formatHours(row.regularHours) }}</td>
                <td class="text-right">{{ formatHours(row.overtimeHours) }}</td>
                <td class="text-right">{{ formatHours(row.holidayHours) }}</td>
                <td class="text-right">{{ formatHours(row.vacationHours) }}</td>
                <td class="text-right text-weight-medium">{{ formatHours(row.totalHours) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell">{{ formatCurrency(row.totalPay) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell">{{ formatCurrency(row.staffGratuity) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell">{{ formatCurrency(row.tips) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell">{{ formatCurrency(row.specialPay) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell">{{ formatCurrency(row.reservationCommission) }}</td>
                <td class="text-right department-hours-and-pay-report__pay-cell text-weight-medium">
                  {{ formatCurrency(row.combinedYtdPay) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="department-hours-and-pay-report__totals-row">
                <td class="text-weight-bold">Totals</td>
                <td></td>
                <td></td>
                <td class="text-right text-weight-bold">{{ formatNumber(report.totals.shares) }}</td>
                <td></td>
                <td class="text-right text-weight-bold">{{ formatCurrency(report.totals.biweeklyBaseSalary) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.regularHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.overtimeHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.holidayHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.vacationHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.totalHours) }}</td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.totalPay) }}
                </td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.staffGratuity) }}
                </td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.tips) }}
                </td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.specialPay) }}
                </td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.reservationCommission) }}
                </td>
                <td class="text-right text-weight-bold department-hours-and-pay-report__pay-cell">
                  {{ formatCurrency(report.totals.combinedYtdPay) }}
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
import { computed, onMounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import EmployeeGroupSelect from '@hr/components/employee-group/EmployeeGroupSelect.vue';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type DepartmentHoursAndPayPeriod,
  type DepartmentHoursAndPayScope,
  type DepartmentHoursAndPaySortKey,
  type DepartmentHoursAndPayRow,
} from '@payroll/stores/reports-store';
import { exportDepartmentHoursAndPayExcel, exportDepartmentHoursAndPayPdf } from '@payroll/utils/department-hours-and-pay-export';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();
const { departmentHoursAndPayReport: report } = storeToRefs(reportsStore);
const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);

const period = ref<DepartmentHoursAndPayPeriod>('payroll_run');
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<DepartmentHoursAndPayScope>('company');
const departmentId = ref<number | null>(null);
const employeeGroupId = ref<string | null>(null);
const sortBy = ref<DepartmentHoursAndPaySortKey[]>(['department', 'name']);

const periodOptions = [
  { label: 'Payroll run', value: 'payroll_run' },
  { label: 'Custom dates', value: 'dates' },
];

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
  { label: 'Group', value: 'group' },
];

const sortOptions = [
  { label: 'Department', value: 'department' },
  { label: 'Name', value: 'name' },
  { label: 'Position', value: 'position' },
];

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const payrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;
      const status = run.status ? run.status.charAt(0).toUpperCase() + run.status.slice(1).toLowerCase() : '';
      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : (run.payrollNumberFormatted || 'Payroll run'),
        caption: status,
      };
    }),
);

const canGenerate = computed(() => {
  if (scope.value === 'department' && departmentId.value == null) {
    return false;
  }
  if (scope.value === 'group' && !employeeGroupId.value) {
    return false;
  }
  if (period.value === 'payroll_run') {
    return Boolean(selectedPayrollRunId.value);
  }
  return Boolean(startDate.value && endDate.value && startDate.value <= endDate.value);
});

const sortedRows = computed(() => {
  const rows = [...(report.value?.rows ?? [])];
  const keys = sortBy.value.length ? sortBy.value : (['department', 'name'] as DepartmentHoursAndPaySortKey[]);
  return rows.sort((left, right) => {
    for (const key of keys) {
      const comparison = sortValue(left, key).localeCompare(sortValue(right, key), undefined, {
        sensitivity: 'base',
      });
      if (comparison !== 0) {
        return comparison;
      }
    }
    return (left.employeeCode ?? '').localeCompare(right.employeeCode ?? '');
  });
});

function sortValue(row: DepartmentHoursAndPayRow, key: DepartmentHoursAndPaySortKey): string {
  if (key === 'department') {
    return row.department ?? '';
  }
  if (key === 'position') {
    return row.position ?? '';
  }
  return row.employeeName ?? '';
}

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

function formatStartDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
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

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

async function loadPayrollSetup() {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
}

watch(period, () => {
  reportsStore.clearDepartmentHoursAndPayReport();
});

watch(scope, () => {
  reportsStore.clearDepartmentHoursAndPayReport();
});

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

async function generateReport() {
  if (!canGenerate.value) {
    return;
  }

  await reportsStore.fetchDepartmentHoursAndPayReport({
    period: period.value,
    payrollRunId: selectedPayrollRunId.value,
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    employeeGroupId: employeeGroupId.value,
    sortBy: sortBy.value,
  });
}

function handleExportExcel() {
  if (!report.value) {
    return;
  }
  exportDepartmentHoursAndPayExcel(report.value);
  $q.notify({ type: 'positive', message: 'Department hours and pay exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) {
    return;
  }
  const opened = exportDepartmentHoursAndPayPdf(report.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.department-hours-and-pay-report__table-wrap {
  overflow-x: auto;
}

.department-hours-and-pay-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.department-hours-and-pay-report__table th,
.department-hours-and-pay-report__table td {
  border: 1px solid #cfd8dc;
  padding: 6px 8px;
  vertical-align: middle;
}

.department-hours-and-pay-report__group {
  text-align: center;
  font-weight: 700;
}

.department-hours-and-pay-report__group--employee {
  background: #eceff1;
}

.department-hours-and-pay-report__group--hours,
.department-hours-and-pay-report__hours {
  background: #cfd8dc;
}

.department-hours-and-pay-report__group--pay,
.department-hours-and-pay-report__pay {
  background: #f4c7a1;
}

.department-hours-and-pay-report__pay-cell {
  background: #fbe9d7;
}

.department-hours-and-pay-report__totals-row {
  background: #eceff1;
}
</style>
