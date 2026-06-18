<template>
  <q-dialog
    :model-value="props.modelValue"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @update:model-value="emit('update:modelValue', Boolean($event))"
  >
    <q-card class="employee-detail-dialog">
      <q-card-section class="detail-header">
        <div class="row items-start justify-between q-col-gutter-md">
          <div class="col-12 col-md">
            <div class="row items-center q-gutter-md">
              <q-avatar color="blue-1" text-color="primary" size="48px">
                {{ employeeInitials(props.summary?.employeeName) }}
              </q-avatar>
              <div>
                <div class="text-overline text-primary">Employee timesheet detail</div>
                <div class="text-h5 text-weight-bold">
                  {{ props.summary?.employeeName || 'Unknown employee' }}
                </div>
                <div class="text-body2 text-grey-7">
                  {{ props.summary?.employeeCode || props.summary?.employeeId }} ·
                  {{ props.summary?.departmentName || 'Unassigned department' }} ·
                  {{ formatPayType(props.summary?.payType) }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto row items-center q-gutter-sm">
            <q-chip outline color="primary" icon="date_range" :label="periodLabel" />
            <q-btn
              unelevated
              color="positive"
              icon="done_all"
              :label="`Approve ${cleanPendingRows.length} clean days`"
              :loading="props.isUpdatingApproval"
              :disable="cleanPendingRows.length === 0"
              @click="emit('approve-clean-pending', cleanPendingRows.map((row) => row.id))"
            />
            <q-btn flat round icon="close" aria-label="Close detail" @click="emit('update:modelValue', false)" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="detail-content">
        <div class="row q-col-gutter-md q-mb-md">
          <div v-for="item in metricCards" :key="item.label" class="col-6 col-md-4 col-xl-2">
            <q-card flat bordered class="metric-card">
              <q-card-section>
                <div class="text-caption text-grey-7">{{ item.label }}</div>
                <div class="text-h5 text-weight-bold" :class="item.className">{{ item.value }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <q-banner v-if="props.summary?.issueCount" rounded class="bg-orange-1 text-orange-10 q-mb-md">
          <template #avatar><q-icon name="warning_amber" /></template>
          <div class="text-weight-medium">
            {{ props.summary.issueCount }} day{{ props.summary.issueCount === 1 ? '' : 's' }} require review
          </div>
          <div class="text-caption">Resolve attendance exceptions before approving the employee period.</div>
        </q-banner>

        <q-card flat bordered class="detail-table-card">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Daily hour breakdown</div>
              <div class="text-caption text-grey-7">
                Verify punches and how each day contributes to regular and overtime hours.
              </div>
            </div>
            <q-chip outline color="grey-8" icon="event_note" :label="`${props.details.length} days`" />
          </q-card-section>
          <q-separator />

          <q-table
            class="detail-table"
            :rows="props.details"
            :columns="columns"
            row-key="id"
            flat
            hide-bottom
            separator="horizontal"
            :pagination="{ rowsPerPage: 0 }"
            :loading="props.isLoading"
          >
            <template #body-cell-date="tableProps">
              <q-td :props="tableProps">
                <div class="text-weight-medium">{{ formatDate(tableProps.row.date) }}</div>
                <div class="text-caption text-grey-6">{{ humanizeStatus(tableProps.row.workingStatus) }}</div>
              </q-td>
            </template>
            <template #body-cell-clockInTime="tableProps">
              <q-td :props="tableProps">
                <div>{{ formatTime(tableProps.row.clockInTime) }}</div>
                <div class="text-caption text-grey-6">
                  {{ tableProps.row.clockInDeviceId || tableProps.row.worksiteName || 'No site' }}
                </div>
              </q-td>
            </template>
            <template #body-cell-clockOutTime="tableProps">
              <q-td :props="tableProps">
                <div>{{ formatTime(tableProps.row.clockOutTime) }}</div>
                <div class="text-caption text-grey-6">
                  {{ tableProps.row.clockOutDeviceId || tableProps.row.worksiteName || 'No site' }}
                </div>
              </q-td>
            </template>
            <template #body-cell-hoursWorked="tableProps">
              <q-td :props="tableProps" class="text-weight-bold">{{ formatHours(tableProps.row.hoursWorked) }}</q-td>
            </template>
            <template #body-cell-regularHours="tableProps">
              <q-td :props="tableProps">{{ formatHours(tableProps.row.regularHours) }}</q-td>
            </template>
            <template #body-cell-overtimeHours="tableProps">
              <q-td :props="tableProps" :class="{ 'text-deep-orange text-weight-bold': tableProps.row.overtimeHours > 0 }">
                {{ formatHours(tableProps.row.overtimeHours) }}
              </q-td>
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
              </q-td>
            </template>
            <template #body-cell-issues="tableProps">
              <q-td :props="tableProps">
                <q-chip
                  v-if="tableProps.row.hasIssues"
                  dense
                  square
                  color="orange-1"
                  text-color="orange-10"
                  icon="warning_amber"
                  label="Review"
                >
                  <q-tooltip>{{ tableProps.row.remarks || 'Attendance issue' }}</q-tooltip>
                </q-chip>
                <q-icon v-else name="check_circle" color="positive" size="20px">
                  <q-tooltip>No attendance issues</q-tooltip>
                </q-icon>
              </q-td>
            </template>
            <template #body-cell-actions="tableProps">
              <q-td :props="tableProps">
                <div v-if="tableProps.row.approvalStatus === 'PENDING'" class="row no-wrap q-gutter-xs">
                  <q-btn
                    dense
                    flat
                    color="positive"
                    icon="check"
                    label="Approve"
                    :disable="props.isUpdatingApproval"
                    @click="emitApproval(tableProps.row, 'APPROVED')"
                  />
                  <q-btn
                    dense
                    flat
                    color="negative"
                    icon="close"
                    :disable="props.isUpdatingApproval"
                    @click="emitApproval(tableProps.row, 'REJECTED')"
                  >
                    <q-tooltip>Reject day</q-tooltip>
                  </q-btn>
                </div>
                <span v-else class="text-caption text-grey-6">Reviewed</span>
              </q-td>
            </template>
            <template #no-data>
              <div class="full-width column items-center text-grey-6 q-py-xl">
                <q-icon name="event_note" size="44px" class="q-mb-sm" />
                <div class="text-subtitle2">No daily timesheets found</div>
              </div>
            </template>
          </q-table>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetApprovalAction } from './types';
import {
  approvalIcon,
  formatDate,
  formatPayType,
  humanizeStatus,
  statusColor,
} from './utils';
import type { EmployeeTimesheetSummary, TimesheetRow } from 'src/stores/attendance-store';

const props = defineProps<{
  modelValue: boolean;
  summary: EmployeeTimesheetSummary | null;
  details: TimesheetRow[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
  isUpdatingApproval: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'request-approval', payload: { row: TimesheetRow; action: TimesheetApprovalAction }): void;
  (event: 'approve-clean-pending', timesheetIds: string[]): void;
}>();

const columns = [
  { name: 'date', label: 'Work date', field: 'date', align: 'left' as const },
  { name: 'clockInTime', label: 'Clock in / site', field: 'clockInTime', align: 'left' as const },
  { name: 'clockOutTime', label: 'Clock out / site', field: 'clockOutTime', align: 'left' as const },
  { name: 'hoursWorked', label: 'Total hrs', field: 'hoursWorked', align: 'right' as const },
  { name: 'regularHours', label: 'Regular hrs', field: 'regularHours', align: 'right' as const },
  { name: 'overtimeHours', label: 'OT hrs', field: 'overtimeHours', align: 'right' as const },
  { name: 'approvalStatus', label: 'Approval', field: 'approvalStatus', align: 'left' as const },
  { name: 'issues', label: 'Exceptions', field: 'remarks', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' as const },
];

const cleanPendingRows = computed(() =>
  props.details.filter((row) => row.approvalStatus === 'PENDING' && !row.hasIssues),
);

const periodLabel = computed(() => {
  const startDate = props.startDate || props.summary?.periodStart;
  const endDate = props.endDate || props.summary?.periodEnd;
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
});

const metricCards = computed(() => [
  { label: 'Total hours', value: formatHours(props.summary?.hoursWorked), className: 'text-primary' },
  { label: 'Regular hours', value: formatHours(props.summary?.regularHours), className: 'text-positive' },
  { label: 'Overtime hours', value: formatHours(props.summary?.overtimeHours), className: 'text-deep-orange' },
  { label: 'Holiday hours', value: formatHours(props.summary?.holidayHours), className: 'text-teal' },
  { label: 'Unpaid hours', value: formatHours(props.summary?.unpaidHours), className: 'text-negative' },
  { label: 'Work days', value: props.summary?.workDays ?? 0, className: '' },
]);

function formatHours(value?: number | null) {
  return Number(value || 0).toFixed(2);
}

function formatTime(value?: string | null) {
  if (!value) return 'Not supplied';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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

function emitApproval(row: TimesheetRow, action: TimesheetApprovalAction) {
  emit('request-approval', { row, action });
}
</script>

<style scoped>
.employee-detail-dialog {
  background: #f6f8fb;
}

.detail-header {
  background: #fff;
}

.detail-content {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

.metric-card,
.detail-table-card {
  border-radius: 12px;
  background: #fff;
}

.detail-table-card {
  overflow: hidden;
}

:deep(.detail-table .q-table__middle) {
  max-height: calc(100vh - 360px);
}

:deep(.detail-table thead tr) {
  background: #f7f9fc;
}

:deep(.detail-table th) {
  position: sticky;
  top: 0;
  z-index: 2;
  color: #52606d;
  background: #f7f9fc;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
