<template>
  <div class="calendar-shell">
    <CalendarSidebar
      v-model:selectedDate="selectedDate"
      v-model:activeGroupIds="activeGroupIds"
      :mini-label="miniLabel"
      :calendar-groups="myCalendarGroups"
      :can-filter-calendars="canFilterCalendars"
      :can-view-employees="canViewEmployees"
      :employees="calendarEmployees"
      v-model:selectedEmployeeId="selectedEmployeeId"
      @create="openCreateDialog"
      @mini-prev="miniPrev"
      @mini-next="miniNext"
    />

    <section class="calendar-main">
      <CalendarTopbar
        :view-mode="calendarViewMode"
        :view-options="viewOptions"
        :header-label="headerLabel"
        :approval-mode="approvalMode"
        :show-approval-toggle="canViewEmployees"
        @update:viewMode="viewMode = $event"
        @update:approvalMode="handleApprovalToggle"
        @prev="prevPeriod"
        @next="nextPeriod"
        @today="goToday"
      />

      <q-card class="calendar-surface">
        <CalendarApprovals
          v-if="viewMode === 'approvals'"
          :items="approvalItems"
          @approve="handleApprovalAction($event, 'approved')"
          @reject="handleApprovalAction($event, 'rejected')"
          @approve-all="handleApproveAll"
        />
        <CalendarViews
          v-else
          :view-mode="calendarViewMode"
          :year-months="yearMonths"
          :selected-date="selectedDate"
          :day-label="dayLabel"
          :events-for-selected="eventsForSelected"
          :type-labels="typeLabels"
          :event-color="eventColor"
          :get-slot-date="getSlotDate"
          :events-for-slot="eventsForSlot"
          :month-label="monthLabel"
          :on-click-day="onClickDay"
          :type-chip-color="typeChipColor"
        />
      </q-card>
    </section>

    <CalendarCreateDialog
      v-model:show="showCreate"
      v-model:date="selectedDate"
      v-model:startTime="scheduleStartTime"
      v-model:endTime="scheduleEndTime"
      :can-add="canAdd"
      @save="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useCalendarStore } from 'src/stores/calendar-store';
import { useAuthStore } from 'src/stores/auth';
import CalendarSidebar from './CalendarSidebar.vue';
import CalendarTopbar from './CalendarTopbar.vue';
import CalendarViews from './CalendarViews.vue';
import CalendarCreateDialog from './CalendarCreateDialog.vue';
import CalendarApprovals from './CalendarApprovals.vue';
import type { CalendarType } from './calendarTypes';

const $q = useQuasar();
const calendarStore = useCalendarStore();
const authStore = useAuthStore();
const { calendars, error, calendarGroups, calendarEmployees, currentEmployee, approvalItems } =
  storeToRefs(calendarStore);

const selectedDate = ref(date.formatDate(Date.now(), 'YYYY-MM-DD'));
const viewMode = ref<'month' | 'year' | 'day' | 'approvals'>('month');
const approvalMode = computed<'calendar' | 'approvals'>(() =>
  viewMode.value === 'approvals' ? 'approvals' : 'calendar',
);

const calendarViewMode = computed<'day' | 'month' | 'year'>(() =>
  viewMode.value === 'approvals' ? 'month' : viewMode.value,
);

const lastCalendarMode = ref<'day' | 'month' | 'year'>('month');

function handleApprovalToggle(mode: 'calendar' | 'approvals') {
  if (mode === 'approvals') {
    viewMode.value = 'approvals';
  } else {
    viewMode.value = lastCalendarMode.value;
  }
}

watch(viewMode, (next) => {
  if (next !== 'approvals') {
    lastCalendarMode.value = next;
  }
});

const showCreate = ref(false);
const scheduleStartTime = ref('08:00');
const scheduleEndTime = ref('17:00');

const typeColors: Record<CalendarType, string> = {
  holiday: '#4f6bed',
  vacation: '#00a389',
  sick: '#f0423a',
  other: '#8f95a3',
  timesheet: '#1e88e5',
  schedule: '#546E7A',
};

const typeLabels: Record<CalendarType, string> = {
  holiday: 'Holiday',
  vacation: 'Vacation',
  sick: 'Sick',
  other: 'Other',
  timesheet: 'Timesheet',
  schedule: 'Schedule',
};

const activeGroupIds = ref<string[]>([]);
const activeGroups = computed(() => new Set(activeGroupIds.value));
const myCalendarKeys = ['holidays', 'birthdays', 'timesheets', 'schedules', 'leaves'];
const myCalendarGroups = computed(() =>
  calendarGroups.value.filter((group) => myCalendarKeys.includes(group.key)),
);
const roleLabel = computed(() => authStore.user?.role?.toLowerCase() ?? '');
const isSupervisorRole = computed(
  () =>
    roleLabel.value.includes('supervisor') ||
    roleLabel.value.includes('team lead') ||
    roleLabel.value.includes('lead'),
);
const canFilterCalendars = computed(() => {
  const role = roleLabel.value;
  return (
    role.includes('supervisor') ||
    role.includes('team lead') ||
    role.includes('lead') ||
    role.includes('admin')
  );
});
const canViewEmployees = computed(() => canFilterCalendars.value);
const viewOptions: Array<{ label: string; value: 'day' | 'month' | 'year' }> = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];
const selectedEmployeeId = ref<string | null>(null);

const viewYear = ref(Number(selectedDate.value.slice(0, 4)));
const yearMonths = computed(() =>
  Array.from(
    { length: 12 },
    (_, index) => `${viewYear.value}-${String(index + 1).padStart(2, '0')}-01`,
  ),
);

const eventsForSelected = computed(() =>
  calendars.value.filter(
    (event) =>
      event.date === selectedDate.value &&
      activeGroups.value.has(event.calendar_group_id ?? ''),
  ),
);

const canAdd = computed(
  () =>
    selectedDate.value.length > 0 &&
    scheduleStartTime.value.trim().length > 0 &&
    scheduleEndTime.value.trim().length > 0,
);

const headerLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    return date.formatDate(parsed, 'YYYY');
  }
  if (viewMode.value === 'day') {
    return date.formatDate(parsed, 'dddd, MMMM D');
  }
  return date.formatDate(parsed, 'MMMM YYYY');
});

const miniLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'MMMM YYYY');
});

const dayLabel = computed(() => {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'dddd, MMMM D, YYYY');
});

function typeChipColor(type?: CalendarType) {
  const color = typeColors[type ?? 'other'];
  return color.replace('#', '');
}

function eventColor(event: { calendar_group_color?: string | null; type?: CalendarType }) {
  if (event.calendar_group_color) return event.calendar_group_color;
  return typeColors[event.type ?? 'other'];
}

function getMonthRange(value: string) {
  const parsed = date.extractDate(value, 'YYYY-MM-DD');
  return {
    start: date.formatDate(date.startOfDate(parsed, 'month'), 'YYYY-MM-DD'),
    end: date.formatDate(date.endOfDate(parsed, 'month'), 'YYYY-MM-DD'),
  };
}

function getYearRange(yearValue: number) {
  return {
    start: `${yearValue}-01-01`,
    end: `${yearValue}-12-31`,
  };
}

async function fetchEvents() {
  const { start, end } =
    viewMode.value === 'year' ? getYearRange(viewYear.value) : getMonthRange(selectedDate.value);
  const employeeId = selectedEmployeeId.value ?? currentEmployee.value?.id;
  const params: Parameters<typeof calendarStore.fetchCalendars>[0] = {
    start,
    end,
    perPage: 200,
    groupIds: activeGroupIds.value,
  };

  if (employeeId) {
    params.employeeId = employeeId;
  } else if (canViewEmployees.value) {
    const employeeIds = [
      currentEmployee.value?.id,
      ...calendarEmployees.value.map((employee) => employee.id),
    ].filter((id): id is string => Boolean(id));
    if (employeeIds.length) {
      params.employeeIds = Array.from(new Set(employeeIds));
    }
  }

  await calendarStore.fetchCalendars(params);

  if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

async function fetchApprovals() {
  const { start, end } =
    viewMode.value === 'year' ? getYearRange(viewYear.value) : getMonthRange(selectedDate.value);
  const params: Parameters<typeof calendarStore.fetchCalendarApprovals>[0] = {
    start,
    end,
  };

  if (selectedEmployeeId.value) {
    params.employeeId = selectedEmployeeId.value;
  } else if (isSupervisorRole.value && currentEmployee.value?.id) {
    params.supervisorId = currentEmployee.value.id;
  }

  await calendarStore.fetchCalendarApprovals(params);
}

async function handleApprovalAction(
  item: {
    id: string;
    type: 'timesheet' | 'schedule' | 'leave';
    description: string;
  },
  status: 'approved' | 'rejected',
) {
  try {
    await calendarStore.updateCalendarApproval({ id: item.id, type: item.type, status });
    $q.notify({
      type: 'positive',
      message: `${item.description} ${status}.`,
    });
  } catch (storeError) {
    const message = storeError instanceof Error ? storeError.message : 'Failed to update approval.';
    $q.notify({ type: 'negative', message });
  }
}

async function handleApproveAll() {
  if (!approvalItems.value.length) return;

  try {
    await Promise.all(
      approvalItems.value.map((item) =>
        calendarStore.updateCalendarApproval({
          id: item.id,
          type: item.type,
          status: 'approved',
        }),
      ),
    );
    $q.notify({
      type: 'positive',
      message: 'All approvals marked as approved.',
    });
  } catch (storeError) {
    const message = storeError instanceof Error ? storeError.message : 'Failed to approve all.';
    $q.notify({ type: 'negative', message });
  }
}

function getSlotDate(slotProps: unknown): string | null {
  if (!slotProps || typeof slotProps !== 'object') return null;
  const typed = slotProps as {
    timestamp?: { date?: string };
    scope?: { timestamp?: { date?: string } };
  };
  return typed.timestamp?.date ?? typed.scope?.timestamp?.date ?? null;
}

function eventsForDate(value: string) {
  return calendars.value.filter(
    (event) =>
      event.date === value &&
      activeGroups.value.has(event.calendar_group_id ?? ''),
  );
}

function eventsForSlot(slotProps: unknown) {
  const slotDate = getSlotDate(slotProps);
  return slotDate ? eventsForDate(slotDate) : [];
}

function onClickDay(payload: unknown) {
  if (!payload || typeof payload !== 'object') return;
  const typed = payload as { scope?: { timestamp?: { date?: string } } };
  const picked = typed.scope?.timestamp?.date;
  if (picked) {
    selectedDate.value = picked;
  }
}

function monthLabel(value: string) {
  const parsed = date.extractDate(value, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'MMMM');
}

function prevPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    viewYear.value -= 1;
    selectedDate.value = `${viewYear.value}-01-01`;
  } else if (viewMode.value === 'day') {
    selectedDate.value = date.formatDate(date.subtractFromDate(parsed, { days: 1 }), 'YYYY-MM-DD');
  } else {
    selectedDate.value = date.formatDate(
      date.subtractFromDate(parsed, { months: 1 }),
      'YYYY-MM-DD',
    );
  }
}

function nextPeriod() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  if (viewMode.value === 'year') {
    viewYear.value += 1;
    selectedDate.value = `${viewYear.value}-01-01`;
  } else if (viewMode.value === 'day') {
    selectedDate.value = date.formatDate(date.addToDate(parsed, { days: 1 }), 'YYYY-MM-DD');
  } else {
    selectedDate.value = date.formatDate(date.addToDate(parsed, { months: 1 }), 'YYYY-MM-DD');
  }
}

function goToday() {
  selectedDate.value = date.formatDate(Date.now(), 'YYYY-MM-DD');
}

function miniPrev() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  selectedDate.value = date.formatDate(date.subtractFromDate(parsed, { months: 1 }), 'YYYY-MM-DD');
}

function miniNext() {
  const parsed = date.extractDate(selectedDate.value, 'YYYY-MM-DD');
  selectedDate.value = date.formatDate(date.addToDate(parsed, { months: 1 }), 'YYYY-MM-DD');
}

function openCreateDialog() {
  showCreate.value = true;
}

async function handleCreate() {
  if (!canAdd.value) return;

  const employeeId = selectedEmployeeId.value ?? currentEmployee.value?.id;

  if (!employeeId) {
    $q.notify({ type: 'negative', message: 'Select an employee to schedule.' });
    return;
  }

  const result = await calendarStore.createScheduleTimesheet({
    employeeId,
    date: selectedDate.value,
    startTime: scheduleStartTime.value,
    endTime: scheduleEndTime.value,
  });

  if (result) {
    scheduleStartTime.value = '08:00';
    scheduleEndTime.value = '17:00';
    showCreate.value = false;
    await fetchEvents();
    $q.notify({ type: 'positive', message: 'Schedule timesheet saved.' });
  } else if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

watch(
  () => selectedDate.value,
  async (next, prev) => {
    viewYear.value = Number(next.slice(0, 4));
    if (
      date.formatDate(date.extractDate(next, 'YYYY-MM-DD'), 'YYYY-MM') !==
      date.formatDate(date.extractDate(prev, 'YYYY-MM-DD'), 'YYYY-MM')
    ) {
      await fetchEvents();
    }
  },
);

watch([viewMode, viewYear], async () => {
  if (viewMode.value === 'approvals') {
    await fetchApprovals();
  } else {
    lastCalendarMode.value = viewMode.value;
    await fetchEvents();
  }
});

watch(activeGroupIds, async () => {
  await fetchEvents();
});

watch(selectedEmployeeId, async () => {
  if (viewMode.value === 'approvals') {
    await fetchApprovals();
  } else {
    await fetchEvents();
  }
});

onMounted(async () => {
  await calendarStore.fetchCalendarGroups();
  if (authStore.user?.id) {
    await calendarStore.fetchEmployeeByUserId(String(authStore.user.id));
  }
  if (currentEmployee.value && canViewEmployees.value) {
    await calendarStore.fetchSubordinates(currentEmployee.value.id);
  }
  if (!activeGroupIds.value.length) {
    activeGroupIds.value = myCalendarGroups.value.map((group) => group.id);
  }
  await fetchEvents();
});
</script>

<style scoped>
.calendar-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
}

.calendar-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-surface {
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

@media (max-width: 1024px) {
  .calendar-shell {
    grid-template-columns: 1fr;
  }
}
</style>
