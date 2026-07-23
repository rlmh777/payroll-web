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
import { ref, watch } from 'vue';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import SchedulerMiniSearch from '../settings/calendar/SchedulerMiniSearch.vue';
import TimesheetFilterOptions from './TimesheetFilterOptions.vue';

const calendarStore = useCalendarStore();
const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();

const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null);

watch(
  () => [
    schedulerStore.filterDepartmentId,
    schedulerStore.filterEmployeeId,
    timesheetStore.filterApprovalStatus,
  ],
  () => {
    void (async () => {
      if (
        canViewAllSchedulerEmployees()
        && schedulerStore.employeesMode === 'paginated'
      ) {
        await schedulerStore.fetchEmployees(true);
      }
      await timesheetStore.fetchTimesheetRows(true);
    })();
  },
  { deep: true },
);

watch(
  () => schedulerStore.employeeSearch,
  () => {
    if (!schedulerStore.hasLoadedEmployees) {
      return;
    }

    if (searchDebounce.value) {
      clearTimeout(searchDebounce.value);
    }

    searchDebounce.value = setTimeout(() => {
      void (async () => {
        if (canViewAllSchedulerEmployees()) {
          await schedulerStore.reloadEmployeesForSearch(calendarStore.currentEmployee);
        }
        await timesheetStore.fetchTimesheetRows(true);
      })();
    }, 300);
  },
);
</script>

<style scoped>
.left-pane-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  gap: 12px;
  padding: 12px 16px 16px;
  box-sizing: border-box;
}

.left-pane-search,
.left-pane-filters {
  flex-shrink: 0;
}
</style>
