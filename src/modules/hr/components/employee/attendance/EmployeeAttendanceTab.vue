<template>
  <div class="employee-attendance-tab">
    <q-banner v-if="activeCompensation" rounded class="bg-blue-1 text-primary q-mb-md">
      <template #avatar>
        <q-icon :name="activeCompensation.requiresClocking ? 'fingerprint' : 'event_available'" />
      </template>
      <div class="text-weight-medium">
        {{ compensationMethodLabel(activeCompensation.compensationMethod) }}
        · {{ activeCompensation.requiresClocking ? 'Clocking required' : 'Clocking optional' }}
      </div>
      <div class="text-caption">
        <template v-if="activeCompensation.requiresClocking">
          Timesheet hours come from biometric punches. Processing runs automatically after import and on the nightly schedule.
        </template>
        <template v-else>
          Scheduled workdays are auto-filled from the employee schedule during automatic timesheet processing.
          Holidays and approved leave are excluded from regular work entries.
        </template>
      </div>
    </q-banner>

    <q-banner v-else rounded class="bg-orange-1 text-orange-10 q-mb-md">
      <template #avatar><q-icon name="warning" /></template>
      No active compensation record found. Add compensation before attendance can be processed.
    </q-banner>

    <div class="row items-center justify-between q-col-gutter-md q-mb-md">
      <div class="col-12 col-md row items-center q-gutter-sm">
        <q-btn outline label="Today" @click="goToday" />
        <q-btn flat round icon="chevron_left" @click="prevPeriod" />
        <q-btn flat round icon="chevron_right" @click="nextPeriod" />
        <div class="text-subtitle1 text-weight-medium">{{ periodLabel }}</div>
      </div>

      <div class="col-12 col-md-auto row items-center q-gutter-sm justify-end">
        <q-btn-toggle
          v-model="viewMode"
          no-caps
          dense
          unelevated
          toggle-color="primary"
          :options="[
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
            { label: 'Table', value: 'table' },
          ]"
        />
        <q-btn-dropdown color="primary" icon="add" label="Add">
          <q-list>
            <q-item v-close-popup clickable @click="openLeaveDialog()">
              <q-item-section avatar><q-icon name="beach_access" /></q-item-section>
              <q-item-section>
                <q-item-label>Leave</q-item-label>
                <q-item-label caption>Book vacation, sick, or other leave</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="openWorkDialog()">
              <q-item-section avatar><q-icon name="work" /></q-item-section>
              <q-item-section>
                <q-item-label>Work shift</q-item-label>
                <q-item-label caption>Schedule a one-off work assignment</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          outline
          color="primary"
          icon="calculate"
          label="Recalculate"
          :loading="isRecalculatingCompensation"
          @click="confirmRecalculateEmployee"
        />
        <q-btn flat round icon="refresh" :loading="isRefreshing" @click="refresh" />
      </div>
    </div>

    <q-inner-loading :showing="isRefreshing">
      <q-spinner color="primary" size="40px" />
    </q-inner-loading>

    <div v-if="viewMode === 'week'" class="week-grid q-mb-lg">
      <div
        v-for="cell in dayCells"
        :key="cell.date"
        class="week-day-card"
        :class="dayCardClasses(cell)"
        @click="selectDay(cell)"
      >
        <div class="week-day-card__header">
          <div>
            <div class="text-caption text-grey-7">{{ cell.weekdayLabel }}</div>
            <div class="text-subtitle2 text-weight-bold">{{ formatDayNumber(cell.date) }}</div>
          </div>
          <q-btn flat dense round icon="more_vert" size="sm" @click.stop="openDayMenu(cell)">
            <q-tooltip>Day actions</q-tooltip>
          </q-btn>
        </div>

        <div class="week-day-card__body q-gutter-xs">
          <template v-for="chip in dayChips(cell)" :key="chip.key">
            <q-chip dense square :color="chip.color" :text-color="chip.textColor" :icon="chip.icon" :label="chip.label" />
          </template>

          <template v-if="cell.hasTimesheet">
            <div
              v-for="row in cell.timesheetRows"
              :key="row.id"
              class="timesheet-pill"
              :class="{ 'timesheet-pill--auto': !row.clockInTime && !row.clockOutTime }"
            >
              <div class="text-caption text-weight-medium">
                {{ formatHours(row.hoursWorked) }}
                <span v-if="!row.clockInTime && !row.clockOutTime" class="text-grey-7"> · auto</span>
              </div>
              <div class="text-caption text-grey-7">
                {{ humanizeStatus(row.workingStatus) }}
                <span v-if="row.hasLeaveConflict"> · conflict</span>
              </div>
            </div>
          </template>

          <div
            v-else-if="!cell.isHoliday && !cell.isLeaveDay && !cell.isWeekend"
            class="text-caption text-grey-6 q-mt-sm"
          >
            No timesheet
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'month'" class="month-calendar q-mb-lg">
      <div class="month-weekday-row">
        <div v-for="weekday in weekdayHeaders" :key="weekday" class="month-weekday-cell text-caption text-grey-7">
          {{ weekday }}
        </div>
      </div>
      <div class="month-grid">
        <div
          v-for="cell in dayCells"
          :key="cell.date"
          class="month-day-card"
          :class="dayCardClasses(cell)"
          @click="selectDay(cell)"
        >
          <div class="month-day-card__header">
            <span class="month-day-card__number" :class="{ 'month-day-card__number--muted': cell.isOutsideMonth }">
              {{ formatDayNumber(cell.date) }}
            </span>
            <q-btn flat dense round icon="more_vert" size="xs" @click.stop="openDayMenu(cell)">
              <q-tooltip>Day actions</q-tooltip>
            </q-btn>
          </div>

          <div class="month-day-card__body">
            <div v-if="dayChips(cell).length" class="month-day-card__chips">
              <q-icon
                v-for="chip in dayChips(cell)"
                :key="chip.key"
                :name="chip.icon"
                size="14px"
                :color="chip.iconColor"
              >
                <q-tooltip>{{ chip.label }}</q-tooltip>
              </q-icon>
            </div>
            <div
              v-if="cell.hasTimesheet"
              class="text-caption text-weight-medium"
              :class="cell.isAutoFilled ? 'text-positive' : 'text-primary'"
            >
              {{ formatHours(cell.totalHours) }}h
            </div>
            <div v-else-if="cell.isLeaveDay" class="text-caption text-teal-8">Leave</div>
            <div v-else-if="cell.isHoliday" class="text-caption text-purple-8">Holiday</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <timesheet-employee-group
        v-if="timesheetGroup.rows.length"
        :group="timesheetGroup"
      />
      <div v-else class="empty-state text-center q-pa-xl">
        <q-icon name="event_note" size="48px" color="grey-5" />
        <div class="text-subtitle1 q-mt-md">No timesheet rows for this period</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Timesheets will appear after automatic processing runs.
        </div>
      </div>
    </div>

    <q-card v-if="selectedDayCell && viewMode !== 'table'" flat bordered class="q-mt-md">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">{{ formatFullDate(selectedDayCell.date) }}</div>
          <div class="text-caption text-grey-7">Day detail</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            v-if="!selectedDayCell.isLeaveDay"
            flat
            color="primary"
            icon="beach_access"
            label="Add leave"
            @click="openLeaveDialog(selectedDayCell.date)"
          />
          <q-btn
            flat
            color="primary"
            icon="work"
            label="Add work"
            @click="openWorkDialog(selectedDayCell.date)"
          />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-if="selectedDayCell.timesheetRows.length" class="q-gutter-sm">
          <div
            v-for="row in selectedDayCell.timesheetRows"
            :key="row.id"
            class="row items-center q-col-gutter-md"
          >
            <div class="col">
              <div class="text-body2">
                {{ formatTimesheetClockTime(row.clockInTime) }} – {{ formatTimesheetClockTime(row.clockOutTime) }}
              </div>
              <div class="text-caption text-grey-7">
                {{ humanizeStatus(row.workingStatus) }} · {{ formatHours(row.hoursWorked) }} payable
              </div>
            </div>
            <div class="col-auto">
              <q-chip
                dense
                outline
                :color="statusColor(row.approvalStatus)"
                :label="humanizeStatus(row.approvalStatus)"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-body2 text-grey-7">
          No timesheet record for this day.
          <span v-if="!activeCompensation?.requiresClocking && !selectedDayCell.isHoliday && !selectedDayCell.isLeaveDay">
            Scheduled workdays are filled automatically during nightly processing.
          </span>
        </div>
      </q-card-section>
    </q-card>

    <add-employee-leave v-model="leaveDialogOpen" @saved="onLeaveSaved" />

    <employee-attendance-work-dialog
      v-model="workDialogOpen"
      :employee-id="employeeId"
      :default-date="workDialogDate"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import TimesheetEmployeeGroup from '@hr/components/timesheet/TimesheetEmployeeGroup.vue';
import AddEmployeeLeave from '@hr/components/employee/leave/AddEmployeeLeave.vue';
import EmployeeAttendanceWorkDialog from './EmployeeAttendanceWorkDialog.vue';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useEmployeeCompensationStore } from 'src/stores/employee-compensation-store';
import { useEmployeeStore } from '@hr/stores/employee-store';
import {
  statusColor,
  formatDate,
  formatHours,
  humanizeStatus,
} from '@payroll/components/attendance/utils';
import { formatTimesheetClockTime } from '@hr/utils/timesheet-time-utils';
import {
  attendanceWeekdayHeaders,
  buildAttendanceDayCells,
  buildEmployeeTimesheetGroup,
  compensationMethodLabel,
  formatAttendancePeriodLabel,
  getAttendanceDateRange,
  type AttendanceDayCell,
  type AttendanceViewMode,
} from '@hr/utils/employee-attendance-utils';
import { getActiveEmploymentCompensation } from '@hr/utils/calendar-employment-utils';

const props = defineProps<{ employeeId: string }>();

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const calendarStore = useCalendarStore();
const compensationStore = useEmployeeCompensationStore();
const employeeStore = useEmployeeStore();

const { employeeTimesheetDetails, isRecalculatingCompensation } = storeToRefs(attendanceStore);

const anchorDate = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));
const viewMode = ref<AttendanceViewMode>('week');
const selectedDate = ref<string | null>(null);
const isRefreshing = ref(false);

const leaveDialogOpen = ref(false);
const workDialogOpen = ref(false);
const workDialogDate = ref<string | null>(null);

const weekdayHeaders = attendanceWeekdayHeaders();
const activeRange = computed(() => {
  if (viewMode.value === 'month') {
    return getAttendanceDateRange('month', anchorDate.value);
  }

  return getAttendanceDateRange('week', anchorDate.value);
});
const periodLabel = computed(() => {
  if (viewMode.value === 'table') {
    return formatAttendancePeriodLabel('week', anchorDate.value);
  }

  return formatAttendancePeriodLabel(viewMode.value, anchorDate.value);
});

const activeCompensation = computed(() => {
  const employee = employeeStore.selectedEmployee;
  if (!employee) {
    return null;
  }

  return getActiveEmploymentCompensation(
    {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      code: employee.code,
      employeeCompensations: compensationStore.records,
    },
    anchorDate.value,
  );
});

const dayCells = computed(() =>
  buildAttendanceDayCells(
    anchorDate.value,
    employeeTimesheetDetails.value,
    calendarStore.calendars,
    viewMode.value === 'table' ? 'week' : viewMode.value,
  ),
);

const selectedDayCell = computed(() =>
  dayCells.value.find((cell) => cell.date === selectedDate.value) ?? null,
);

const timesheetGroup = computed(() => {
  const employee = employeeStore.selectedEmployee;
  return buildEmployeeTimesheetGroup(
    props.employeeId,
    employee ? `${employee.firstName} ${employee.lastName}`.trim() : null,
    employee?.code ?? null,
    null,
    employeeTimesheetDetails.value,
  );
});

function formatDayNumber(day: string) {
  return date.formatDate(date.extractDate(day, 'YYYY-MM-DD'), 'D');
}

function formatFullDate(day: string) {
  return formatDate(day);
}

async function refresh() {
  isRefreshing.value = true;
  const range = activeRange.value;

  try {
    await Promise.all([
      compensationStore.fetchByEmployee(props.employeeId),
      attendanceStore.fetchEmployeeTimesheetDetails(props.employeeId, {
        startDate: range.start,
        endDate: range.end,
      }),
      calendarStore.fetchCalendars({
        start: range.start,
        end: range.end,
        employeeId: props.employeeId,
        scheduler: true,
        perPage: viewMode.value === 'month' ? 400 : 200,
      }),
    ]);
  } finally {
    isRefreshing.value = false;
  }
}

function confirmRecalculateEmployee() {
  $q.dialog({
    title: 'Recalculate employee compensation?',
    message:
      'This refreshes pay type, rates, regular hours, and overtime for this employee in the current view. Past payroll periods are not changed.',
    cancel: true,
    ok: {
      label: 'Recalculate',
      color: 'primary',
      icon: 'calculate',
    },
  }).onOk(() => {
    void recalculateEmployee();
  });
}

async function recalculateEmployee() {
  const range = activeRange.value;
  const result = await attendanceStore.recalculateCompensation({
    employeeIds: [props.employeeId],
    startDate: range.start,
    endDate: range.end,
  });

  if (!result) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to recalculate compensation.',
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: `Recalculated ${result.recalculatedTimesheets} timesheet${result.recalculatedTimesheets === 1 ? '' : 's'}.`,
  });
  await refresh();
}

function dayCardClasses(cell: AttendanceDayCell) {
  return {
    'week-day-card--weekend': cell.isWeekend,
    'week-day-card--holiday': cell.isHoliday,
    'week-day-card--leave': cell.isLeaveDay,
    'week-day-card--selected': selectedDate.value === cell.date,
    'month-day-card--outside': cell.isOutsideMonth,
    'month-day-card--weekend': cell.isWeekend,
    'month-day-card--holiday': cell.isHoliday,
    'month-day-card--leave': cell.isLeaveDay,
    'month-day-card--selected': selectedDate.value === cell.date,
  };
}

function dayChips(cell: AttendanceDayCell) {
  const chips: Array<{
    key: string;
    label: string;
    icon: string;
    color: string;
    textColor: string;
    iconColor: string;
  }> = [];

  if (cell.isHoliday) {
    chips.push({
      key: `holiday-${cell.date}`,
      label: cell.holiday?.description || 'Holiday',
      icon: 'celebration',
      color: 'purple-1',
      textColor: 'purple-10',
      iconColor: 'purple',
    });
  }

  for (const leave of cell.leaves) {
    chips.push({
      key: `leave-${leave.id}`,
      label: leave.leave_type_name || leave.description || 'Leave',
      icon: 'beach_access',
      color: 'teal-1',
      textColor: 'teal-10',
      iconColor: 'teal',
    });
  }

  for (const work of cell.scheduledWork) {
    chips.push({
      key: `work-${work.id}`,
      label: work.description || 'Work',
      icon: 'work',
      color: 'blue-1',
      textColor: 'primary',
      iconColor: 'primary',
    });
  }

  return chips;
}

function prevPeriod() {
  const step = viewMode.value === 'month' ? { month: -1 } : { days: -7 };
  anchorDate.value = date.formatDate(
    date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), step),
    'YYYY-MM-DD',
  );
}

function nextPeriod() {
  const step = viewMode.value === 'month' ? { month: 1 } : { days: 7 };
  anchorDate.value = date.formatDate(
    date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), step),
    'YYYY-MM-DD',
  );
}

function goToday() {
  anchorDate.value = date.formatDate(new Date(), 'YYYY-MM-DD');
}

function selectDay(cell: AttendanceDayCell) {
  selectedDate.value = cell.date;
}

function openDayMenu(cell: AttendanceDayCell) {
  selectedDate.value = cell.date;
  $q.dialog({
    title: formatFullDate(cell.date),
    message: 'What would you like to add for this day?',
    options: {
      type: 'radio',
      model: 'leave',
      items: [
        { label: 'Add leave', value: 'leave' },
        { label: 'Add work shift', value: 'work' },
      ],
    },
    cancel: true,
  }).onOk((choice: string) => {
    if (choice === 'leave') {
      openLeaveDialog(cell.date);
    } else if (choice === 'work') {
      openWorkDialog(cell.date);
    }
  });
}

function openLeaveDialog(day?: string) {
  if (day) {
    selectedDate.value = day;
  }
  leaveDialogOpen.value = true;
}

function openWorkDialog(day?: string) {
  workDialogDate.value = day ?? selectedDate.value ?? anchorDate.value;
  workDialogOpen.value = true;
}

async function onLeaveSaved() {
  leaveDialogOpen.value = false;
  await refresh();
}

watch(
  () => props.employeeId,
  async (employeeId) => {
    if (!employeeId) {
      return;
    }
    selectedDate.value = null;
    await refresh();
  },
  { immediate: true },
);

watch(anchorDate, () => {
  void refresh();
});

watch(viewMode, () => {
  selectedDate.value = null;
  void refresh();
});
</script>

<style scoped>
.employee-attendance-tab {
  min-height: 320px;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 1023px) {
  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .week-grid {
    grid-template-columns: 1fr;
  }
}

.week-day-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: #fff;
  min-height: 160px;
  padding: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.week-day-card:hover,
.week-day-card--selected {
  border-color: var(--q-primary);
  box-shadow: 0 4px 14px rgba(25, 118, 210, 0.12);
}

.week-day-card--weekend {
  background: #fafafa;
}

.week-day-card--holiday {
  background: #f3e5f5;
}

.week-day-card--leave {
  background: #e0f2f1;
}

.week-day-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timesheet-pill {
  border-radius: 8px;
  background: #e3f2fd;
  padding: 6px 8px;
}

.timesheet-pill--auto {
  background: #e8f5e9;
}

.empty-state {
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: #fafafa;
}

.month-calendar {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.month-weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: #f0f3f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.month-weekday-cell {
  padding: 8px 6px;
  text-align: center;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f7f9fc;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: rgba(0, 0, 0, 0.06);
}

.month-day-card {
  min-height: 92px;
  background: #fff;
  padding: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.month-day-card:hover,
.month-day-card--selected {
  background: #f2f7fe;
  box-shadow: inset 0 0 0 1px var(--q-primary);
}

.month-day-card--outside {
  background: #fafafa;
}

.month-day-card--outside .month-day-card__body {
  opacity: 0.55;
}

.month-day-card--weekend:not(.month-day-card--outside) {
  background: #fcfcfc;
}

.month-day-card--holiday:not(.month-day-card--outside) {
  background: #f8f1fb;
}

.month-day-card--leave:not(.month-day-card--outside) {
  background: #eef7f6;
}

.month-day-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.month-day-card__number {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.month-day-card__number--muted {
  color: #9e9e9e;
  font-weight: 500;
}

.month-day-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 44px;
}

.month-day-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@media (max-width: 1023px) {
  .month-day-card {
    min-height: 76px;
  }

  .month-day-card__chips {
    display: none;
  }
}

@media (max-width: 599px) {
  .month-weekday-cell {
    font-size: 10px;
    padding: 6px 2px;
  }

  .month-day-card {
    min-height: 58px;
    padding: 4px;
  }

  .month-day-card__body {
    min-height: 0;
  }
}
</style>
