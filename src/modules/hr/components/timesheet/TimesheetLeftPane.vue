<template>
  <div class="left-pane-container">
    <div class="left-pane-search">
      <SchedulerMiniSearch />
    </div>
    <div class="left-pane-filters">
      <TimesheetFilterOptions />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import SchedulerMiniSearch from '../settings/calendar/SchedulerMiniSearch.vue';
import TimesheetFilterOptions from './TimesheetFilterOptions.vue';

const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();

watch(
  () => [
    schedulerStore.filterDepartmentId,
    schedulerStore.filterEmployeeId,
    timesheetStore.filterApprovalStatus,
  ],
  () => {
    void timesheetStore.fetchTimesheetRows(true);
  },
  { deep: true },
);
</script>

<style scoped>
.left-pane-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.left-pane-search {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  padding: 8px 12px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.left-pane-filters {
  padding: 0 12px 12px;
}
</style>
