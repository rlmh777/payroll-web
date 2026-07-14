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
        <q-inner-loading :showing="isLoadingTimesheets && groupedTimesheets.length === 0">
          <q-spinner color="primary" size="40px" />
        </q-inner-loading>

        <div v-if="!isLoadingTimesheets && groupedTimesheets.length === 0" class="empty-state">
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
          v-else-if="!canLoadMoreEmployees && groupedTimesheets.length > 0"
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
import { useAuthStore } from '@core/stores/auth';
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
const authStore = useAuthStore();
const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();

const { isLoadingTimesheets } = storeToRefs(attendanceStore);
const { groupedTimesheets, employeesHasMore, isLoadingMoreEmployees } = storeToRefs(timesheetStore);

const roleLabel = computed(() => authStore.user?.role?.toLowerCase() ?? '');
const canLoadMoreEmployees = computed(
  () => canViewAllSchedulerEmployees(roleLabel.value) && employeesHasMore.value,
);
const isLoadingMore = computed(
  () => isLoadingMoreEmployees.value || (isLoadingTimesheets.value && groupedTimesheets.value.length > 0),
);

const anchorDate = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));
const timesheetSurfaceRef = ref<HTMLElement | null>(null);

const headerLabel = computed(() => formatSchedulerPeriodLabel('week', anchorDate.value));

function syncWeekRange() {
  const range = getDateRangeForView('week', anchorDate.value);
  timesheetStore.setDateRange(range.start, range.end);
}

async function refreshTimesheets(reset = true) {
  if (reset && canViewAllSchedulerEmployees(roleLabel.value)) {
    if (!schedulerStore.hasLoadedEmployees || schedulerStore.employees.length === 0) {
      await prepareSchedulerEmployees({ force: true });
    }
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
  await timesheetStore.loadMoreTimesheetEmployees(roleLabel.value);
}

function onSurfaceScroll() {
  const element = timesheetSurfaceRef.value;
  if (!element || !canLoadMoreEmployees.value || isLoadingMore.value) {
    return;
  }

  const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
  if (remaining <= LOAD_MORE_OFFSET_PX) {
    void handleLoadMoreEmployees();
  }
}

onMounted(async () => {
  syncWeekRange();
  await attendanceSettingStore.fetchSettings();
  await prepareSchedulerEmployees({ force: true });
  await refreshTimesheets(true);
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #52606d;
}
</style>
