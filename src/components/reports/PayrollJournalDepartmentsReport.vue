<template>
  <div class="payroll-journal-departments-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Payroll Journal Departments</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Department payroll journal with detailed employee rows and rollups.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Payroll run selection</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <PayPeriodGroupSelect
              v-model="selectedPayPeriodGroupId"
              label="Pay period group"
              :clearable="false"
              :show-add-new="false"
              :show-edit="false"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedPayrollRunId"
              outlined
              emit-value
              map-options
              label="Processed payroll run"
              :loading="isLoadingPayRunSetup"
              :options="processedPayrollRunOptions"
              :disable="!selectedPayPeriodGroupId"
            >
              <template #prepend><q-icon name="task_alt" /></template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Pay period group</div>
            <div class="text-body1 text-weight-medium">{{ report.payPeriodGroupName ?? '—' }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Pay period date range</div>
            <div class="text-body1 text-weight-medium">{{ formatDateRange(report) }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Payroll number</div>
            <div class="text-body1 text-weight-medium">{{ report.payPeriodNumber }}</div>
          </div>
        </div>

        <q-tabs
          v-if="report.departments.length"
          v-model="selectedDepartmentKey"
          dense
          class="text-primary q-mb-md"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab
            v-for="department in report.departments"
            :key="departmentTabKey(department)"
            :name="departmentTabKey(department)"
            :label="department.departmentName"
          />
        </q-tabs>

        <q-banner v-else rounded class="bg-grey-2 text-grey-8">
          No payroll data was found for this payroll run.
        </q-banner>

        <q-tab-panels v-if="report.departments.length" v-model="selectedDepartmentKey" animated>
          <q-tab-panel
            v-for="department in report.departments"
            :key="departmentTabKey(department)"
            :name="departmentTabKey(department)"
            class="q-pa-none"
          >
            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              Payroll Journal for {{ department.departmentName }}
            </div>

            <q-markup-table flat bordered dense class="journal-table">
              <thead>
                <tr>
                  <th rowspan="2" class="text-left">Date</th>
                  <th colspan="3" class="text-center">Regular Pay</th>
                  <th colspan="3" class="text-center">Overtime Pay</th>
                  <th colspan="3" class="text-center">Holiday Pay</th>
                  <th rowspan="2" class="text-right">Other Payments</th>
                  <th rowspan="2" class="text-right">Gross</th>
                  <th colspan="3" class="text-center">Deductions</th>
                  <th rowspan="2" class="text-right">Net Income</th>
                </tr>
                <tr>
                  <th class="text-right">Hours</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Hours</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Hours</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Tax</th>
                  <th class="text-right">Social</th>
                  <th class="text-right">Other</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="employee in department.employees" :key="employee.employeeId">
                  <tr v-for="row in employee.rows" :key="`${employee.employeeId}-${row.date}`">
                    <td class="text-left">
                      {{ formatDate(row.date) }}
                      <span v-if="row.description"> - {{ row.description }}</span>
                    </td>
                    <td class="text-right">{{ formatHours(row.regularHours) }}</td>
                    <td class="text-right">{{ formatMoney(row.regularRate) }}</td>
                    <td class="text-right">{{ formatMoney(row.regularTotal) }}</td>
                    <td class="text-right">{{ formatHours(row.overtimeHours) }}</td>
                    <td class="text-right">{{ formatMoney(row.overtimeRate) }}</td>
                    <td class="text-right">{{ formatMoney(row.overtimeTotal) }}</td>
                    <td class="text-right">{{ formatHours(row.holidayHours) }}</td>
                    <td class="text-right">{{ formatMoney(row.holidayRate) }}</td>
                    <td class="text-right">{{ formatMoney(row.holidayTotal) }}</td>
                    <td class="text-right">{{ formatMoney(row.otherPayments) }}</td>
                    <td class="text-right">{{ formatMoney(row.gross) }}</td>
                    <td class="text-right" />
                    <td class="text-right" />
                    <td class="text-right">{{ row.rowType === 'deduction' ? formatMoney(Number(row.otherDeductions ?? 0)) : '' }}</td>
                    <td class="text-right" />
                  </tr>
                  <tr class="bg-grey-2">
                    <td class="text-left text-weight-bold">Employee Rollup</td>
                    <td class="text-right text-weight-bold">{{ formatHours(employee.totals.regularHours) }}</td>
                    <td />
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.regularTotal) }}</td>
                    <td class="text-right text-weight-bold">{{ formatHours(employee.totals.overtimeHours) }}</td>
                    <td />
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.overtimeTotal) }}</td>
                    <td class="text-right text-weight-bold">{{ formatHours(employee.totals.holidayHours) }}</td>
                    <td />
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.holidayTotal) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.otherPayments) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.gross) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(Number(employee.totals.tax ?? 0)) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(Number(employee.totals.social ?? 0)) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(Number(employee.totals.otherDeductions ?? 0)) }}</td>
                    <td class="text-right text-weight-bold">{{ formatMoney(employee.totals.netIncome) }}</td>
                  </tr>
                  <tr class="bg-blue-1">
                    <td colspan="16" class="text-left">
                      <span class="text-weight-medium">Employee:</span>
                      {{ employee.employeeCode ?? '—' }} - {{ employee.employeeName }}
                      &nbsp;|&nbsp;
                      <span class="text-weight-medium">Bank:</span>
                      {{ employee.bankName ?? '—' }}
                      &nbsp;|&nbsp;
                      <span class="text-weight-medium">Account:</span>
                      {{ employee.accountNumber ?? '—' }}
                    </td>
                  </tr>
                </template>
                <tr class="bg-grey-3">
                  <td class="text-left text-weight-bold">Department Rollup</td>
                  <td class="text-right text-weight-bold">{{ formatHours(department.totals.regularHours) }}</td>
                  <td />
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.regularTotal) }}</td>
                  <td class="text-right text-weight-bold">{{ formatHours(department.totals.overtimeHours) }}</td>
                  <td />
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.overtimeTotal) }}</td>
                  <td class="text-right text-weight-bold">{{ formatHours(department.totals.holidayHours) }}</td>
                  <td />
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.holidayTotal) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.otherPayments) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.gross) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(Number(department.totals.tax ?? 0)) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(Number(department.totals.social ?? 0)) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(Number(department.totals.otherDeductions ?? 0)) }}</td>
                  <td class="text-right text-weight-bold">{{ formatMoney(department.totals.netIncome) }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PayPeriodGroupSelect from 'src/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from 'src/components/attendance/utils';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { usePayPeriodGroupStore } from 'src/stores/pay-period-group-store';
import {
  type PayrollJournalDepartmentsDepartment,
  type PayrollJournalDepartmentsReport,
  useReportsStore,
} from 'src/stores/reports-store';

const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();

const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);
const { payrollJournalDepartmentsReport: report } = storeToRefs(reportsStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const selectedDepartmentKey = ref<string | null>(null);

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const processedPayrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => run.status.toLowerCase() === 'posted')
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;
      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : 'Processed payroll run',
        caption: schedule?.payDate ? `Pay ${formatDate(schedule.payDate)} · Processed` : 'Processed',
      };
    }),
);

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

function formatDateRange(reportData: PayrollJournalDepartmentsReport): string {
  return `${formatDate(reportData.payPeriodStartDate)} - ${formatDate(reportData.payPeriodEndDate)}`;
}

function departmentTabKey(department: PayrollJournalDepartmentsDepartment): string {
  return department.departmentId !== null ? `department-${department.departmentId}` : 'department-unassigned';
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatHours(value: number): string {
  return Number(value ?? 0).toFixed(2);
}

async function loadPayrollSetup() {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(selectedPayrollRunId, async (payrollRunId) => {
  reportsStore.clearPayrollJournalDepartmentsReport();
  selectedDepartmentKey.value = null;

  if (!payrollRunId) return;

  const loaded = await reportsStore.fetchPayrollJournalDepartmentsReport(payrollRunId);
  if (!loaded) return;

  const firstDepartment = reportsStore.payrollJournalDepartmentsReport?.departments[0];
  selectedDepartmentKey.value = firstDepartment ? departmentTabKey(firstDepartment) : null;
});

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.journal-table :deep(th),
.journal-table :deep(td) {
  font-size: 12px;
}
</style>
