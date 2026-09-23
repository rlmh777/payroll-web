<template>
  <div class="payroll-summary-by-department-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Payroll Summary by Department</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      View payroll hours and amounts by department for a processed payroll run. Columns follow earning codes.
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
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period group</div>
                <div class="text-body1 text-weight-medium">{{ report.payPeriodGroupName ?? '—' }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period date range</div>
                <div class="text-body1 text-weight-medium">{{ formatDateRange(report) }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period number</div>
                <div class="text-body1 text-weight-medium">{{ report.payPeriodNumber }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              :disable="!report.departments.length"
              @click="handleExportExcel"
            />
          </div>
        </div>

        <q-banner
          v-if="!report.departments.length"
          rounded
          class="bg-grey-2 text-grey-8"
        >
          No payroll data was found for this payroll run.
        </q-banner>

        <q-tabs
          v-else
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

        <q-tab-panels v-if="report.departments.length" v-model="selectedDepartmentKey" animated>
          <q-tab-panel
            v-for="department in report.departments"
            :key="departmentTabKey(department)"
            :name="departmentTabKey(department)"
            class="q-pa-none"
          >
            <q-table
              :rows="department.rows"
              :columns="buildColumns(report.earningColumns ?? [])"
              row-key="employeeId"
              flat
              bordered
              dense
              :loading="reportsStore.isLoadingPayrollSummaryByDepartment"
              no-data-label="No employees found for this department."
              :pagination="{ rowsPerPage: 20 }"
            >
              <template #body-cell="props">
                <q-td
                  :props="props"
                  :class="['employeeCode', 'employeeName'].includes(String(props.col.name)) ? '' : 'text-right'"
                >
                  <template v-if="props.col.name === 'employeeCode' || props.col.name === 'employeeName'">
                    {{ props.value }}
                  </template>
                  <template v-else-if="String(props.col.name).endsWith('-hours')">
                    {{ Number(props.value ?? 0).toFixed(2) }}
                  </template>
                  <template v-else>
                    {{ formatPayrollSummaryCurrency(Number(props.value ?? 0)) }}
                  </template>
                </q-td>
              </template>

              <template #bottom-row>
                <q-tr class="payroll-summary-by-department-report__totals-row">
                  <q-td class="text-weight-bold">Totals</q-td>
                  <q-td />
                  <template v-for="column in report.earningColumns ?? []" :key="`total-${column.key}`">
                    <q-td v-if="column.showHours" class="text-right text-weight-bold">
                      {{ (department.totals.hours[column.key] ?? 0).toFixed(2) }}
                    </q-td>
                    <q-td class="text-right text-weight-bold">
                      {{ formatPayrollSummaryCurrency(department.totals.amounts[column.key] ?? 0) }}
                    </q-td>
                  </template>
                  <q-td class="text-right text-weight-bold">
                    {{ formatPayrollSummaryCurrency(department.totals.grossPay) }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type PayrollSummaryByDepartmentDepartment,
  type PayrollSummaryByDepartmentReport,
  type PayrollSummaryEarningColumn,
} from '@payroll/stores/reports-store';
import {
  exportPayrollSummaryByDepartmentExcel,
  formatPayrollSummaryCurrency,
} from '@payroll/utils/payroll-summary-by-department-export';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();

const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);
const { payrollSummaryByDepartmentReport: report } = storeToRefs(reportsStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const selectedDepartmentKey = ref<string | null>(null);

function buildColumns(earningColumns: PayrollSummaryEarningColumn[]): QTableProps['columns'] {
  const dynamic: NonNullable<QTableProps['columns']> = [];
  earningColumns.forEach((column) => {
    if (column.showHours) {
      dynamic.push({
        name: `${column.key}-hours`,
        label: `${column.name} Hours`,
        field: (row: { hours?: Record<string, number> }) => row.hours?.[column.key] ?? 0,
        align: 'right',
        sortable: true,
      });
    }
    dynamic.push({
      name: `${column.key}-amount`,
      label: column.name,
      field: (row: { amounts?: Record<string, number> }) => row.amounts?.[column.key] ?? 0,
      align: 'right',
      sortable: true,
    });
  });

  return [
    { name: 'employeeCode', label: 'Employee Code', field: 'employeeCode', align: 'left', sortable: true },
    { name: 'employeeName', label: 'Employee Name', field: 'employeeName', align: 'left', sortable: true },
    ...dynamic,
    { name: 'grossPay', label: 'Gross Pay', field: 'grossPay', align: 'right', sortable: true },
  ];
}

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

function formatDateRange(reportData: PayrollSummaryByDepartmentReport): string {
  return `${formatDate(reportData.payPeriodStartDate)} - ${formatDate(reportData.payPeriodEndDate)}`;
}

function departmentTabKey(department: PayrollSummaryByDepartmentDepartment): string {
  return department.departmentId !== null
    ? `department-${department.departmentId}`
    : 'department-unassigned';
}

async function loadPayrollSetup() {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
}

function handleExportExcel() {
  if (!report.value) {
    return;
  }

  exportPayrollSummaryByDepartmentExcel(report.value);
  $q.notify({ type: 'positive', message: 'Payroll summary by department exported to Excel.' });
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(selectedPayrollRunId, async (payrollRunId) => {
  reportsStore.clearPayrollSummaryByDepartmentReport();
  selectedDepartmentKey.value = null;

  if (!payrollRunId) {
    return;
  }

  const loaded = await reportsStore.fetchPayrollSummaryByDepartmentReport(payrollRunId);
  if (!loaded) {
    return;
  }

  const firstDepartment = reportsStore.payrollSummaryByDepartmentReport?.departments[0];
  selectedDepartmentKey.value = firstDepartment ? departmentTabKey(firstDepartment) : null;
});

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.payroll-summary-by-department-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
