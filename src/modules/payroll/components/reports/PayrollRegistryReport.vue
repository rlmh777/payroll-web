<template>
  <div class="payroll-registry-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Payroll Registry by Employees</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Processed payroll by employee, with regular, overtime, and double time, other payments, deductions,
      tax, and social security. Run it for a payroll or a date range, for the company or one department.
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
          <div class="col-12">
            <q-option-group v-model="period" :options="periodOptions" color="primary" dense inline />
          </div>
          <template v-if="period === 'payroll_run'">
            <div class="col-12 col-md-4">
              <PayPeriodGroupSelect
                v-model="selectedPayPeriodGroupId"
                label="Pay period group"
                :clearable="false"
                :show-add-new="false"
                :show-edit="false"
                :disable="reportsStore.isLoadingPayrollRegistry"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="selectedPayrollRunId"
                outlined
                dense
                emit-value
                map-options
                label="Payroll"
                :loading="isLoadingPayRunSetup"
                :options="payrollRunOptions"
                :disable="!selectedPayPeriodGroupId || reportsStore.isLoadingPayrollRegistry"
              />
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-3">
              <DateField
                v-model="startDate"
                label="Start date"
                required
                :disable="reportsStore.isLoadingPayrollRegistry"
              />
            </div>
            <div class="col-12 col-md-3">
              <DateField
                v-model="endDate"
                label="End date"
                required
                :disable="reportsStore.isLoadingPayrollRegistry"
              />
            </div>
          </template>
          <div class="col-12 col-md-4">
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
              :disable="reportsStore.isLoadingPayrollRegistry"
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
              :disable="reportsStore.isLoadingPayrollRegistry"
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
              :loading="reportsStore.isLoadingPayrollRegistry"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="registry-head row items-start q-col-gutter-md q-mb-md">
          <div class="col-auto" v-if="report.company.logoUrl">
            <img :src="report.company.logoUrl" alt="" class="registry-logo" />
          </div>
          <div class="col">
            <div class="text-weight-bold">{{ report.company.name }}</div>
            <div v-for="line in report.company.lines" :key="line" class="text-caption">{{ line }}</div>
          </div>
          <div class="col-auto text-right">
            <div class="text-h6 text-weight-bold">{{ report.title }}</div>
            <div class="text-body2">{{ report.periodLabel }}</div>
            <div class="text-caption text-grey-8">{{ report.scopeLabel }} · {{ report.employeeCount }} employees</div>
          </div>
        </div>
        <div class="q-mb-md text-right">
          <q-btn
            outline
            color="primary"
            icon="table_view"
            label="Export Excel"
            class="q-mr-sm"
            :disable="!report.employees.length"
            @click="handleExportExcel"
          />
          <q-btn
            outline
            color="primary"
            icon="picture_as_pdf"
            label="Export PDF"
            :disable="!report.employees.length"
            @click="handleExportPdf"
          />
        </div>

        <q-banner v-if="!report.employees.length" rounded class="bg-grey-2 text-grey-8">
          No processed payroll was found for the selected period.
        </q-banner>

        <div v-else class="payroll-registry-report__table-wrap">
          <table class="payroll-registry-report__table">
            <thead>
              <tr>
                <th rowspan="2">Proc. Date</th>
                <th rowspan="2">Period</th>
                <th rowspan="2">Payroll #</th>
                <th colspan="2" class="text-center">Regular</th>
                <th colspan="2" class="text-center">Overtime</th>
                <th colspan="2" class="text-center">Double Time</th>
                <th rowspan="2" class="text-right">Misc. Payments</th>
                <th rowspan="2" class="text-right">Gross Pay</th>
                <th rowspan="2" class="text-right">Misc. Deduction</th>
                <th rowspan="2" class="text-right">Tax</th>
                <th rowspan="2" class="text-right">Employee Soc. Sec.</th>
                <th rowspan="2" class="text-right">Net Pay</th>
                <th rowspan="2" class="text-right">Employer Soc. Sec.</th>
                <th rowspan="2" class="text-right">Employer Contr.</th>
              </tr>
              <tr>
                <th class="text-right">Hours</th>
                <th class="text-right">Pay</th>
                <th class="text-right">Hours</th>
                <th class="text-right">Pay</th>
                <th class="text-right">Hours</th>
                <th class="text-right">Pay</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(employee, index) in sortedEmployees" :key="employee.employeeId">
                <tr v-if="showDepartment(index)" class="payroll-registry-report__dept-row">
                  <td colspan="17">{{ employee.departmentName }}</td>
                </tr>
                <tr class="payroll-registry-report__name-row">
                  <td colspan="17">{{ employee.displayName }}</td>
                </tr>
                <template v-for="year in employee.years" :key="`${employee.employeeId}-${year.year}`">
                  <tr class="payroll-registry-report__year-row">
                    <td colspan="17">{{ year.year }}</td>
                  </tr>
                  <tr v-for="line in year.lines" :key="line.payrollId">
                    <td>{{ line.processedDateLabel }}</td>
                    <td class="text-right">{{ line.period }}</td>
                    <td class="text-right">{{ line.payrollNumber }}</td>
                    <td class="text-right">{{ formatHours(line.regularHours) }}</td>
                    <td class="text-right">{{ formatCurrency(line.regularPay) }}</td>
                    <td class="text-right">{{ formatHours(line.overtimeHours) }}</td>
                    <td class="text-right">{{ formatCurrency(line.overtimePay) }}</td>
                    <td class="text-right">{{ formatHours(line.doubleTimeHours) }}</td>
                    <td class="text-right">{{ formatCurrency(line.doubleTimePay) }}</td>
                    <td class="text-right">{{ formatCurrency(line.miscPayments) }}</td>
                    <td class="text-right">{{ formatCurrency(line.grossPay) }}</td>
                    <td class="text-right">{{ formatCurrency(line.miscDeduction) }}</td>
                    <td class="text-right">{{ formatCurrency(line.tax) }}</td>
                    <td class="text-right">{{ formatCurrency(line.employeeSocialSecurity) }}</td>
                    <td class="text-right">{{ formatCurrency(line.netPay) }}</td>
                    <td class="text-right">{{ formatCurrency(line.employerSocialSecurity) }}</td>
                    <td class="text-right">{{ formatCurrency(line.employerContribution) }}</td>
                  </tr>
                  <tr class="payroll-registry-report__year-total-row">
                    <td>{{ year.year }}</td>
                    <td class="text-right">{{ year.payrollCount }}</td>
                    <td></td>
                    <td class="text-right">{{ formatHours(year.totals.regularHours) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.regularPay) }}</td>
                    <td class="text-right">{{ formatHours(year.totals.overtimeHours) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.overtimePay) }}</td>
                    <td class="text-right">{{ formatHours(year.totals.doubleTimeHours) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.doubleTimePay) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.miscPayments) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.grossPay) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.miscDeduction) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.tax) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.employeeSocialSecurity) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.netPay) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.employerSocialSecurity) }}</td>
                    <td class="text-right">{{ formatCurrency(year.totals.employerContribution) }}</td>
                  </tr>
                </template>
                <tr class="payroll-registry-report__employee-total-row">
                  <td></td>
                  <td></td>
                  <td></td>
                  <td class="text-right">{{ formatHours(employee.totals.regularHours) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.regularPay) }}</td>
                  <td class="text-right">{{ formatHours(employee.totals.overtimeHours) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.overtimePay) }}</td>
                  <td class="text-right">{{ formatHours(employee.totals.doubleTimeHours) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.doubleTimePay) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.miscPayments) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.grossPay) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.miscDeduction) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.tax) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.employeeSocialSecurity) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.netPay) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.employerSocialSecurity) }}</td>
                  <td class="text-right">{{ formatCurrency(employee.totals.employerContribution) }}</td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="payroll-registry-report__grand-total-row">
                <td>TOTAL</td>
                <td></td>
                <td></td>
                <td class="text-right">{{ formatHours(report.totals.regularHours) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.regularPay) }}</td>
                <td class="text-right">{{ formatHours(report.totals.overtimeHours) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.overtimePay) }}</td>
                <td class="text-right">{{ formatHours(report.totals.doubleTimeHours) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.doubleTimePay) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.miscPayments) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.grossPay) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.miscDeduction) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.tax) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.employeeSocialSecurity) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.netPay) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.employerSocialSecurity) }}</td>
                <td class="text-right">{{ formatCurrency(report.totals.employerContribution) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type PayrollRegistryEmployee,
  type PayrollRegistryPeriod,
  type PayrollRegistryScope,
  type PayrollRegistrySortKey,
} from '@payroll/stores/reports-store';
import { exportPayrollRegistryExcel, exportPayrollRegistryPdf } from '@payroll/utils/payroll-registry-export';

const SORT_STORAGE_KEY = 'payroll.payroll-registry.sort';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();
const { payrollRegistryReport: report } = storeToRefs(reportsStore);
const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);

const period = ref<PayrollRegistryPeriod>('dates');
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<PayrollRegistryScope>('company');
const departmentId = ref<number | null>(null);
const sortBy = ref<PayrollRegistrySortKey[]>(readSort());

const periodOptions = [
  { label: 'Dates', value: 'dates' },
  { label: 'Payroll', value: 'payroll_run' },
];

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
      const number = run.payrollNumber ? ` #${run.payrollNumber}` : '';
      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}${number}`
          : (run.payrollNumberFormatted || 'Payroll'),
      };
    }),
);

const canGenerate = computed(() => {
  if (scope.value === 'department' && departmentId.value == null) {
    return false;
  }
  if (period.value === 'payroll_run') {
    return Boolean(selectedPayrollRunId.value);
  }
  return Boolean(startDate.value && endDate.value && startDate.value <= endDate.value);
});

const grouped = computed(() => sortBy.value[0] === 'department');

const sortedEmployees = computed(() => {
  const employees = [...(report.value?.employees ?? [])];
  const keys = sortBy.value.length ? sortBy.value : (['department', 'lastName'] as PayrollRegistrySortKey[]);
  return employees.sort((left, right) => compareEmployees(left, right, keys));
});

function showDepartment(index: number): boolean {
  if (!grouped.value) {
    return false;
  }
  const employees = sortedEmployees.value;
  if (index === 0) {
    return true;
  }
  return employees[index]?.departmentName !== employees[index - 1]?.departmentName;
}

function compareEmployees(
  left: PayrollRegistryEmployee,
  right: PayrollRegistryEmployee,
  keys: PayrollRegistrySortKey[],
): number {
  for (const key of keys) {
    const comparison = sortValue(left, key).localeCompare(sortValue(right, key), undefined, { sensitivity: 'base' });
    if (comparison !== 0) {
      return comparison;
    }
  }
  return left.employeeCode.localeCompare(right.employeeCode);
}

function sortValue(employee: PayrollRegistryEmployee, key: PayrollRegistrySortKey): string {
  if (key === 'department') return employee.departmentName;
  if (key === 'lastName') return employee.lastName;
  if (key === 'firstName') return employee.firstName;
  return employee.employeeCode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function formatHours(value: number): string {
  return Number(value || 0).toFixed(2);
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

function readSort(): PayrollRegistrySortKey[] {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  if (!stored) return ['department', 'lastName'];
  try {
    const parsed = JSON.parse(stored) as PayrollRegistrySortKey[];
    return parsed.length ? parsed : ['department', 'lastName'];
  } catch {
    return ['department', 'lastName'];
  }
}

watch(sortBy, (value) => {
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(value));
});

watch(period, () => {
  reportsStore.clearPayrollRegistryReport();
});

watch(scope, () => {
  reportsStore.clearPayrollRegistryReport();
});

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

async function generateReport() {
  if (!canGenerate.value) return;
  await reportsStore.fetchPayrollRegistryReport({
    period: period.value,
    payrollRunId: selectedPayrollRunId.value,
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    sortBy: sortBy.value,
  });
}

function handleExportExcel() {
  if (!report.value) return;
  exportPayrollRegistryExcel(report.value, sortedEmployees.value, grouped.value);
  $q.notify({ type: 'positive', message: 'Payroll registry exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportPayrollRegistryPdf(report.value, sortedEmployees.value, grouped.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}

onMounted(async () => {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

onUnmounted(() => {
  reportsStore.clearPayrollRegistryReport();
});
</script>

<style scoped>
.registry-logo {
  max-height: 64px;
  max-width: 120px;
}

.payroll-registry-report__table-wrap {
  overflow-x: auto;
}

.payroll-registry-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.payroll-registry-report__table th,
.payroll-registry-report__table td {
  padding: 4px 6px;
  border: 1px solid #cfcfcf;
  white-space: nowrap;
}

.payroll-registry-report__table thead th {
  background: #f3f3f3;
  font-weight: 600;
}

.payroll-registry-report__dept-row td {
  background: #e8eef6;
  font-weight: 700;
}

.payroll-registry-report__name-row td {
  background: #efe4c6;
  font-weight: 700;
}

.payroll-registry-report__year-row td {
  font-weight: 700;
}

.payroll-registry-report__year-total-row td {
  background: #f7f7f7;
}

.payroll-registry-report__employee-total-row td {
  background: #d9e8f6;
  font-weight: 700;
}

.payroll-registry-report__grand-total-row td {
  background: #ececec;
  font-weight: 700;
}
</style>
