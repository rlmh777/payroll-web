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

      <div class="timesheet-surface">
        <q-inner-loading :showing="isLoadingTimesheets">
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
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useAttendanceSettingStore } from 'src/stores/attendance-setting-store';
import { useTimesheetStore } from 'src/stores/timesheet-store';
import { formatSchedulerPeriodLabel, getDateRangeForView } from 'src/utils/scheduler-utils';

const attendanceStore = useAttendanceStore();
const attendanceSettingStore = useAttendanceSettingStore();
const timesheetStore = useTimesheetStore();

const { isLoadingTimesheets } = storeToRefs(attendanceStore);
const { groupedTimesheets } = storeToRefs(timesheetStore);

const anchorDate = ref(date.formatDate(new Date(), 'YYYY-MM-DD'));

const headerLabel = computed(() => formatSchedulerPeriodLabel('week', anchorDate.value));

function syncWeekRange() {
  const range = getDateRangeForView('week', anchorDate.value);
  timesheetStore.setDateRange(range.start, range.end);
}

function prevWeek() {
  anchorDate.value = date.formatDate(date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), { days: -7 }), 'YYYY-MM-DD');
  syncWeekRange();
  void timesheetStore.fetchTimesheetRows();
}

function nextWeek() {
  anchorDate.value = date.formatDate(date.addToDate(date.extractDate(anchorDate.value, 'YYYY-MM-DD'), { days: 7 }), 'YYYY-MM-DD');
  syncWeekRange();
  void timesheetStore.fetchTimesheetRows();
}

function goToday() {
  anchorDate.value = date.formatDate(new Date(), 'YYYY-MM-DD');
  syncWeekRange();
  void timesheetStore.fetchTimesheetRows();
}

onMounted(() => {
  syncWeekRange();
  void attendanceSettingStore.fetchSettings();
  void timesheetStore.fetchTimesheetRows();
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
