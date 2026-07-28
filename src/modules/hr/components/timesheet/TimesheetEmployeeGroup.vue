<template>
  <q-card flat bordered class="employee-group-card q-mb-md">
    <q-card-section class="employee-group-header row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center q-gutter-md">
          <q-avatar
            :style="{ backgroundColor: getUserAvatarColor(group.employeeName) }"
            text-color="white"
            size="40px"
            font-size="16px"
          >
            {{ getUserInitials(group.employeeName) }}
          </q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ group.employeeName || 'Unknown employee' }}</div>
            <div class="text-caption text-grey-7">
              {{ group.employeeCode || group.employeeId }}
              <span v-if="group.departmentName"> · {{ group.departmentName }}</span>
            </div>
            <div class="text-caption text-grey-7">
              {{ group.employmentContractLabel || 'Unassigned contract' }}
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-auto text-right">
        <div class="row items-center justify-end q-gutter-sm">
          <q-btn
            v-if="canCreateTimesheet"
            dense
            outline
            color="primary"
            icon="add"
            label="Add record"
            @click="showAddDialog = true"
          />
          <div>
            <div class="text-caption text-grey-7">Payable hours</div>
            <div class="text-h6 text-weight-bold text-primary">{{ formatHours(group.totalHours) }}</div>
            <div v-if="groupOvertimeHours > 0" class="text-caption text-deep-orange text-weight-medium q-mt-xs">
              {{ formatHours(groupOvertimeHours) }} OT
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <div
      v-if="group.rows.length === 0"
      class="full-width row flex-center q-gutter-sm text-grey-7 q-py-md"
    >
      <q-icon name="event_busy" size="20px" />
      <span>No timesheet records for this period.</span>
      <q-btn
        v-if="canCreateTimesheet"
        flat
        dense
        color="primary"
        label="Add record"
        @click="showAddDialog = true"
      />
    </div>

    <q-table
      v-else
      class="employee-group-table"
      :rows="group.rows"
      :columns="columns"
      :visible-columns="visibleTableColumns"
      row-key="id"
      flat
      hide-bottom
      :pagination="{ rowsPerPage: 0 }"
      :row-class="timesheetRowClass"
    >
      <template #no-data>
        <div class="full-width row flex-center q-gutter-sm text-grey-7 q-py-lg">
          <q-icon name="event_busy" size="24px" />
          <span>No timesheet records for this period.</span>
        </div>
      </template>

      <template #body-cell-date="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div class="row items-center no-wrap q-gutter-xs">
            <q-icon
              v-if="isDateLocked(tableProps.row)"
              name="lock"
              size="16px"
              color="grey-8"
            >
              <q-tooltip>{{ lockTooltip(tableProps.row) }}</q-tooltip>
            </q-icon>
            <div class="text-weight-medium">{{ formatDate(tableProps.row.date) }}</div>
          </div>
          <q-tooltip
            v-if="rowTooltipText(tableProps.row)"
            anchor="top middle"
            self="bottom middle"
            class="bg-grey-9 text-body2"
            style="max-width: 320px; white-space: pre-line"
          >
            {{ rowTooltipText(tableProps.row) }}
          </q-tooltip>
        </q-td>
      </template>

      <template #body-cell-workingStatus="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-chip
            dense
            square
            outline
            :color="workingStatusColor(tableProps.row.workingStatus)"
            :label="humanizeStatus(tableProps.row.workingStatus)"
          />
        </q-td>
      </template>

      <template #body-cell-clockInTime="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div :class="{ 'timesheet-clock-time-outside': shouldHighlightClockTimes(tableProps.row) }">
            {{ formatTimesheetClockTime(tableProps.row.clockInTime) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-clockOutTime="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div :class="{ 'timesheet-clock-time-outside': shouldHighlightClockTimes(tableProps.row) }">
            {{ formatTimesheetClockTime(tableProps.row.clockOutTime) }}
          </div>
        </q-td>
      </template>

      <template #body-cell-clockInDeviceId="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ tableProps.row.clockInDeviceId || '—' }}</q-td>
      </template>

      <template #body-cell-clockOutDeviceId="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ tableProps.row.clockOutDeviceId || '—' }}</q-td>
      </template>

      <template #body-cell-roundOffClockInTime="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-input
            :model-value="draftValue(tableProps.row.id, 'in', tableProps.row)"
            type="time"
            dense
            outlined
            :class="{ 'timesheet-round-off-outside': shouldHighlightRoundedTimes(tableProps.row) }"
            :disable="isRowLocked(tableProps.row) || isSaving(tableProps.row.id)"
            @update:model-value="setDraft(tableProps.row.id, 'in', String($event ?? ''))"
            @blur="saveRoundOff(tableProps.row)"
          />
        </q-td>
      </template>

      <template #body-cell-roundOffClockOutTime="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-input
            :model-value="draftValue(tableProps.row.id, 'out', tableProps.row)"
            type="time"
            dense
            outlined
            :class="{ 'timesheet-round-off-outside': shouldHighlightRoundedTimes(tableProps.row) }"
            :disable="isRowLocked(tableProps.row) || isSaving(tableProps.row.id)"
            @update:model-value="setDraft(tableProps.row.id, 'out', String($event ?? ''))"
            @blur="saveRoundOff(tableProps.row)"
          />
        </q-td>
      </template>

      <template #body-cell-lunchHourHours="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-input
            :model-value="lunchDraftValue(tableProps.row)"
            type="number"
            step="0.25"
            min="0"
            max="8"
            dense
            outlined
            hide-bottom-space
            :disable="isRowLocked(tableProps.row) || isSaving(tableProps.row.id)"
            @update:model-value="setLunchDraft(tableProps.row.id, $event)"
            @blur="saveLunchHours(tableProps.row)"
          />
        </q-td>
      </template>

      <template #body-cell-hoursWorked="tableProps">
        <q-td :props="tableProps" :class="[timesheetRowClass(tableProps.row), 'text-weight-bold']">{{ formatHours(tableProps.row.hoursWorked) }}</q-td>
      </template>

      <template #body-cell-clockedHoursWorked="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatHours(tableProps.row.clockedHoursWorked) }}</q-td>
      </template>

      <template #body-cell-regularHours="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatHours(tableProps.row.regularHours) }}</q-td>
      </template>

      <template #body-cell-overtimeHours="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatOvertimeForPayType(tableProps.row.payType, tableProps.row.overtimeHours) }}</q-td>
      </template>

      <template #body-cell-holidayHours="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatHours(tableProps.row.holidayHours) }}</q-td>
      </template>

      <template #body-cell-unpaidHours="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatHours(tableProps.row.unpaidHours) }}</q-td>
      </template>

      <template #body-cell-hasBeenPaid="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-chip
            dense
            square
            outline
            :color="tableProps.row.hasBeenPaid ? 'positive' : 'grey-7'"
            :icon="tableProps.row.hasBeenPaid ? 'payments' : 'money_off'"
            :label="tableProps.row.hasBeenPaid ? 'Paid' : 'Not paid'"
          >
            <q-tooltip>
              {{
                tableProps.row.hasBeenPaid
                  ? `Included in a posted payroll run${tableProps.row.payrollPayment?.payDate ? ` (pay date ${tableProps.row.payrollPayment.payDate})` : ''}. Hours are marked paid.`
                  : 'Not included in a posted payroll run yet.'
              }}
            </q-tooltip>
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-paidHours="tableProps">
        <q-td
          :props="tableProps"
          :class="[timesheetRowClass(tableProps.row), tableProps.row.isPaid === false ? 'text-grey-6' : 'text-positive text-weight-medium']"
        >
          {{ formatHours(tableProps.row.paidHours) }}
        </q-td>
      </template>

      <template #body-cell-departmentName="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ tableProps.row.departmentName || 'Unassigned' }}</q-td>
      </template>

      <template #body-cell-worksiteName="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ tableProps.row.worksiteName || '—' }}</q-td>
      </template>

      <template #body-cell-payType="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatPayType(tableProps.row.payType) }}</q-td>
      </template>

      <template #body-cell-hourlyRate="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatMoney(tableProps.row.hourlyRate) }}</q-td>
      </template>

      <template #body-cell-approvalStatus="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div class="row items-center q-gutter-xs">
            <q-chip
              dense
              square
              outline
              :color="approvalColor(tableProps.row.approvalStatus)"
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
          <q-tooltip
            v-if="rowTooltipText(tableProps.row)"
            anchor="top middle"
            self="bottom middle"
            class="bg-grey-9 text-body2"
            style="max-width: 320px; white-space: pre-line"
          >
            {{ rowTooltipText(tableProps.row) }}
          </q-tooltip>
        </q-td>
      </template>

      <template #body-cell-comment="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-input
            :model-value="commentDraftValue(tableProps.row)"
            type="text"
            dense
            outlined
            hide-bottom-space
            placeholder="Add comment"
            :disable="isRowLocked(tableProps.row) || isSaving(tableProps.row.id)"
            @update:model-value="setCommentDraft(tableProps.row.id, $event)"
            @blur="saveComment(tableProps.row)"
          >
            <template v-if="commentDraftValue(tableProps.row)" #prepend>
              <q-icon name="chat_bubble_outline" size="18px" color="grey-7" />
            </template>
          </q-input>
          <q-tooltip
            v-if="rowTooltipText(tableProps.row)"
            anchor="top middle"
            self="bottom middle"
            class="bg-grey-9 text-body2"
            style="max-width: 320px; white-space: pre-line"
          >
            {{ rowTooltipText(tableProps.row) }}
          </q-tooltip>
        </q-td>
      </template>

      <template #body-cell-approvedByName="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ tableProps.row.approvedByName || '—' }}</q-td>
      </template>

      <template #body-cell-approvedAt="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">{{ formatDateTime(tableProps.row.approvedAt) }}</q-td>
      </template>

      <template #body-cell-actions="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div class="row items-center no-wrap q-gutter-xs justify-end">
            <q-btn
              v-if="canEditTimesheet(tableProps.row)"
              dense
              flat
              color="primary"
              icon="edit"
              label="Edit"
              :disable="isSaving(tableProps.row.id)"
              @click="openEditDialog(tableProps.row)"
            />
            <q-btn
              v-if="tableProps.row.approvalStatus !== 'APPROVED'"
              dense
              flat
              color="positive"
              icon="check"
              label="Approve"
              :loading="isUpdatingApproval(tableProps.row.id)"
              :disable="isApprovalBusy(tableProps.row.id) || isDateLocked(tableProps.row)"
              @click="updateApproval(tableProps.row, 'APPROVED')"
            >
              <q-tooltip v-if="isDateLocked(tableProps.row)">
                {{ lockTooltip(tableProps.row) }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-else
              dense
              flat
              color="grey-8"
              icon="undo"
              label="Mark pending"
              :loading="isUpdatingApproval(tableProps.row.id)"
              :disable="isApprovalBusy(tableProps.row.id) || isDateLocked(tableProps.row)"
              @click="updateApproval(tableProps.row, 'PENDING')"
            >
              <q-tooltip v-if="isDateLocked(tableProps.row)">
                {{ lockTooltip(tableProps.row) }}
              </q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <AddTimesheetDialog
      v-model="showAddDialog"
      :group="group"
    />

    <EditTimesheetDialog
      v-model="showEditDialog"
      :group="group"
      :timesheet="editingTimesheet"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useAttendanceStore, type TimesheetRow } from '@payroll/stores/attendance-store';
import { useAttendanceSettingStore } from 'src/stores/attendance-setting-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import type { TimesheetEmployeeGroup } from '@hr/stores/timesheet-store';
import AddTimesheetDialog from './AddTimesheetDialog.vue';
import EditTimesheetDialog from './EditTimesheetDialog.vue';
import { TIMESHEET_TABLE_COLUMNS } from '@hr/utils/timesheet-table-columns';
import {
  formatDate,
  formatDateTime,
  formatOvertimeForPayType,
  formatPayType,
  humanizeStatus,
  workingStatusColor,
} from '@payroll/components/attendance/utils';
import { getUserAvatarColor, getUserInitials } from '@core/components/users/user-avatar';
import {
  buildRoundOffDateTimes,
  formatTimesheetClockTime,
  toTimeInputValue,
} from '@hr/utils/timesheet-time-utils';

const props = defineProps<{
  group: TimesheetEmployeeGroup;
}>();

const groupOvertimeHours = computed(() =>
  props.group.rows.reduce((sum, row) => sum + Number(row.overtimeHours || 0), 0),
);

const $q = useQuasar();
const { can } = usePermissions();
const attendanceStore = useAttendanceStore();
const attendanceSettingStore = useAttendanceSettingStore();
const timesheetStore = useTimesheetStore();
const { visibleTableColumns } = storeToRefs(timesheetStore);
const { usesRoundedScheduleComparison } = storeToRefs(attendanceSettingStore);

const canCreateTimesheet = computed(() => can('timesheets-crud'));
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const editingTimesheet = ref<TimesheetRow | null>(null);

const drafts = reactive<Record<string, { in: string; out: string }>>({});
const lunchDrafts = reactive<Record<string, number>>({});
const commentDrafts = reactive<Record<string, string>>({});
const savingIds = ref<Record<string, boolean>>({});
const updatingApprovalIds = ref<Record<string, boolean>>({});

const columns = TIMESHEET_TABLE_COLUMNS;

function formatHours(value?: number | null) {
  return Number(value || 0).toFixed(2);
}

function formatMoney(value?: number | null) {
  if (value == null) {
    return '—';
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function rowTooltipText(row: TimesheetRow): string {
  const lines: string[] = [];
  const comment = (row.comment || '').trim();
  if (comment) {
    lines.push(`Comment: ${comment}`);
  }

  if (row.updatedByName || row.updatedAt) {
    const who = row.updatedByName || 'Unknown user';
    const when = row.updatedAt ? formatDateTime(row.updatedAt) : 'unknown time';
    lines.push(`Last updated by ${who} on ${when}`);
  }

  return lines.join('\n');
}

function commentDraftValue(row: TimesheetRow): string {
  if (commentDrafts[row.id] !== undefined) {
    return commentDrafts[row.id] ?? '';
  }
  return row.comment || '';
}

function setCommentDraft(id: string, value: string | number | null) {
  commentDrafts[id] = String(value ?? '');
}

async function saveComment(row: TimesheetRow) {
  if (isRowLocked(row)) {
    return;
  }

  const nextComment = commentDraftValue(row).trim();
  const currentComment = (row.comment || '').trim();
  if (nextComment === currentComment) {
    return;
  }

  savingIds.value[row.id] = true;
  const updated = await attendanceStore.updateTimesheetComment(row.id, {
    comment: nextComment || null,
  });
  savingIds.value[row.id] = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update comment.',
    });
    commentDrafts[row.id] = currentComment;
    return;
  }

  commentDrafts[row.id] = updated.comment || '';
  Object.assign(row, updated);
}

function approvalColor(value?: string | null) {
  const status = (value || '').toUpperCase();
  if (status === 'APPROVED') return 'positive';
  if (status === 'REJECTED') return 'negative';
  if (status === 'PENDING_SUPERVISOR') return 'warning';
  return 'grey-7';
}

function timesheetRowClass(row: TimesheetRow) {
  return row.isOutsideSchedule ? 'timesheet-row-outside-schedule' : '';
}

function shouldHighlightRoundedTimes(row: TimesheetRow) {
  return Boolean(row.isOutsideSchedule && usesRoundedScheduleComparison.value);
}

function shouldHighlightClockTimes(row: TimesheetRow) {
  return Boolean(row.isOutsideSchedule && !usesRoundedScheduleComparison.value);
}

function isRowLocked(row: TimesheetRow) {
  return isDateLocked(row) || String(row.approvalStatus || '').toUpperCase() === 'APPROVED';
}

function isDateLocked(row: TimesheetRow) {
  return Boolean(row.isLocked);
}

function lockTooltip(row: TimesheetRow) {
  return row.lockReason
    || (row.lockBeforeDate
      ? `Locked because work date is before ${row.lockBeforeDate}. Change the lock date under Payroll.`
      : 'This timesheet is locked and cannot be edited.');
}

function canEditTimesheet(row: TimesheetRow) {
  return canCreateTimesheet.value && !isRowLocked(row);
}

function openEditDialog(row: TimesheetRow) {
  editingTimesheet.value = row;
  showEditDialog.value = true;
}

function isSaving(id: string) {
  return Boolean(savingIds.value[id]);
}

function isUpdatingApproval(id: string) {
  return Boolean(updatingApprovalIds.value[id]);
}

function isApprovalBusy(id: string) {
  return isUpdatingApproval(id) || attendanceStore.isUpdatingApproval;
}

function ensureDraft(row: TimesheetRow) {
  if (!drafts[row.id]) {
    drafts[row.id] = {
      in: toTimeInputValue(row.roundOffClockInTime),
      out: toTimeInputValue(row.roundOffClockOutTime),
    };
  }
}

function draftValue(id: string, field: 'in' | 'out', row: TimesheetRow) {
  ensureDraft(row);
  return drafts[id]?.[field] ?? '';
}

function setDraft(id: string, field: 'in' | 'out', value: string) {
  if (!drafts[id]) {
    drafts[id] = { in: '', out: '' };
  }
  drafts[id][field] = value;
}

function lunchDraftValue(row: TimesheetRow): number {
  if (lunchDrafts[row.id] !== undefined) {
    return lunchDrafts[row.id] ?? 0;
  }

  return Number(row.lunchHourHours ?? 0);
}

function setLunchDraft(id: string, value: string | number | null) {
  const parsed = Number(value);
  lunchDrafts[id] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function saveLunchHours(row: TimesheetRow) {
  if (isRowLocked(row)) {
    return;
  }

  const nextHours = lunchDraftValue(row);
  const currentHours = Number(row.lunchHourHours ?? 0);

  if (nextHours === currentHours) {
    return;
  }

  savingIds.value[row.id] = true;

  const updated = await attendanceStore.updateTimesheetLunchHours(row.id, {
    lunchHourHours: nextHours,
  });

  savingIds.value[row.id] = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update lunch hours.',
    });
    lunchDrafts[row.id] = currentHours;
    return;
  }

  lunchDrafts[row.id] = Number(updated.lunchHourHours ?? 0);
  Object.assign(row, updated);
}

async function saveRoundOff(row: TimesheetRow) {
  if (isRowLocked(row)) {
    return;
  }

  ensureDraft(row);
  const draft = drafts[row.id];
  if (!draft) {
    return;
  }

  const { roundOffClockInTime: nextIn, roundOffClockOutTime: nextOut } = buildRoundOffDateTimes(
    row.date,
    draft.in,
    draft.out,
  );
  const currentIn = row.roundOffClockInTime;
  const currentOut = row.roundOffClockOutTime;

  if (nextIn === currentIn && nextOut === currentOut) {
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

async function updateApproval(row: TimesheetRow, approvalStatus: 'APPROVED' | 'PENDING') {
  updatingApprovalIds.value[row.id] = true;

  const updated = await attendanceStore.updateTimesheetApproval(row.id, { approvalStatus });

  updatingApprovalIds.value[row.id] = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update timesheet approval.',
    });
    return;
  }

  Object.assign(row, updated);
  $q.notify({
    type: 'positive',
    message: updated.approvalStatus === 'APPROVED'
      ? 'Timesheet review completed.'
      : updated.approvalStatus === 'PENDING' && approvalStatus === 'APPROVED'
        ? 'Timesheet forwarded for department head approval.'
        : 'Timesheet moved back to pending review.',
  });
}

onMounted(() => {
  if (!attendanceSettingStore.settings) {
    void attendanceSettingStore.fetchSettings();
  }
});
</script>

<style scoped>
.employee-group-card {
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.employee-group-header {
  background: #fafbfd;
}

.employee-group-table :deep(tr.timesheet-row-outside-schedule > td),
.employee-group-table :deep(td.timesheet-row-outside-schedule) {
  background-color: #ffebee !important;
}

.employee-group-table :deep(td.timesheet-row-outside-schedule .q-field--outlined .q-field__control) {
  background: #fff5f5;
}

.timesheet-clock-time-outside {
  color: #c62828;
  font-weight: 600;
}

.employee-group-table :deep(.timesheet-round-off-outside .q-field__control) {
  border-color: #ef9a9a;
  background: #fff5f5;
}

.employee-group-table :deep(.timesheet-round-off-outside .q-field__native) {
  color: #c62828;
  font-weight: 600;
}
</style>
