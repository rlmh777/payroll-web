<template>
  <div class="scheduler-shell">
    <section class="scheduler-main">
      <div class="scheduler-topbar-host">
        <SchedulerTopbar
          v-model:view-mode="viewMode"
          :header-label="headerLabel"
          :can-add-notice="canEditNotices"
          :can-import-shifts="canImportShifts"
          @prev="prevPeriod"
          @next="nextPeriod"
          @today="goToday"
          @add-notice="openCreateNotice"
          @import-shifts="showImportDialog = true"
        />
      </div>

      <div class="scheduler-surface">
        <q-inner-loading :showing="showInitialLoading">
          <q-spinner color="primary" size="40px" />
          <div class="scheduler-loading-label">{{ schedulerLoadingLabel }}</div>
        </q-inner-loading>

        <div
          v-if="isRefreshing"
          class="scheduler-refresh-banner row items-center justify-center q-gutter-sm"
        >
          <q-spinner color="primary" size="18px" />
          <span>{{ schedulerLoadingLabel }}</span>
        </div>

        <div
          v-if="importPreviewCount > 0"
          class="scheduler-import-preview-banner row items-center justify-between q-gutter-sm"
        >
          <span>
            Previewing {{ importPreviewCount }} imported shift{{ importPreviewCount === 1 ? '' : 's' }}
            (dashed). Apply from the import panel to save.
          </span>
          <q-btn flat dense color="primary" label="Clear preview" @click="clearImportPreview" />
        </div>

        <SchedulerGrid
          class="scheduler-grid-host"
          :rows="gridRows"
          :visible-days="visibleDays"
          :events="displayWorkEvents"
          :employees-by-id="employeesById"
          :view-by="viewBy"
          :loading="showInitialLoading"
          :loading-shifts="isLoadingCalendars"
          :loading-more="isLoadingMoreEmployees"
          :has-more="canLoadMoreEmployees"
          :empty-message="gridEmptyMessage"
          :load-more="handleLoadMoreEmployees"
          :timesheets-by-employee-id="timesheetsByEmployeeId"
          :departments-by-id="departmentsById"
          :accrued-hours-by-employee-id="accruedHoursByEmployeeId"
          :metric-definitions="metricStore.activeDefinitions"
          :metric-values-by-date="metricStore.valuesByDate"
          :can-edit-metrics="canEditMetrics"
          :holiday-names-by-date="holidayNamesByDate"
          :notices="noticeStore.notices"
          :can-edit-notices="canEditNotices"
          :can-schedule-shifts="canImportShifts"
          @select-shift="handleSelectShift"
          @create-shift="handleCreateShift"
          @assign-shift-template="handleAssignShiftTemplate"
          @create-shift-template="openCreateShiftTemplate"
          @manage-shift-templates="showManageShiftTemplates = true"
          @edit-day-metrics="handleEditDayMetrics"
          @edit-notice="openEditNotice"
        />
      </div>
    </section>

    <CalendarCreateDialog
      v-model="showCreateDialog"
      :start-date="createRange.start"
      :end-date="createRange.end"
      :general-group-id="generalGroupId"
      :default-employee-id="createEmployeeId"
      :employees="schedulerEmployees"
      :show-employee-picker="canViewEmployees"
      :leave-events="leaveEvents"
      work-only
      @saved="handleCreateSaved"
      @close="clearCreateSelection"
    />

    <CalendarEventDialog
      v-model="showEventDialog"
      :event="selectedEvent"
      :type-labels="typeLabels"
      :employees="schedulerEmployees"
      :show-employee-picker="canViewEmployees"
      :leave-events="leaveEvents"
      @saved="fetchShifts"
    />

    <ShiftTemplateManageDialog v-model="showManageShiftTemplates" />

    <ShiftTemplateEditDialog
      v-model="showShiftTemplateEditDialog"
      :record="null"
      @saved="onShiftTemplateSaved"
    />

    <SchedulerDailyMetricDialog
      v-model="showMetricsDialog"
      :day="metricsEditDay"
      :definitions="metricStore.activeDefinitions"
      :values="metricsDialogValues"
    />

    <SchedulerNoticeDialog
      v-model="showNoticeDialog"
      :record="editingNotice"
      :default-start-date="noticeDefaultStart"
      :default-end-date="noticeDefaultEnd"
      :department-options="noticeDepartmentOptions"
      :employee-options="noticeEmployeeOptions"
      @saved="fetchSchedulerNotices"
    />

    <SchedulerShiftImportDialog
      v-model="showImportDialog"
      :employees="schedulerEmployees"
      :preview-import="previewShiftImport"
      :confirm-import-rows="confirmShiftImport"
      :is-working="isImportWorking"
      @previewed="handleImportPreviewed"
      @imported="handleImportApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useDepartmentStore } from '@hr/stores/department-store';
import { useEmployeeGroupStore } from '@hr/stores/employee-group-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { usePublicHolidayStore } from '@hr/stores/public-holiday-store';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { useEmployeePoolStore } from '@payroll/stores/employee-pool-store';
import SchedulerTopbar from './SchedulerTopbar.vue';
import SchedulerGrid from './SchedulerGrid.vue';
import CalendarEventDialog from './CalendarEventDialog.vue';
import CalendarCreateDialog from './CalendarCreateDialog.vue';
import SchedulerDailyMetricDialog from './SchedulerDailyMetricDialog.vue';
import SchedulerNoticeDialog from './SchedulerNoticeDialog.vue';
import SchedulerShiftImportDialog from './SchedulerShiftImportDialog.vue';
import ShiftTemplateManageDialog from './ShiftTemplateManageDialog.vue';
import ShiftTemplateEditDialog from './ShiftTemplateEditDialog.vue';
import type { CalendarType } from './calendarTypes';
import type { CalendarEntry } from '@hr/stores/calendar-store';
import { useSchedulerMetricStore } from '@hr/stores/scheduler-metric-store';
import {
  useSchedulerNoticeStore,
  type SchedulerNotice,
} from '@hr/stores/scheduler-notice-store';
import {
  shiftTemplateDisplayLabel,
  useShiftTemplateStore,
  type ShiftTemplate,
} from '@hr/stores/shift-template-store';
import {
  clipDateRangeToFuture,
  enumerateDateRange,
  scheduledWorkRecordToEvents,
} from '@hr/utils/calendar-event-utils';
import { getActiveEmploymentDetail } from '@hr/utils/calendar-employment-utils';
import { prepareSchedulerEmployees } from '@hr/utils/scheduler-bootstrap';
import {
  canEditSchedulerDailyMetrics,
  canEditSchedulerNotices,
  canImportSchedulerShifts,
  canManageSchedulerEmployees,
  canViewAllSchedulerEmployees,
} from '@hr/utils/scheduler-access';
import type { SchedulerShiftImportPreview } from '@hr/utils/scheduler-shift-import';import {
  buildDepartmentGroupedGridRows,
  buildEmployeeGroupGridRows,
  buildEmployeeGridRows,
  employeeDisplayName,
  filterEmployeesByName,
  formatSchedulerPeriodLabel,
  getDateRangeForView,
  getVisibleDays,
  scheduledEmployeeIds,
  type SchedulerGridRow,
  type SchedulerViewMode,
} from '@hr/utils/scheduler-utils';

const $q = useQuasar();
const schedulerStore = useSchedulerStore();
const calendarStore = useCalendarStore();
const departmentStore = useDepartmentStore();
const employeeGroupStore = useEmployeeGroupStore();
const attendanceStore = useAttendanceStore();
const employeePoolStore = useEmployeePoolStore();
const metricStore = useSchedulerMetricStore();
const noticeStore = useSchedulerNoticeStore();
const shiftTemplateStore = useShiftTemplateStore();
const publicHolidayStore = usePublicHolidayStore();
const holidayNamesByDate = ref<Record<string, string>>({});
const {
  calendars,
  error,
  calendarGroups,
  currentEmployee,
  isLoadingCalendars,
} = storeToRefs(calendarStore);
const {
  employees: schedulerStoreEmployees,
  isLoadingEmployees,
  hasLoadedEmployees,
  employeesHasMore,
  employeesError,
} = storeToRefs(schedulerStore);

const isLoadingMoreEmployees = computed(
  () => isLoadingEmployees.value && schedulerStoreEmployees.value.length > 0,
);

const canLoadMoreEmployees = computed(
  () => schedulerStore.employeesMode === 'paginated' && employeesHasMore.value,
);

const canViewEmployees = computed(() => canManageSchedulerEmployees());
const canEditMetrics = computed(() => canEditSchedulerDailyMetrics());
const canEditNotices = computed(() => canEditSchedulerNotices());
const canImportShifts = computed(() => canImportSchedulerShifts());
const isImportWorking = ref(false);
const showImportDialog = ref(false);
const importPreviewEvents = ref<CalendarEntry[]>([]);

const importPreviewCount = computed(() => {
  const ids = new Set(
    importPreviewEvents.value
      .map((event) => event.scheduled_work_id)
      .filter((id): id is string => Boolean(id)),
  );
  return ids.size;
});

const isBootstrapping = ref(false);

const isEmployeesLoading = computed(
  () =>
    isBootstrapping.value
    || (canViewEmployees.value && !hasLoadedEmployees.value)
    || (isLoadingEmployees.value && schedulerStoreEmployees.value.length === 0),
);

const schedulerLoadingLabel = computed(() => {
  if (isEmployeesLoading.value || (isLoadingEmployees.value && schedulerStoreEmployees.value.length === 0)) {
    return 'Loading employees…';
  }
  if (isLoadingCalendars.value) {
    return 'Loading schedule…';
  }
  return 'Loading…';
});

const selectedDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'));
const viewMode = ref<SchedulerViewMode>('week');

const viewBy = computed(() => schedulerStore.viewBy);
const filterDepartmentId = computed(() => schedulerStore.filterDepartmentId);
const filterEmployeeGroupId = computed(() => schedulerStore.filterEmployeeGroupId);
const filterEmployeeId = computed(() => schedulerStore.filterEmployeeId);
const hideUnscheduledUsers = computed(() => schedulerStore.hideUnscheduledUsers);

const sortBy = computed(() => schedulerStore.sortBy);

const departmentNameById = computed(
  () => new Map(departmentStore.departments.map((department) => [department.id, department.name])),
);

const departmentsById = computed(() => {
  const map: Record<number, (typeof departmentStore.departments)[number]> = {};
  for (const department of departmentStore.departments) {
    map[department.id] = department;
  }
  return map;
});

const timesheetsByEmployeeId = computed(() => {
  const map: Record<string, typeof attendanceStore.timesheets> = {};

  for (const row of attendanceStore.timesheets) {
    if (!map[row.employeeId]) {
      map[row.employeeId] = [];
    }
    map[row.employeeId]!.push(row);
  }

  return map;
});

function employeeDepartmentId(employee: (typeof schedulerEmployees.value)[number]) {
  return getActiveEmploymentDetail(employee)?.departmentId ?? null;
}

const typeLabels: Record<CalendarType, string> = {
  work: 'Work',
  birthday: 'Birthday',
  holiday: 'Holiday',
  vacation: 'Vacation',
  sick: 'Sick',
  other: 'Other',
};

const isAdminUser = computed(() => canViewAllSchedulerEmployees());

const generalGroupId = computed(
  () => calendarGroups.value.find((group) => group.key === 'general')?.id ?? null,
);

const schedulerEmployees = computed(() => {
  const employees = [...schedulerStoreEmployees.value];
  if (currentEmployee.value && !employees.some((employee) => employee.id === currentEmployee.value?.id)) {
    employees.unshift(currentEmployee.value);
  }
  return employees;
});

const employeesById = computed(() => {
  const map: Record<string, (typeof schedulerEmployees.value)[number]> = {};
  for (const employee of schedulerEmployees.value) {
    map[employee.id] = employee;
  }
  return map;
});

const accruedHoursByEmployeeId = computed(() => employeePoolStore.accruedHoursByEmployeeId);

const visibleDays = computed(() => getVisibleDays(viewMode.value, selectedDate.value));

const headerLabel = computed(() =>
  formatSchedulerPeriodLabel(viewMode.value, selectedDate.value),
);

const workEvents = computed(() =>
  calendars.value.filter((event) => event.type === 'work' && event.source === 'scheduled_work'),
);

const leaveEvents = computed(() =>
  calendars.value.filter((event) => event.source === 'leave'),
);

const displayWorkEvents = computed(() => [
  ...workEvents.value,
  ...importPreviewEvents.value,
  ...leaveEvents.value,
]);

const visibleEmployees = computed(() => {
  let employees = schedulerEmployees.value;

  employees = filterEmployeesByName(employees, schedulerStore.employeeSearch);

  if (filterEmployeeId.value) {
    employees = employees.filter((employee) => employee.id === filterEmployeeId.value);
  }

  if (filterDepartmentId.value != null) {
    const departmentId = Number(filterDepartmentId.value);
    employees = employees.filter((employee) => {
      const active = getActiveEmploymentDetail(employee);
      return active?.departmentId != null && Number(active.departmentId) === departmentId;
    });
  }

  if (filterEmployeeGroupId.value) {
    const memberIds = employeeGroupStore.employeeIdsByGroupId.get(filterEmployeeGroupId.value);
    if (memberIds) {
      employees = employees.filter((employee) => memberIds.has(employee.id));
    }
  }

  if (hideUnscheduledUsers.value) {
    const scheduled = scheduledEmployeeIds(displayWorkEvents.value, visibleDays.value);
    employees = employees.filter((employee) => scheduled.has(employee.id));
  }

  return employees;
});

const gridRows = computed<SchedulerGridRow[]>(() => {
  const employees = visibleEmployees.value;

  if (viewBy.value === 'department') {
    return buildDepartmentGroupedGridRows(
      employees,
      sortBy.value,
      departmentNameById.value,
      employeeDepartmentId,
    );
  }

  if (viewBy.value === 'group') {
    return buildEmployeeGroupGridRows(employees, sortBy.value, employeeGroupStore.groups);
  }

  return buildEmployeeGridRows(employees, sortBy.value);
});

const showInitialLoading = computed(
  () => isEmployeesLoading.value || (isLoadingCalendars.value && gridRows.value.length === 0),
);

const isRefreshing = computed(
  () =>
    (isLoadingCalendars.value || (isLoadingEmployees.value && !isLoadingMoreEmployees.value))
    && gridRows.value.length > 0
    && !isLoadingMoreEmployees.value,
);

const gridEmptyMessage = computed(() => {
  if (isEmployeesLoading.value) {
    return '';
  }

  if (!hasLoadedEmployees.value) {
    return 'Loading employees…';
  }

  if (schedulerEmployees.value.length === 0) {
    return 'No employees available for the schedule.';
  }

  if (hideUnscheduledUsers.value) {
    return 'No scheduled employees in this period. Turn off "Hide unscheduled users" or adjust filters.';
  }

  if (filterEmployeeId.value || filterDepartmentId.value != null || filterEmployeeGroupId.value) {
    return 'No employees match the current filters.';
  }

  return 'No rows to display. Adjust filters or add shifts.';
});

const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEntry | null>(null);
const showCreateDialog = ref(false);
const createRange = ref({ start: '', end: '' });
const createEmployeeId = ref<string | null>(null);
const showMetricsDialog = ref(false);
const metricsEditDay = ref<string | null>(null);
const showNoticeDialog = ref(false);
const editingNotice = ref<SchedulerNotice | null>(null);
const noticeDefaultStart = ref<string | null>(null);
const noticeDefaultEnd = ref<string | null>(null);
const showManageShiftTemplates = ref(false);
const showShiftTemplateEditDialog = ref(false);

const metricsDialogValues = computed<Record<string, number | null>>(() => {
  if (!metricsEditDay.value) {
    return {};
  }
  return metricStore.valuesByDate[metricsEditDay.value] ?? {};
});

const noticeDepartmentOptions = computed(() =>
  departmentStore.departments
    .map((department) => ({ label: department.name, value: department.id }))
    .sort((left, right) => left.label.localeCompare(right.label)),
);

const noticeEmployeeOptions = computed(() =>
  schedulerEmployees.value
    .map((employee) => ({
      label: employeeDisplayName(employee),
      value: employee.id,
    }))
    .sort((left, right) => left.label.localeCompare(right.label)),
);

async function fetchDailyMetrics() {
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);
  await metricStore.fetchDailyMetrics(start, end);
}

async function fetchPublicHolidays() {
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);

  await publicHolidayStore.fetchHolidays({
    start,
    end,
    isActive: true,
    perPage: 100,
  });

  if (publicHolidayStore.error) {
    holidayNamesByDate.value = {};
    return;
  }

  const namesByDate: Record<string, string> = {};
  for (const holiday of publicHolidayStore.holidays) {
    if (!holiday.isActive) {
      continue;
    }

    for (const day of enumerateDateRange(holiday.startDate, holiday.endDate)) {
      if (day < start || day > end) {
        continue;
      }
      namesByDate[day] = holiday.name;
    }
  }

  holidayNamesByDate.value = namesByDate;
}

async function fetchSchedulerNotices() {
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);
  await noticeStore.fetchNotices(start, end);
}

async function fetchShifts() {
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);
  const params: Parameters<typeof calendarStore.fetchCalendars>[0] = {
    start,
    end,
    perPage: 500,
    scheduler: true,
  };

  if (filterDepartmentId.value != null) {
    params.departmentId = filterDepartmentId.value;
  }

  if (filterEmployeeGroupId.value) {
    params.employeeGroupId = filterEmployeeGroupId.value;
  }

  if (filterEmployeeId.value) {
    params.employeeId = filterEmployeeId.value;
  } else if (isAdminUser.value) {
    // Admin sees all shifts — no employee filter.
  } else if (canViewEmployees.value) {
    const employeeIds = schedulerEmployees.value.map((employee) => employee.id);
    if (employeeIds.length) {
      params.employeeIds = employeeIds;
    }
  } else if (currentEmployee.value?.id) {
    params.employeeId = currentEmployee.value.id;
  }

  const timesheetEmployeeIds = schedulerEmployees.value.map((employee) => employee.id);
  const timesheetPromise = timesheetEmployeeIds.length
    ? attendanceStore.fetchTimesheets(
        {
          startDate: start,
          endDate: end,
          employeeIds: timesheetEmployeeIds,
        },
        1,
        Math.min(Math.max(timesheetEmployeeIds.length * 14, 50), 500),
      )
    : Promise.resolve();

  await Promise.all([
    calendarStore.fetchCalendars(params),
    timesheetPromise,
    fetchDailyMetrics(),
    fetchPublicHolidays(),
    fetchSchedulerNotices(),
  ]);

  if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

function prevPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  const delta = viewMode.value === 'day' ? { days: 1 } : { days: 7 };
  selectedDate.value = date.formatDate(date.subtractFromDate(parsed, delta), 'YYYY-MM-DD');
}

function nextPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  const delta = viewMode.value === 'day' ? { days: 1 } : { days: 7 };
  selectedDate.value = date.formatDate(date.addToDate(parsed, delta), 'YYYY-MM-DD');
}

function goToday() {
  selectedDate.value = date.formatDate(Date.now(), 'YYYY-MM-DD');
}

function handleSelectShift(shift: CalendarEntry) {
  selectedEvent.value = shift;
  showEventDialog.value = true;
}

function handleCreateShift(payload: { row: SchedulerGridRow; day: string; endDay?: string }) {
  const clipped = clipDateRangeToFuture(payload.day, payload.endDay ?? payload.day);
  if (!clipped) {
    $q.notify({
      type: 'warning',
      message: 'Only today and future dates can be used to create shifts.',
    });
    return;
  }

  createRange.value = clipped;
  createEmployeeId.value = payload.row.rowKind === 'employee' ? payload.row.id : null;
  showCreateDialog.value = true;
}

async function handleAssignShiftTemplate(payload: {
  row: SchedulerGridRow;
  day: string;
  endDay?: string;
  template: ShiftTemplate;
}) {
  if (!canImportShifts.value || payload.row.rowKind !== 'employee') {
    return;
  }

  const clipped = clipDateRangeToFuture(payload.day, payload.endDay ?? payload.day);
  if (!clipped) {
    $q.notify({
      type: 'warning',
      message: 'Only today and future dates can be used to create shifts.',
    });
    return;
  }

  const employee = employeesById.value[payload.row.id];
  const active = getActiveEmploymentDetail(employee);
  const created = await shiftTemplateStore.assignTemplate(payload.template.id, {
    employeeId: payload.row.id,
    date: clipped.start,
    endDate: clipped.end,
    employmentDetailId: active?.id ?? null,
    departmentId: active?.departmentId ?? null,
    worksiteId: active?.worksiteId ?? null,
    description: shiftTemplateDisplayLabel(payload.template),
  });

  if (!created) {
    $q.notify({
      type: 'negative',
      message: shiftTemplateStore.error || 'Unable to assign shift template.',
    });
    return;
  }

  for (const record of created) {
    const events = scheduledWorkRecordToEvents(record as Parameters<typeof scheduledWorkRecordToEvents>[0]);
    const scheduledWorkId = events[0]?.scheduled_work_id;
    if (scheduledWorkId) {
      calendarStore.replaceScheduledWorkEvents(scheduledWorkId, events);
    }
  }

  const daySpan = enumerateDateRange(clipped.start, clipped.end).length;
  const isSplit = created.length > 1;
  $q.notify({
    type: 'positive',
    message: isSplit
      ? `Assigned split shift (${created.length} blocks)${daySpan > 1 ? ` across ${daySpan} days` : ''}.`
      : daySpan > 1
        ? `Shift assigned across ${daySpan} days.`
        : 'Shift assigned.',
  });
}

function openCreateShiftTemplate() {
  if (!canImportShifts.value) {
    return;
  }
  showShiftTemplateEditDialog.value = true;
}

function onShiftTemplateSaved() {
  void shiftTemplateStore.fetchTemplates({ activeOnly: false });
}

function handleEditDayMetrics(day: string) {
  if (!canEditMetrics.value) {
    return;
  }
  metricsEditDay.value = day;
  showMetricsDialog.value = true;
}

function openCreateNotice() {
  if (!canEditNotices.value) {
    return;
  }
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);
  editingNotice.value = null;
  noticeDefaultStart.value = start;
  noticeDefaultEnd.value = end;
  showNoticeDialog.value = true;
}

function openEditNotice(notice: SchedulerNotice) {
  if (!canEditNotices.value) {
    return;
  }
  editingNotice.value = notice;
  noticeDefaultStart.value = notice.start_date;
  noticeDefaultEnd.value = notice.end_date;
  showNoticeDialog.value = true;
}

function handleCreateSaved() {
  clearCreateSelection();
  void fetchShifts();
}

function clearImportPreview() {
  importPreviewEvents.value = [];
}

function handleImportPreviewed(preview: SchedulerShiftImportPreview | null) {
  if (!preview) {
    importPreviewEvents.value = [];
    return;
  }

  const events: CalendarEntry[] = [];

  for (const row of preview.rows) {
    if (row.errors.length || !row.employeeId || !row.startDate || !row.endDate) {
      continue;
    }

    const previewId = `import-preview-${row.rowNumber}`;
    for (const day of enumerateDateRange(row.startDate, row.endDate)) {
      events.push({
        id: `${previewId}-${day}`,
        scheduled_work_id: previewId,
        date: day,
        description: row.description?.trim() || 'Imported shift',
        type: 'work',
        rate: row.rate,
        source: 'scheduled_work',
        employee_id: row.employeeId,
        employee_name: row.employeeName ?? null,
        employment_detail_id: row.employmentDetailId ?? null,
        department_id: row.departmentId ?? null,
        department_name: row.departmentName ?? null,
        worksite_id: row.worksiteId ?? null,
        worksite_name: row.worksiteName ?? null,
        include_lunch_hour: row.includeLunchHour,
        lunch_hour_hours: row.includeLunchHour ? row.lunchHourHours : null,
        start_date: row.startDate,
        end_date: row.endDate,
        start_time: row.startTime,
        end_time: row.endTime,
        is_import_preview: true,
      });
    }
  }

  importPreviewEvents.value = events;
}

async function previewShiftImport(rows: Parameters<typeof calendarStore.previewScheduledWorkImport>[0]) {
  isImportWorking.value = true;
  try {
    return await calendarStore.previewScheduledWorkImport(rows);
  } finally {
    isImportWorking.value = false;
  }
}

async function confirmShiftImport(rows: Parameters<typeof calendarStore.confirmScheduledWorkImport>[0]) {
  isImportWorking.value = true;
  try {
    return await calendarStore.confirmScheduledWorkImport(rows);
  } finally {
    isImportWorking.value = false;
  }
}

async function handleImportApplied() {
  clearImportPreview();
  await fetchShifts();
}

function clearCreateSelection() {
  createEmployeeId.value = null;
}

async function handleLoadMoreEmployees() {
  const { start, end } = getDateRangeForView(viewMode.value, selectedDate.value);
  const newEmployees = await schedulerStore.loadMoreEmployees();
  const employeeIds = newEmployees.map((employee) => employee.id);
  if (!employeeIds.length) {
    return;
  }

  await attendanceStore.fetchTimesheets(
    { startDate: start, endDate: end, employeeIds },
    1,
    Math.min(employeeIds.length * 14, 500),
    { append: true },
  );
}

watch([selectedDate, viewMode, filterEmployeeId, filterDepartmentId, filterEmployeeGroupId], () => {
  void fetchShifts();
});

watch(
  () => schedulerEmployees.value.map((employee) => employee.id).join(','),
  (idsKey) => {
    if (!idsKey) {
      return;
    }

    void employeePoolStore.fetchAccruedHours(idsKey.split(','));
  },
  { immediate: true },
);

watch([viewBy, hideUnscheduledUsers], () => {
  // row composition only
});

watch(
  () => schedulerStore.sortBy,
  () => {
    if (schedulerStore.employeesMode !== 'paginated' || !hasLoadedEmployees.value) {
      return;
    }

    void schedulerStore.fetchEmployees(true);
  },
);

async function initializeSchedulerView() {
  isBootstrapping.value = true;
  try {
    const departmentPromise = departmentStore.departments.length
      ? Promise.resolve()
      : departmentStore.fetchDepartments({ page: 1, perPage: 500 });
    const groupsPromise = calendarGroups.value.length
      ? Promise.resolve()
      : calendarStore.fetchCalendarGroups();

    await Promise.all([
      groupsPromise,
      departmentPromise,
      employeeGroupStore.groups.length
        ? Promise.resolve()
        : employeeGroupStore.fetchGroups({ withMembers: true, activeOnly: false }),
      prepareSchedulerEmployees(),
      shiftTemplateStore.ensureTemplatesLoaded(),
    ]);

    if (employeesError.value) {
      $q.notify({ type: 'negative', message: employeesError.value });
    }

    await fetchShifts();
  } finally {
    isBootstrapping.value = false;
  }
}

onMounted(async () => {
  await initializeSchedulerView();
});
</script>

<style scoped>
.scheduler-shell {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.scheduler-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  padding: 4px 4px 4px 0;
  overflow: hidden;
}

.scheduler-topbar-host {
  flex-shrink: 0;
  margin-bottom: 4px;
}

.scheduler-surface {
  padding: 0;
  border-radius: 12px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.scheduler-grid-host {
  flex: 1 1 0;
  min-height: 0;
}

.scheduler-loading-label {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
  text-align: center;
}

.scheduler-refresh-banner {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  color: #52606d;
  font-size: 13px;
  pointer-events: none;
}

.scheduler-import-preview-banner {
  flex-shrink: 0;
  padding: 8px 12px;
  background: #fff8e7;
  color: #92400e;
  font-size: 13px;
  border-bottom: 1px solid rgba(146, 64, 14, 0.12);
}
</style>
