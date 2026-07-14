<template>
  <div class="scheduler-shell">
    <section class="scheduler-main">
      <div class="scheduler-topbar-host">
        <SchedulerTopbar
          v-model:view-mode="viewMode"
          :header-label="headerLabel"
          @prev="prevPeriod"
          @next="nextPeriod"
          @today="goToday"
        />
      </div>

      <div class="scheduler-surface">
        <q-inner-loading :showing="isEmployeesLoading">
          <q-spinner color="primary" size="40px" />
          <div class="scheduler-loading-label">{{ schedulerLoadingLabel }}</div>
        </q-inner-loading>

        <SchedulerGrid
          class="scheduler-grid-host"
          :rows="gridRows"
          :visible-days="visibleDays"
          :events="workEvents"
          :employees-by-id="employeesById"
          :view-by="viewBy"
          :loading="isEmployeesLoading"
          :loading-shifts="isLoadingCalendars"
          :loading-more="isLoadingMoreEmployees"
          :has-more="canLoadMoreEmployees"
          :empty-message="gridEmptyMessage"
          :load-more="handleLoadMoreEmployees"
          :timesheets-by-employee-id="timesheetsByEmployeeId"
          :departments-by-id="departmentsById"
          @select-shift="handleSelectShift"
          @create-shift="handleCreateShift"
        />
      </div>
    </section>

    <CalendarEventDialog
      v-model="showEventDialog"
      :event="selectedEvent"
      :type-labels="typeLabels"
      :employees="schedulerEmployees"
      :show-employee-picker="canViewEmployees"
      @saved="fetchShifts"
    />

    <CalendarCreateDialog
      v-model="showCreateDialog"
      :start-date="createRange.start"
      :end-date="createRange.end"
      :general-group-id="generalGroupId"
      :default-employee-id="createEmployeeId"
      :employees="schedulerEmployees"
      :show-employee-picker="canViewEmployees"
      work-only
      @saved="handleCreateSaved"
      @close="clearCreateSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useAuthStore } from '@core/stores/auth';
import { useDepartmentStore } from '@hr/stores/department-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import SchedulerTopbar from './SchedulerTopbar.vue';
import SchedulerGrid from './SchedulerGrid.vue';
import CalendarEventDialog from './CalendarEventDialog.vue';
import CalendarCreateDialog from './CalendarCreateDialog.vue';
import type { CalendarType } from './calendarTypes';
import type { CalendarEntry } from '@hr/stores/calendar-store';
import { clipDateRangeToFuture } from '@hr/utils/calendar-event-utils';
import { getActiveEmploymentDetail } from '@hr/utils/calendar-employment-utils';
import { prepareSchedulerEmployees } from '@hr/utils/scheduler-bootstrap';
import {
  canManageSchedulerEmployees,
  canViewAllSchedulerEmployees,
} from '@hr/utils/scheduler-access';
import {
  buildDepartmentGroupedGridRows,
  buildEmployeeGridRows,
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
const authStore = useAuthStore();
const departmentStore = useDepartmentStore();
const attendanceStore = useAttendanceStore();
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

const roleLabel = computed(() => authStore.user?.role?.toLowerCase() ?? '');

const canViewEmployees = computed(() => canManageSchedulerEmployees(roleLabel.value));

const isEmployeesLoading = computed(
  () =>
    (canViewEmployees.value && !hasLoadedEmployees.value) ||
    (isLoadingEmployees.value && schedulerStoreEmployees.value.length === 0),
);

const schedulerLoadingLabel = computed(() => 'Loading employees…');

const selectedDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'));
const viewMode = ref<SchedulerViewMode>('week');

const viewBy = computed(() => schedulerStore.viewBy);
const filterDepartmentId = computed(() => schedulerStore.filterDepartmentId);
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

const isAdminUser = computed(() => canViewAllSchedulerEmployees(roleLabel.value));

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

const visibleDays = computed(() => getVisibleDays(viewMode.value, selectedDate.value));

const headerLabel = computed(() =>
  formatSchedulerPeriodLabel(viewMode.value, selectedDate.value),
);

const workEvents = computed(() =>
  calendars.value.filter((event) => event.type === 'work' && event.source === 'scheduled_work'),
);

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

  if (hideUnscheduledUsers.value) {
    const scheduled = scheduledEmployeeIds(workEvents.value, visibleDays.value);
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

  return buildEmployeeGridRows(employees, sortBy.value);
});

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

  if (filterEmployeeId.value || filterDepartmentId.value != null) {
    return 'No employees match the current filters.';
  }

  return 'No rows to display. Adjust filters or add shifts.';
});

const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEntry | null>(null);
const showCreateDialog = ref(false);
const createRange = ref({ start: '', end: '' });
const createEmployeeId = ref<string | null>(null);

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

  await Promise.all([
    calendarStore.fetchCalendars(params),
    attendanceStore.fetchTimesheets({ startDate: start, endDate: end }, 1, 2000),
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

function handleCreateShift(payload: { row: SchedulerGridRow; day: string }) {
  const clipped = clipDateRangeToFuture(payload.day, payload.day);
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

function handleCreateSaved() {
  clearCreateSelection();
  void fetchShifts();
}

function clearCreateSelection() {
  createEmployeeId.value = null;
}

async function handleLoadMoreEmployees() {
  await schedulerStore.loadMoreEmployees();
}

watch([selectedDate, viewMode, filterEmployeeId, filterDepartmentId], () => {
  void fetchShifts();
});

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
  await Promise.all([
    calendarStore.fetchCalendarGroups(),
    departmentStore.fetchDepartments({ page: 1, perPage: 500 }),
  ]);

  if (employeesError.value) {
    $q.notify({ type: 'negative', message: employeesError.value });
  }

  await fetchShifts();
}

onMounted(async () => {
  if (!hasLoadedEmployees.value || schedulerStoreEmployees.value.length === 0) {
    await prepareSchedulerEmployees({ force: true });
  }

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
</style>
