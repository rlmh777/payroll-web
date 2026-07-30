<template>
  <div class="scheduled-vs-worked-hours-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Scheduled vs Worked Hours</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Compare scheduled hours/pay against worked hours/pay, overtime, tips, shares, and special assignments.
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
            <div class="text-caption text-grey-7">Date range</div>
            <div class="text-body1 text-weight-medium">{{ formatDate(report.payPeriodStartDate) }} - {{ formatDate(report.payPeriodEndDate) }}</div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-caption text-grey-7">Employees</div>
            <div class="text-body1 text-weight-medium">{{ report.rows.length }}</div>
          </div>
        </div>

        <q-table
          :rows="report.rows"
          :columns="columns"
          row-key="employeeId"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingScheduledVsWorkedHours"
          no-data-label="No employees found for this payroll run."
          :pagination="{ rowsPerPage: 20 }"
        >
          <template #body-cell-employeeName="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.employeeName }}</div>
              <div class="text-caption text-grey-7">{{ props.row.employeeCode || props.row.employeeId }}</div>
            </q-td>
          </template>

          <template #body-cell="props">
            <q-td v-if="props.col.name !== 'employeeName'" :props="props" class="text-right">
              <template v-if="String(props.col.name).toLowerCase().includes('hours')">
                {{ Number(props.value ?? 0).toFixed(2) }}
              </template>
              <template v-else>
                {{ formatCurrency(Number(props.value ?? 0)) }}
              </template>
            </q-td>
          </template>

          <template #bottom-row>
            <q-tr class="scheduled-vs-worked-hours-report__totals-row">
              <q-td class="text-weight-bold">Totals</q-td>
              <q-td class="text-right text-weight-bold">{{ report.totals.scheduledHours.toFixed(2) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.scheduledAmount) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ report.totals.workedHours.toFixed(2) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.workedAmount) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ report.totals.overtimeHours.toFixed(2) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.overtimeAmount) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.tips) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.shares) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatCurrency(report.totals.specialAssignments) }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import { useReportsStore } from '@payroll/stores/reports-store';
import { formatDate } from '../attendance/utils';

const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();

const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);
const { scheduledVsWorkedHoursReport: report } = storeToRefs(reportsStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left', sortable: true },
  { name: 'scheduledHours', label: 'Scheduled Hrs', field: 'scheduledHours', align: 'right', sortable: true },
  { name: 'scheduledAmount', label: 'Scheduled Amount', field: 'scheduledAmount', align: 'right', sortable: true },
  { name: 'workedHours', label: 'Worked Hrs', field: 'workedHours', align: 'right', sortable: true },
  { name: 'workedAmount', label: 'Worked Amount', field: 'workedAmount', align: 'right', sortable: true },
  { name: 'overtimeHours', label: 'OT Hrs', field: 'overtimeHours', align: 'right', sortable: true },
  { name: 'overtimeAmount', label: 'OT Amount', field: 'overtimeAmount', align: 'right', sortable: true },
  { name: 'tips', label: 'Tips', field: 'tips', align: 'right', sortable: true },
  { name: 'shares', label: 'Shares', field: 'shares', align: 'right', sortable: true },
  { name: 'specialAssignments', label: 'Special Assignments', field: 'specialAssignments', align: 'right', sortable: true },
];

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
      };
    }),
);

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(selectedPayrollRunId, async (payrollRunId) => {
  reportsStore.clearScheduledVsWorkedHoursReport();

  if (!payrollRunId) {
    return;
  }

  await reportsStore.fetchScheduledVsWorkedHoursReport(payrollRunId);
});

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.scheduled-vs-worked-hours-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>

