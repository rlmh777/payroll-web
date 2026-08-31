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
                <div class="text-body2 text-grey-7">
                  {{ props.summary?.employmentContractLabel || 'Unassigned contract' }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto row items-center q-gutter-sm">
            <q-chip outline color="primary" icon="date_range" :label="periodLabel" />
            <q-btn
              outline
              color="primary"
              icon="calculate"
              label="Recalculate employee"
              :loading="props.isRecalculatingCompensation"
              @click="emit('recalculate-compensation')"
            />
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
                <q-tooltip
                  v-if="rowTooltipText(tableProps.row)"
                  class="bg-grey-9 text-body2"
                  style="max-width: 320px; white-space: pre-line"
                >
                  {{ rowTooltipText(tableProps.row) }}
                </q-tooltip>
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
            <template #body-cell-roundOffClockInTime="tableProps">
              <q-td :props="tableProps">
                <q-input
                  v-if="!isRowLocked(tableProps.row)"
                  :model-value="draftValue(tableProps.row.id, 'in', tableProps.row)"
                  type="time"
                  dense
                  outlined
                  :disable="isSaving(tableProps.row.id)"
                  @update:model-value="setDraft(tableProps.row.id, 'in', String($event ?? ''))"
                  @blur="saveRoundOff(tableProps.row)"
                />
                <span v-else>{{ formatTime(tableProps.row.roundOffClockInTime) }}</span>
              </q-td>
            </template>
            <template #body-cell-roundOffClockOutTime="tableProps">
              <q-td :props="tableProps">
                <q-input
                  v-if="!isRowLocked(tableProps.row)"
                  :model-value="draftValue(tableProps.row.id, 'out', tableProps.row)"
                  type="time"
                  dense
                  outlined
                  :disable="isSaving(tableProps.row.id)"
                  @update:model-value="setDraft(tableProps.row.id, 'out', String($event ?? ''))"
                  @blur="saveRoundOff(tableProps.row)"
                />
                <span v-else>{{ formatTime(tableProps.row.roundOffClockOutTime) }}</span>
              </q-td>
            </template>
            <template #body-cell-scheduledHours="tableProps">
              <q-td :props="tableProps">{{ formatHours(tableProps.row.scheduledHours) }}</q-td>
            </template>
            <template #body-cell-rawClockedHours="tableProps">
              <q-td :props="tableProps">{{ formatHours(rawClockedHoursForRow(tableProps.row)) }}</q-td>
            </template>
            <template #body-cell-clockedHoursWorked="tableProps">
              <q-td :props="tableProps">{{ formatHours(tableProps.row.clockedHoursWorked) }}</q-td>
            </template>
            <template #body-cell-hoursWorked="tableProps">
              <q-td :props="tableProps" class="text-weight-bold">{{ formatHours(tableProps.row.hoursWorked) }}</q-td>
            </template>
            <template #body-cell-regularHours="tableProps">
              <q-td :props="tableProps">{{ formatHours(tableProps.row.regularHours) }}</q-td>
            </template>
            <template #body-cell-overtimeHours="tableProps">
              <q-td :props="tableProps" :class="{ 'text-deep-orange text-weight-bold': tableProps.row.overtimeHours > 0 }">
                {{ formatOvertimeForPayType(tableProps.row.payType, tableProps.row.overtimeHours) }}
              </q-td>
            </template>
            <template #body-cell-employmentContractLabel="tableProps">
              <q-td :props="tableProps">
                <div>{{ tableProps.row.employmentContractLabel || 'Unassigned contract' }}</div>
                <div class="text-caption text-grey-6">{{ tableProps.row.compensationLabel || 'No compensation snapshot' }}</div>
              </q-td>
            </template>
            <template #body-cell-approvalStatus="tableProps">
              <q-td :props="tableProps">
                <div class="row items-center q-gutter-xs">
                  <q-chip
                    dense
                    square
                    outline
                    :color="statusColor(tableProps.row.approvalStatus)"
                    :icon="approvalIcon(tableProps.row.approvalStatus)"
                    :label="humanizeStatus(tableProps.row.approvalStatus)"
                  />
                  <q-chip
                    v-if="isDateLocked(tableProps.row)"
                    dense
                    square
                    color="grey-3"
                    text-color="grey-8"
                    icon="lock"
                    label="Locked"
                  >
                    <q-tooltip>{{ lockTooltip(tableProps.row) }}</q-tooltip>
                  </q-chip>
                </div>
              </q-td>
            </template>
            <template #body-cell-issues="tableProps">
              <q-td :props="tableProps">
                <div class="column q-gutter-xs">
                  <TimesheetExceptionsCell :row="tableProps.row" />
                  <q-btn
                    v-if="canAuthorizeLeaveWork(tableProps.row)"
                    dense
                    flat
                    no-caps
                    color="primary"
                    icon="work_history"
                    label="Authorize work"
                    :loading="props.isUpdatingApproval"
                    @click="authorizeWorkOnLeave(tableProps.row)"
                  />
                </div>
              </q-td>
            </template>
            <template #body-cell-actions="tableProps">
              <q-td :props="tableProps">
                <div v-if="isPendingApprovalStatus(tableProps.row.approvalStatus)" class="row no-wrap q-gutter-xs">
                  <q-btn
                    dense
                    flat
                    color="positive"
                    icon="check"
                    label="Approve"
                    :disable="props.isUpdatingApproval || tableProps.row.hasLeaveConflict || isDateLocked(tableProps.row) || timesheetHasBlockingExceptions(tableProps.row)"
                    @click="emitApproval(tableProps.row, 'APPROVED')"
                  >
                    <q-tooltip v-if="isDateLocked(tableProps.row)">
                      {{ lockTooltip(tableProps.row) }}
                    </q-tooltip>
                    <q-tooltip v-else-if="tableProps.row.hasLeaveConflict">
                      Resolve the leave conflict before approving.
                    </q-tooltip>
                    <q-tooltip v-else-if="timesheetHasBlockingExceptions(tableProps.row)">
                      Resolve attendance exceptions before approving.
                    </q-tooltip>
                  </q-btn>
                  <q-btn
                    dense
                    flat
                    color="negative"
                    icon="close"
                    :disable="props.isUpdatingApproval || isDateLocked(tableProps.row)"
                    @click="emitApproval(tableProps.row, 'REJECTED')"
                  >
                    <q-tooltip v-if="isDateLocked(tableProps.row)">
                      {{ lockTooltip(tableProps.row) }}
                    </q-tooltip>
                    <q-tooltip v-else>Reject day</q-tooltip>
                  </q-btn>
                </div>
                <div v-else-if="isDateLocked(tableProps.row)" class="text-caption text-grey-6">
                  Locked
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
            <template #bottom-row>
              <q-tr v-if="props.details.length > 0" class="detail-table__totals-row">
                <q-td colspan="7" class="text-weight-bold">Period total</q-td>
                <q-td class="text-right text-weight-bold">{{ formatHours(detailTotals.scheduledHours) }}</q-td>
                <q-td class="text-right text-weight-bold">{{ formatHours(detailTotals.rawClockedHours) }}</q-td>
                <q-td class="text-right text-weight-bold">{{ formatHours(detailTotals.roundedHours) }}</q-td>
                <q-td class="text-right text-weight-bold text-primary">{{ formatHours(detailTotals.payableHours) }}</q-td>
                <q-td class="text-right text-weight-bold">{{ formatHours(detailTotals.regularHours) }}</q-td>
                <q-td class="text-right text-weight-bold">{{ formatHours(detailTotals.overtimeHours) }}</q-td>
                <q-td colspan="5" />
              </q-tr>
            </template>
          </q-table>
        </q-card>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { TimesheetApprovalAction } from './types';
import {
  approvalIcon,
  formatDate,
  formatOvertimeForPayType,
  formatPayType,
  humanizeStatus,
  statusColor,
  timesheetLastUpdatedTooltip,
} from './utils';
import { useAttendanceStore, type EmployeeTimesheetSummary, type TimesheetRow } from '@payroll/stores/attendance-store';
import {
  buildRoundOffDateTimes,
  rawClockedHoursForRow,
  sumTimesheetPeriodTotals,
  toTimeInputValue,
} from '@hr/utils/timesheet-time-utils';
import TimesheetExceptionsCell from '@hr/components/timesheet/TimesheetExceptionsCell.vue';
import {
  isPendingApprovalStatus,
  timesheetHasBlockingExceptions,
} from '@hr/utils/timesheet-exception-utils';

const props = defineProps<{
  modelValue: boolean;
  summary: EmployeeTimesheetSummary | null;
  details: TimesheetRow[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
  isUpdatingApproval: boolean;
  isRecalculatingCompensation: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'request-approval', payload: { row: TimesheetRow; action: TimesheetApprovalAction }): void;
  (event: 'approve-clean-pending', timesheetIds: string[]): void;
  (event: 'recalculate-compensation'): void;
}>();

const $q = useQuasar();
const attendanceStore = useAttendanceStore();

function rowTooltipText(row: TimesheetRow): string {
  const lines: string[] = [];
  const comment = (row.comment || '').trim();
  if (comment) {
    lines.push(`Comment: ${comment}`);
  }

  const updateLine = timesheetLastUpdatedTooltip(row);
  if (updateLine) {
    lines.push(updateLine);
  }

  return lines.join('\n');
}

const drafts = reactive<Record<string, { in: string; out: string }>>({});
const savingIds = ref<Record<string, boolean>>({});

watch(
  () => props.details,
  (details) => {
    for (const row of details) {
      drafts[row.id] = {
        in: toTimeInputValue(row.roundOffClockInTime),
        out: toTimeInputValue(row.roundOffClockOutTime),
      };
    }
  },
  { immediate: true, deep: true },
);

const columns = [
  { name: 'date', label: 'Work date', field: 'date', align: 'left' as const },
  { name: 'clockInTime', label: 'Clock in / site', field: 'clockInTime', align: 'left' as const },
  { name: 'clockOutTime', label: 'Clock out / site', field: 'clockOutTime', align: 'left' as const },
  { name: 'roundOffClockInTime', label: 'Rounded in', field: 'roundOffClockInTime', align: 'left' as const },
  { name: 'roundOffClockOutTime', label: 'Rounded out', field: 'roundOffClockOutTime', align: 'left' as const },
  { name: 'scheduledHours', label: 'Scheduled hrs', field: 'scheduledHours', align: 'right' as const },
  { name: 'rawClockedHours', label: 'Clocked hrs', field: 'rawClockedHours', align: 'right' as const },
  { name: 'clockedHoursWorked', label: 'Rounded hrs', field: 'clockedHoursWorked', align: 'right' as const },
  { name: 'hoursWorked', label: 'Payable hrs', field: 'hoursWorked', align: 'right' as const },
  { name: 'regularHours', label: 'Regular hrs', field: 'regularHours', align: 'right' as const },
  { name: 'overtimeHours', label: 'OT hrs', field: 'overtimeHours', align: 'right' as const },
  { name: 'employmentContractLabel', label: 'Contract / compensation', field: 'employmentContractLabel', align: 'left' as const },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' as const },
  { name: 'approvalStatus', label: 'Approval', field: 'approvalStatus', align: 'left' as const },
  { name: 'issues', label: 'Exceptions', field: 'remarks', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' as const },
];

const cleanPendingRows = computed(() =>
  props.details.filter(
    (row) => isPendingApprovalStatus(row.approvalStatus) && !timesheetHasBlockingExceptions(row) && !row.hasLeaveConflict,
  ),
);

const periodLabel = computed(() => {
  const startDate = props.startDate || props.summary?.periodStart;
  const endDate = props.endDate || props.summary?.periodEnd;
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
});

const detailTotals = computed(() => sumTimesheetPeriodTotals(props.details));

const metricCards = computed(() => [
  { label: 'Scheduled hours', value: formatHours(detailTotals.value.scheduledHours), className: 'text-indigo' },
  { label: 'Clocked hours', value: formatHours(detailTotals.value.rawClockedHours), className: 'text-blue-grey' },
  { label: 'Rounded hours', value: formatHours(detailTotals.value.roundedHours), className: 'text-cyan-8' },
  { label: 'Payable hours', value: formatHours(detailTotals.value.payableHours), className: 'text-primary' },
  { label: 'Regular hours', value: formatHours(props.summary?.regularHours), className: 'text-positive' },
  { label: 'Overtime hours', value: formatHours(props.summary?.overtimeHours), className: 'text-deep-orange' },
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

function canAuthorizeLeaveWork(row: TimesheetRow) {
  return row.approvalStatus === 'PENDING' && Boolean(row.hasLeaveConflict) && !isDateLocked(row);
}

function authorizeWorkOnLeave(row: TimesheetRow) {
  $q.dialog({
    title: 'Authorize work on leave',
    message:
      'This will cancel the conflicting approved leave and recalculate payable hours for this day. Add a note for the audit trail.',
    prompt: {
      model: '',
      type: 'textarea',
      label: 'Resolution note',
      isValid: (value: string) => value.trim().length >= 3,
    },
    cancel: true,
  }).onOk((note: string) => {
    void submitLeaveAuthorization(row, note.trim());
  });
}

async function submitLeaveAuthorization(row: TimesheetRow, note: string) {
  const updated = await attendanceStore.resolveTimesheetLeaveConflict(row.id, note);

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to authorize work on leave.',
    });
    return;
  }

  drafts[row.id] = {
    in: toTimeInputValue(updated.roundOffClockInTime),
    out: toTimeInputValue(updated.roundOffClockOutTime),
  };

  $q.notify({
    type: 'positive',
    message: 'Leave cancelled and timesheet hours recalculated.',
  });
}

function isRowLocked(row: TimesheetRow) {
  return isDateLocked(row) || row.approvalStatus === 'APPROVED';
}

function isDateLocked(row: TimesheetRow) {
  return Boolean(row.isLocked);
}

function lockTooltip(row: TimesheetRow) {
  return row.lockReason
    || (row.lockBeforeDate
      ? `Locked because work date is before ${row.lockBeforeDate}. Open a temporary unlock under Payroll Overview if needed.`
      : 'This timesheet is locked and cannot be edited.');
}

function isSaving(id: string) {
  return Boolean(savingIds.value[id]);
}

function draftValue(id: string, field: 'in' | 'out', row: TimesheetRow) {
  if (!drafts[id]) {
    drafts[id] = {
      in: toTimeInputValue(row.roundOffClockInTime),
      out: toTimeInputValue(row.roundOffClockOutTime),
    };
  }

  return drafts[id][field];
}

function setDraft(id: string, field: 'in' | 'out', value: string) {
  if (!drafts[id]) {
    drafts[id] = { in: '', out: '' };
  }
  drafts[id][field] = value;
}

async function saveRoundOff(row: TimesheetRow) {
  if (isRowLocked(row)) {
    return;
  }

  const draft = drafts[row.id] ?? {
    in: toTimeInputValue(row.roundOffClockInTime),
    out: toTimeInputValue(row.roundOffClockOutTime),
  };

  const { roundOffClockInTime: nextIn, roundOffClockOutTime: nextOut } = buildRoundOffDateTimes(
    row.date,
    draft.in,
    draft.out,
  );

  if (nextIn === row.roundOffClockInTime && nextOut === row.roundOffClockOutTime) {
    return;
  }

  if ((draft.in && !draft.out) || (!draft.in && draft.out)) {
    $q.notify({ type: 'warning', message: 'Both rounded clock-in and clock-out are required.' });
    return;
  }

  savingIds.value[row.id] = true;

  const updated = await attendanceStore.updateTimesheetRoundOff(row.id, {
    roundOffClockInTime: nextIn,
    roundOffClockOutTime: nextOut,
  });

  savingIds.value[row.id] = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update round-off times.',
    });
    return;
  }

  drafts[row.id] = {
    in: toTimeInputValue(updated.roundOffClockInTime),
    out: toTimeInputValue(updated.roundOffClockOutTime),
  };
  Object.assign(row, updated);
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

:deep(.detail-table__totals-row) {
  background: #eef3fb;
}

:deep(.detail-table__totals-row td) {
  border-top: 2px solid #cbd5e1;
}
</style>
