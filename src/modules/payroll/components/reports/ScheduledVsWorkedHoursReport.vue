<template>
  <div class="scheduled-vs-worked-hours-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Scheduled Hours Cost vs Actual</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Compare scheduled hours and cost with actual hours and cost for a payroll run or any date range,
      company-wide or by department. Timesheets are used even if payroll has not been processed.
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
                :disable="reportsStore.isLoadingScheduledVsWorkedHours"
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
                :disable="!selectedPayPeriodGroupId || reportsStore.isLoadingScheduledVsWorkedHours"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label v-if="scope.opt.caption" caption>
                        {{ scope.opt.caption }}
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
                :disable="reportsStore.isLoadingScheduledVsWorkedHours"
              />
            </div>
            <div class="col-12 col-md-3">
              <DateField
                v-model="endDate"
                label="End date"
                required
                :disable="reportsStore.isLoadingScheduledVsWorkedHours"
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
              :disable="reportsStore.isLoadingScheduledVsWorkedHours"
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
              hint="Order follows the selected fields: Department, Name, and/or Position"
              :disable="reportsStore.isLoadingScheduledVsWorkedHours"
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
              :loading="reportsStore.isLoadingScheduledVsWorkedHours"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Period</div>
            <div class="text-body1 text-weight-medium">
              {{ report.period === 'payroll_run' ? (report.payPeriodGroupName || 'Payroll run') : 'Custom dates' }}
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Scope</div>
            <div class="text-body1 text-weight-medium">{{ report.scopeLabel }}</div>
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Date range</div>
            <div class="text-body1 text-weight-medium">
              {{ formatDate(report.startDate) }} - {{ formatDate(report.endDate) }}
            </div>
          </div>
          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Employees</div>
            <div class="text-body1 text-weight-medium">{{ report.employeeCount }}</div>
          </div>
        </div>
        <div class="q-mb-md text-right">
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

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No timesheet data was found for the selected period and scope.
        </q-banner>

        <q-table
          v-else
          :rows="sortedRows"
          :columns="columns"
          row-key="employeeId"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingScheduledVsWorkedHours"
          no-data-label="No employees found."
          :pagination="{ rowsPerPage: 20 }"
        >
          <template #body-cell-employeeName="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.employeeName }}</div>
              <div class="text-caption text-grey-7">{{ props.row.employeeCode || props.row.employeeId }}</div>
            </q-td>
          </template>

          <template #body-cell="props">
            <q-td
              v-if="textColumns.has(String(props.col.name))"
              :props="props"
            >
              {{ props.value || '—' }}
            </q-td>
            <q-td v-else :props="props" class="text-right">
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
              <q-td></q-td>
              <q-td></q-td>
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
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type ScheduledHoursCostPeriod,
  type ScheduledHoursCostScope,
  type ScheduledHoursCostSortKey,
  type ScheduledVsWorkedHoursRow,
} from '@payroll/stores/reports-store';
import {
  exportScheduledVsWorkedHoursExcel,
  exportScheduledVsWorkedHoursPdf,
} from '@payroll/utils/scheduled-vs-worked-hours-export';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();
const { scheduledVsWorkedHoursReport: report } = storeToRefs(reportsStore);
const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);

const period = ref<ScheduledHoursCostPeriod>('payroll_run');
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<ScheduledHoursCostScope>('company');
const departmentId = ref<number | null>(null);
const sortBy = ref<ScheduledHoursCostSortKey[]>(['department', 'name']);

const textColumns = new Set(['employeeName', 'department', 'position']);

const periodOptions = [
  { label: 'Payroll run', value: 'payroll_run' },
  { label: 'Custom dates', value: 'dates' },
];

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
];

const sortOptions = [
  { label: 'Department', value: 'department' },
  { label: 'Name', value: 'name' },
  { label: 'Position', value: 'position' },
];

const columns: QTableProps['columns'] = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left', sortable: true },
  { name: 'department', label: 'Department', field: 'department', align: 'left', sortable: true },
  { name: 'position', label: 'Position', field: 'position', align: 'left', sortable: true },
  { name: 'scheduledHours', label: 'Scheduled Hrs', field: 'scheduledHours', align: 'right', sortable: true },
  { name: 'scheduledAmount', label: 'Scheduled Cost', field: 'scheduledAmount', align: 'right', sortable: true },
  { name: 'workedHours', label: 'Actual Hrs', field: 'workedHours', align: 'right', sortable: true },
  { name: 'workedAmount', label: 'Actual Cost', field: 'workedAmount', align: 'right', sortable: true },
  { name: 'overtimeHours', label: 'OT Hrs', field: 'overtimeHours', align: 'right', sortable: true },
  { name: 'overtimeAmount', label: 'OT Cost', field: 'overtimeAmount', align: 'right', sortable: true },
  { name: 'tips', label: 'Tips', field: 'tips', align: 'right', sortable: true },
  { name: 'shares', label: 'Shares', field: 'shares', align: 'right', sortable: true },
  { name: 'specialAssignments', label: 'Special Assignments', field: 'specialAssignments', align: 'right', sortable: true },
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
  if (period.value === 'payroll_run') {
    return Boolean(selectedPayrollRunId.value);
  }
  return Boolean(startDate.value && endDate.value && startDate.value <= endDate.value);
});

const sortedRows = computed(() => {
  const rows = [...(report.value?.rows ?? [])];
  const keys = sortBy.value.length ? sortBy.value : (['department', 'name'] as ScheduledHoursCostSortKey[]);
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

function sortValue(row: ScheduledVsWorkedHoursRow, key: ScheduledHoursCostSortKey): string {
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
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
  reportsStore.clearScheduledVsWorkedHoursReport();
});

watch(scope, () => {
  reportsStore.clearScheduledVsWorkedHoursReport();
});

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

async function generateReport() {
  if (!canGenerate.value) {
    return;
  }

  await reportsStore.fetchScheduledVsWorkedHoursReport({
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
  exportScheduledVsWorkedHoursExcel(report.value, sortedRows.value);
  $q.notify({ type: 'positive', message: 'Scheduled hours cost vs actual exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportScheduledVsWorkedHoursPdf(report.value, sortedRows.value);
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
.scheduled-vs-worked-hours-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
