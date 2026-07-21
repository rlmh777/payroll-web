<template>
  <div class="timesheet-shell">
    <section class="timesheet-main">
      <div class="timesheet-topbar-host">
        <TimesheetTopbar
          :header-label="headerLabel"
          :employee-count="groupedTimesheets.length"
          @prev="prevWeek"
          @next="nextWeek"
          @today="goToday"
        />
      </div>

      <div
        ref="timesheetSurfaceRef"
        class="timesheet-surface"
        @scroll="onSurfaceScroll"
      >
        <q-inner-loading :showing="showInitialLoading">
          <q-spinner color="primary" size="40px" />
          <div class="timesheet-loading-label">{{ loadingLabel }}</div>
        </q-inner-loading>

        <div
          v-if="isRefreshing && groupedTimesheets.length > 0"
          class="timesheet-refresh-banner row items-center justify-center q-gutter-sm"
        >
          <q-spinner color="primary" size="18px" />
          <span>{{ loadingLabel }}</span>
        </div>

        <div v-if="!isSurfaceLoading && groupedTimesheets.length === 0" class="empty-state">
          <q-icon name="event_note" size="48px" color="grey-5" />
          <div class="text-subtitle1 q-mt-md">No timesheets found for this period</div>
          <div class="text-caption text-grey-7">Adjust the filters or date range to see employee hours.</div>
        </div>

        <TimesheetEmployeeGroup
          v-for="group in groupedTimesheets"
          :key="group.key"
          :group="group"
        />

        <div v-if="isLoadingMore" class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="32px" />
        </div>

        <div
          v-else-if="!canLoadMoreEmployees && groupedTimesheets.length > 0 && !isSurfaceLoading"
          class="row justify-center q-my-md"
        >
          <div class="text-caption text-grey-6">All employees loaded</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { date } from 'quasar';
import { storeToRefs } from 'pinia';
import TimesheetTopbar from './TimesheetTopbar.vue';
import TimesheetEmployeeGroup from './TimesheetEmployeeGroup.vue';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { useAttendanceSettingStore } from 'src/stores/attendance-setting-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import { prepareSchedulerEmployees } from '@hr/utils/scheduler-bootstrap';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import { formatSchedulerPeriodLabel, getDateRangeForView } from '@hr/utils/scheduler-utils';

const LOAD_MORE_OFFSET_PX = 240;

const attendanceStore = useAttendanceStore();
const attendanceSettingStore = useAttendanceSettingStore();
const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();

const { isLoadingTimesheets } = storeToRefs(attendanceStore);
const { isLoadingEmployees } = storeToRefs(schedulerStore);
const { groupedTimesheets, employeesHasMore, isLoadingMoreEmployees } = storeToRefs(timesheetStore);

const isBootstrapping = ref(false);
const canLoadMoreEmployees = computed(
  () => canViewAllSchedulerEmployees() && employeesHasMore.value,
);
const isLoadingMore = computed(() => isLoadingMoreEmployees.value);

const isSurfaceLoading = computed(
  () =>
    isBootstrapping.value
    || (isLoadingEmployees.value && !isLoadingMoreEmployees.value)
    || (isLoadingTimesheets.value && !isLoadingMoreEmployees.value),
);

const showInitialLoading = computed(
  () => isSurfaceLoading.value && groupedTimesheets.value.length === 0,
);

const isRefreshing = computed(
  () =>
    isSurfaceLoading.value
    && groupedTimesheets.value.length > 0
    && !isLoadingMoreEmployees.value,
);

const loadingLabel = computed(() => {
  if (isBootstrapping.value || (isLoadingEmployees.value && schedulerStore.employees.length === 0)) {
    return 'Loading employees…';
  }
  return 'Loading timesheets…';
});

const anchorDate = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));
const timesheetSurfaceRef = ref<HTMLElement | null>(null);

const headerLabel = computed(() => formatSchedulerPeriodLabel('week', anchorDate.value));

function syncWeekRange() {
  const range = getDateRangeForView('week', anchorDate.value);
  timesheetStore.setDateRange(range.start, range.end);
}

async function refreshTimesheets(reset = true) {
  if (
    reset
    && canViewAllSchedulerEmployees()
    && schedulerStore.employees.length === 0
  ) {
    await prepareSchedulerEmployees();
  }

  await timesheetStore.fetchTimesheetRows(reset);
}

function prevWeek() {
  anchorDate.value = date.formatDate(date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), { days: -7 }), 'YYYY-MM-DD');
  syncWeekRange();
  void refreshTimesheets(true);
}

function nextWeek() {
  anchorDate.value = date.formatDate(date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), { days: 7 }), 'YYYY-MM-DD');
  syncWeekRange();
  void refreshTimesheets(true);
}

function goToday() {
  anchorDate.value = date.formatDate(new Date(), 'YYYY-MM-DD');
  syncWeekRange();
  void refreshTimesheets(true);
}

async function handleLoadMoreEmployees() {
  await timesheetStore.loadMoreTimesheetEmployees();
}

function onSurfaceScroll() {
  const element = timesheetSurfaceRef.value;
  if (!element || !canLoadMoreEmployees.value || isLoadingMore.value || isSurfaceLoading.value) {
    return;
  }

  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
  if (remaining <= LOAD_MORE_OFFSET_PX) {
    void handleLoadMoreEmployees();
  }
}

onMounted(async () => {
  syncWeekRange();
  isBootstrapping.value = true;
  try {
    await Promise.all([
      attendanceSettingStore.fetchSettings(),
      prepareSchedulerEmployees(),
    ]);
    await refreshTimesheets(true);
  } finally {
    isBootstrapping.value = false;
  }
});
</script>

<style scoped>
.timesheet-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.timesheet-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 12px;
  padding: 12px;
}

.timesheet-topbar-host {
  flex-shrink: 0;
}

.timesheet-surface {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.timesheet-loading-label {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
  text-align: center;
}

.timesheet-refresh-banner {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  color: #52606d;
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #52606d;
}
</style>
