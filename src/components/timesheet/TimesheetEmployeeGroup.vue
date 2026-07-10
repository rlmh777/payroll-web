<template>
  <q-card flat bordered class="employee-group-card q-mb-md">
    <q-card-section class="employee-group-header row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-md">
        <div class="row items-center q-gutter-md">
          <q-avatar color="blue-1" text-color="primary" size="40px">
            {{ employeeInitials(group.employeeName) }}
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
        <div class="text-caption text-grey-7">Payable hours</div>
        <div class="text-h6 text-weight-bold text-primary">{{ formatHours(group.totalHours) }}</div>
        <div v-if="groupOvertimeHours > 0" class="text-caption text-deep-orange text-weight-medium q-mt-xs">
          {{ formatHours(groupOvertimeHours) }} OT
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-table
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
      <template #body-cell-date="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <div class="text-weight-medium">{{ formatDate(tableProps.row.date) }}</div>
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

      <template #body-cell-isPaid="tableProps">
        <q-td :props="tableProps" :class="timesheetRowClass(tableProps.row)">
          <q-toggle
            :model-value="tableProps.row.isPaid !== false"
            dense
            color="positive"
            :disable="isRowLocked(tableProps.row) || isSaving(tableProps.row.id)"
            @update:model-value="savePaidStatus(tableProps.row, $event)"
          />
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
              v-if="isPayDateLocked(tableProps.row)"
              dense
              square
              color="grey-3"
              text-color="grey-8"
              icon="lock"
              label="Locked"
            >
              <q-tooltip>{{ tableProps.row.lockReason || 'Locked after pay date' }}</q-tooltip>
            </q-chip>
            <q-chip
              v-else-if="tableProps.row.isDateUnlocked"
              dense
              square
              color="amber-1"
              text-color="amber-10"
              icon="lock_open"
              label="Unlocked"
            >
              <q-tooltip>{{ tableProps.row.lockReason || 'Unlocked via Payroll settings date range' }}</q-tooltip>
            </q-chip>
          </div>
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
          <q-btn
            v-if="tableProps.row.approvalStatus !== 'APPROVED'"
            dense
            flat
            color="positive"
            icon="check"
            label="Approve"
            :loading="isUpdatingApproval(tableProps.row.id)"
            :disable="isApprovalBusy(tableProps.row.id) || isPayDateLocked(tableProps.row)"
            @click="updateApproval(tableProps.row, 'APPROVED')"
          >
            <q-tooltip v-if="isPayDateLocked(tableProps.row)">
              {{ tableProps.row.lockReason || 'Locked after pay date. Unlock work dates under Payroll settings.' }}
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
            :disable="isApprovalBusy(tableProps.row.id) || isPayDateLocked(tableProps.row)"
            @click="updateApproval(tableProps.row, 'PENDING')"
          >
            <q-tooltip v-if="isPayDateLocked(tableProps.row)">
              {{ tableProps.row.lockReason || 'Locked after pay date. Unlock work dates under Payroll settings.' }}
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useAttendanceStore, type TimesheetRow } from 'src/stores/attendance-store';
import { useAttendanceSettingStore } from 'src/stores/attendance-setting-store';
import { useTimesheetStore } from 'src/stores/timesheet-store';
import type { TimesheetEmployeeGroup } from 'src/stores/timesheet-store';
import { TIMESHEET_TABLE_COLUMNS } from 'src/utils/timesheet-table-columns';
import { formatDate, formatDateTime, formatOvertimeForPayType, formatPayType, humanizeStatus, workingStatusColor } from '../attendance/utils';
import {
  buildRoundOffDateTimes,
  formatTimesheetClockTime,
  toTimeInputValue,
} from 'src/utils/timesheet-time-utils';

const props = defineProps<{
  group: TimesheetEmployeeGroup;
}>();

const groupOvertimeHours = computed(() =>
  props.group.rows.reduce((sum, row) => sum + Number(row.overtimeHours || 0), 0),
);

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const attendanceSettingStore = useAttendanceSettingStore();
const timesheetStore = useTimesheetStore();
const { visibleTableColumns } = storeToRefs(timesheetStore);
const { usesRoundedScheduleComparison } = storeToRefs(attendanceSettingStore);

const drafts = reactive<Record<string, { in: string; out: string }>>({});
const lunchDrafts = reactive<Record<string, number>>({});
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

function employeeInitials(name?: string | null) {
  if (!name) return '?';

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function approvalColor(value?: string | null) {
  const status = (value || '').toUpperCase();
  if (status === 'APPROVED') return 'positive';
  if (status === 'REJECTED') return 'negative';
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
  return Boolean(row.isLocked) || row.approvalStatus === 'APPROVED';
}

function isPayDateLocked(row: TimesheetRow) {
  return Boolean(row.isLocked);
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

async function savePaidStatus(row: TimesheetRow, isPaid: boolean) {
  if (isRowLocked(row)) {
    return;
  }

  const currentPaid = row.isPaid !== false;
  if (isPaid === currentPaid) {
    return;
  }

  savingIds.value[row.id] = true;

  const updated = await attendanceStore.updateTimesheetPaidStatus(row.id, { isPaid });

  savingIds.value[row.id] = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update paid status.',
    });
    return;
  }

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
    message: approvalStatus === 'APPROVED' ? 'Timesheet review completed.' : 'Timesheet moved back to pending review.',
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
