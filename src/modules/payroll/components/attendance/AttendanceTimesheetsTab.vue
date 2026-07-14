<template>
  <q-card flat bordered class="review-queue q-mb-md">
    <q-card-section class="row items-center q-col-gutter-md">
      <div class="col-12 col-lg">
        <div class="text-overline text-primary">Accountant review queue</div>
        <div class="text-h6 text-weight-bold">Review hours by employee, then drill into daily detail</div>
        <div class="text-body2 text-grey-7">
          Start with each employee’s total hours for the period. Open details to verify punches, resolve exceptions,
          and approve individual workdays.
        </div>
      </div>
      <div class="col-12 col-sm-4 col-lg-auto">
        <div class="queue-stat queue-stat--warning">
          <div class="text-h6 text-weight-bold">{{ props.summary.issueCount }}</div>
          <div class="text-caption">Exceptions</div>
        </div>
      </div>
      <div class="col-12 col-sm-4 col-lg-auto">
        <div class="queue-stat queue-stat--pending">
          <div class="text-h6 text-weight-bold">{{ props.summary.pendingCount }}</div>
          <div class="text-caption">Pending days</div>
        </div>
      </div>
      <div class="col-12 col-sm-4 col-lg-auto">
        <div class="queue-stat queue-stat--positive">
          <div class="text-h6 text-weight-bold">{{ props.summary.approvedCount }}</div>
          <div class="text-caption">Approved days</div>
        </div>
      </div>
      <div v-if="props.summary.issueCount" class="col-12 col-lg-auto">
        <q-btn
          outline
          color="warning"
          icon="warning_amber"
          label="Review exceptions"
          @click="emit('review-issues')"
        />
      </div>
    </q-card-section>
  </q-card>

  <attendance-filter-panel
    class="q-mb-md"
    title="Timesheet filters"
    description="Review employee totals by period, approval state, working status, or pay type."
    :active-filter-count="activeFilterCount"
  >
    <div class="col-12 col-sm-6 col-lg-3">
      <q-select
        :model-value="props.filter.payPeriodScheduleId"
        outlined
        dense
        clearable
        emit-value
        map-options
        label="Pay period"
        :loading="props.isLoadingPayPeriods"
        :options="payPeriodOptions"
        @update:model-value="updateFilter('payPeriodScheduleId', ($event as string | null) ?? null)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <DateField
        :model-value="props.filter.startDate || null"
        label="Start date"
        stack-label
        :disable="Boolean(props.filter.payPeriodScheduleId)"
        @update:model-value="updateFilter('startDate', $event ?? '')"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <DateField
        :model-value="props.filter.endDate || null"
        label="End date"
        stack-label
        :disable="Boolean(props.filter.payPeriodScheduleId)"
        @update:model-value="updateFilter('endDate', $event ?? '')"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <q-select
        :model-value="props.filter.approvalStatus"
        outlined
        dense
        clearable
        emit-value
        map-options
        label="Approval status"
        :options="approvalOptions"
        @update:model-value="updateFilter('approvalStatus', ($event as string | null) ?? null)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <q-select
        :model-value="props.filter.workingStatus"
        outlined
        dense
        clearable
        emit-value
        map-options
        label="Working status"
        :options="workingStatusOptions"
        @update:model-value="updateFilter('workingStatus', ($event as string | null) ?? null)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <q-select
        :model-value="props.filter.payType"
        outlined
        dense
        clearable
        emit-value
        map-options
        label="Pay type"
        :options="payTypeOptions"
        @update:model-value="updateFilter('payType', ($event as string | null) ?? null)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2 row items-center">
      <q-toggle
        :model-value="props.filter.issuesOnly"
        color="warning"
        label="Show issues only"
        @update:model-value="updateFilter('issuesOnly', Boolean($event))"
      />
    </div>

    <template #actions>
      <q-btn flat color="grey-8" icon="restart_alt" label="Reset" @click="emit('reset-filter')" />
      <q-btn unelevated color="primary" icon="search" label="Apply filters" @click="emit('apply-filter')" />
    </template>
  </attendance-filter-panel>

  <div class="row q-col-gutter-md q-mb-md">
    <div v-for="item in summaryCards" :key="item.label" class="col-6 col-md-4 col-xl-2">
      <attendance-metric-card v-bind="item" />
    </div>
  </div>

  <q-card flat bordered class="attendance-data-card">
    <q-card-section class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-sm">
        <div class="text-subtitle1 text-weight-bold">Employee period summaries</div>
        <div class="text-caption text-grey-7">
          Select an employee to see how total hours are built from each workday.
        </div>
      </div>
      <q-chip outline color="primary" icon="groups" :label="`${props.pagination.rowsNumber} assignments`" />
    </q-card-section>

    <q-separator />

    <q-table
      class="attendance-table"
      :rows="props.employeeSummaries"
      :columns="columns"
      :row-key="summaryRowKey"
      flat
      hide-bottom
      separator="horizontal"
      :pagination="{ rowsPerPage: 0 }"
      :loading="props.isLoadingTimesheets"
      @row-click="(_, row) => emit('view-details', row)"
    >
      <template #body-cell-employeeName="tableProps">
        <q-td :props="tableProps" class="employee-cell">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar color="blue-1" text-color="primary" size="36px">
              {{ employeeInitials(tableProps.row.employeeName) }}
            </q-avatar>
            <div>
              <div class="text-weight-bold">{{ tableProps.row.employeeName || 'Unknown employee' }}</div>
              <div class="text-caption text-grey-7">{{ tableProps.row.employeeCode || tableProps.row.employeeId }}</div>
            </div>
          </div>
        </q-td>
      </template>
      <template #body-cell-departmentName="tableProps">
        <q-td :props="tableProps">{{ tableProps.row.departmentName || 'Unassigned' }}</q-td>
      </template>
      <template #body-cell-employmentContractLabel="tableProps">
        <q-td :props="tableProps">{{ tableProps.row.employmentContractLabel || 'Unassigned contract' }}</q-td>
      </template>
      <template #body-cell-hoursWorked="tableProps">
        <q-td :props="tableProps">
          <div class="text-h6 text-weight-bold text-primary">{{ formatHours(tableProps.row.hoursWorked) }}</div>
          <div class="text-caption text-grey-6">{{ tableProps.row.workDays }} work days</div>
        </q-td>
      </template>
      <template #body-cell-regularHours="tableProps">
        <q-td :props="tableProps" class="text-weight-medium">{{ formatHours(tableProps.row.regularHours) }}</q-td>
      </template>
      <template #body-cell-overtimeHours="tableProps">
        <q-td :props="tableProps" :class="{ 'text-deep-orange text-weight-bold': tableProps.row.overtimeHours > 0 }">
          {{ formatOvertimeForPayType(tableProps.row.payType, tableProps.row.overtimeHours) }}
        </q-td>
      </template>
      <template #body-cell-holidayHours="tableProps">
        <q-td :props="tableProps">{{ formatHours(tableProps.row.holidayHours) }}</q-td>
      </template>
      <template #body-cell-unpaidHours="tableProps">
        <q-td :props="tableProps" :class="{ 'text-negative text-weight-medium': tableProps.row.unpaidHours > 0 }">
          {{ formatHours(tableProps.row.unpaidHours) }}
        </q-td>
      </template>
      <template #body-cell-payType="tableProps">
        <q-td :props="tableProps">{{ formatPayType(tableProps.row.payType) }}</q-td>
      </template>
      <template #body-cell-approvalStatus="tableProps">
        <q-td :props="tableProps">
          <q-chip
            dense
            square
            outline
            :color="statusColor(tableProps.row.approvalStatus)"
            :icon="approvalIcon(tableProps.row.approvalStatus)"
            :label="humanizeStatus(tableProps.row.approvalStatus)"
          />
          <div class="text-caption text-grey-6">
            {{ tableProps.row.approvedCount }} of {{ tableProps.row.workDays }} days approved
          </div>
        </q-td>
      </template>
      <template #body-cell-issueCount="tableProps">
        <q-td :props="tableProps">
          <q-chip
            v-if="tableProps.row.issueCount"
            dense
            square
            color="orange-1"
            text-color="orange-10"
            icon="warning_amber"
            :label="`${tableProps.row.issueCount} exceptions`"
          />
          <q-icon v-else name="check_circle" color="positive" size="20px">
            <q-tooltip>No attendance exceptions</q-tooltip>
          </q-icon>
        </q-td>
      </template>
      <template #body-cell-actions="tableProps">
        <q-td :props="tableProps">
          <q-btn
            outline
            color="primary"
            icon-right="chevron_right"
            label="View details"
            @click.stop="emit('view-details', tableProps.row)"
          />
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width column items-center text-grey-6 q-py-xl">
          <q-icon name="groups" size="44px" class="q-mb-sm" />
          <div class="text-subtitle2">No employee timesheets found</div>
          <div class="text-caption">Adjust the filters or wait for automatic timesheet processing to complete.</div>
        </div>
      </template>
    </q-table>

    <q-separator />

    <div class="row items-center justify-between q-pa-md">
      <div class="text-caption text-grey-7">
        Page {{ props.pagination.page }} of {{ props.lastPage }} · {{ props.pagination.rowsNumber }} employees
      </div>
      <div class="row q-gutter-xs">
        <q-btn
          outline
          color="grey-8"
          icon="chevron_left"
          label="Previous"
          :disable="props.pagination.page <= 1 || props.isLoadingTimesheets"
          @click="emit('load-page', props.pagination.page - 1)"
        />
        <q-btn
          outline
          color="grey-8"
          icon-right="chevron_right"
          label="Next"
          :disable="props.pagination.page >= props.lastPage || props.isLoadingTimesheets"
          @click="emit('load-page', props.pagination.page + 1)"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import AttendanceFilterPanel from './AttendanceFilterPanel.vue';
import AttendanceMetricCard from './AttendanceMetricCard.vue';
import type { TimesheetFilterForm } from './types';
import { approvalIcon, formatDate, formatOvertimeForPayType, formatPayType, humanizeStatus, statusColor } from './utils';
import type {
  EmployeeTimesheetSummary,
  PaginationState,
  PayPeriodSchedule,
  TimesheetSummary,
} from '@payroll/stores/attendance-store';

const props = defineProps<{
  filter: TimesheetFilterForm;
  payPeriods: PayPeriodSchedule[];
  employeeSummaries: EmployeeTimesheetSummary[];
  summary: TimesheetSummary;
  isLoadingTimesheets: boolean;
  isLoadingPayPeriods: boolean;
  pagination: PaginationState;
  lastPage: number;
}>();

const emit = defineEmits<{
  (event: 'update:filter', value: TimesheetFilterForm): void;
  (event: 'apply-filter'): void;
  (event: 'reset-filter'): void;
  (event: 'load-page', page: number): void;
  (event: 'review-issues'): void;
  (event: 'view-details', summary: EmployeeTimesheetSummary): void;
}>();

const approvalOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const workingStatusOptions = [
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Overtime', value: 'OVERTIME' },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Holiday', value: 'HOLIDAY' },
];

const payTypeOptions = [
  { label: 'Hourly (no OT)', value: 'HOURLY_NO_OT' },
  { label: 'Hourly (OT)', value: 'HOURLY_OT' },
  { label: 'Base rate (no OT)', value: 'BASE_NO_OT' },
  { label: 'Base rate (OT)', value: 'BASE_OT' },
];

const columns = [
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' as const },
  { name: 'employmentContractLabel', label: 'Contract', field: 'employmentContractLabel', align: 'left' as const },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' as const },
  { name: 'hoursWorked', label: 'Total hours', field: 'hoursWorked', align: 'right' as const },
  { name: 'regularHours', label: 'Regular', field: 'regularHours', align: 'right' as const },
  { name: 'overtimeHours', label: 'Overtime', field: 'overtimeHours', align: 'right' as const },
  { name: 'holidayHours', label: 'Holiday', field: 'holidayHours', align: 'right' as const },
  { name: 'paidHours', label: 'Paid', field: 'paidHours', align: 'right' as const },
  { name: 'unpaidHours', label: 'Unpaid', field: 'unpaidHours', align: 'right' as const },
  { name: 'payType', label: 'Pay type', field: 'payType', align: 'left' as const },
  { name: 'approvalStatus', label: 'Approval progress', field: 'approvalStatus', align: 'left' as const },
  { name: 'issueCount', label: 'Exceptions', field: 'issueCount', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

function summaryRowKey(row: EmployeeTimesheetSummary): string {
  return `${row.employeeId}:${row.employmentDetailId ?? 'none'}`;
}

const payPeriodOptions = computed(() =>
  props.payPeriods.map((period) => ({
    value: period.id,
    label: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`,
  })),
);

const activeFilterCount = computed(
  () =>
    [
      props.filter.payPeriodScheduleId,
      props.filter.startDate,
      props.filter.endDate,
      props.filter.approvalStatus,
      props.filter.workingStatus,
      props.filter.payType,
      props.filter.issuesOnly ? 'issues' : '',
    ].filter(Boolean).length,
);

const summaryCards = computed(() => [
  { label: 'Employees', value: props.summary.employeeCount, icon: 'groups', tone: 'primary' as const },
  { label: 'Total hours', value: formatHours(props.summary.hoursWorked), icon: 'timer', tone: 'primary' as const },
  { label: 'Regular hours', value: formatHours(props.summary.regularHours), icon: 'schedule', tone: 'positive' as const },
  {
    label: 'Overtime hours',
    value: formatHours(props.summary.overtimeHours),
    icon: 'more_time',
    tone: 'warning' as const,
  },
  { label: 'Holiday hours', value: formatHours(props.summary.holidayHours), icon: 'beach_access', tone: 'teal' as const },
  { label: 'Paid hours', value: formatHours(props.summary.paidHours), icon: 'payments', tone: 'positive' as const },
  { label: 'Unpaid hours', value: formatHours(props.summary.unpaidHours), icon: 'money_off', tone: 'negative' as const },
]);

function formatHours(value: number) {
  return Number(value || 0).toFixed(2);
}

function employeeInitials(name?: string | null) {
  if (!name) return '?';

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function updateFilter(field: keyof TimesheetFilterForm, value: TimesheetFilterForm[keyof TimesheetFilterForm]) {
  emit('update:filter', { ...props.filter, [field]: value });
}
</script>

<style scoped>
.attendance-data-card,
.review-queue {
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
}

.review-queue {
  border-color: #cbd9eb;
  background: linear-gradient(135deg, #fff 0%, #f5f9ff 100%);
}

.queue-stat {
  min-width: 118px;
  padding: 10px 14px;
  border-radius: 10px;
  color: #435466;
  background: #edf2f7;
}

.queue-stat--warning {
  color: #8a4b00;
  background: #fff3d6;
}

.queue-stat--pending {
  color: #854d0e;
  background: #fef9c3;
}

.queue-stat--positive {
  color: #166534;
  background: #e8f7ed;
}

:deep(.attendance-table .q-table__middle) {
  max-height: calc(100vh - 410px);
}

:deep(.attendance-table thead tr) {
  background: #f7f9fc;
}

:deep(.attendance-table th) {
  position: sticky;
  top: 0;
  z-index: 2;
  color: #52606d;
  background: #f7f9fc;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

:deep(.attendance-table tbody tr) {
  cursor: pointer;
}

:deep(.attendance-table tbody tr:hover) {
  background: #f4f8ff;
}

:deep(.employee-cell) {
  min-width: 220px;
}
</style>
