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
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import SchedulerMiniSearch from '../settings/calendar/SchedulerMiniSearch.vue';
import TimesheetFilterOptions from './TimesheetFilterOptions.vue';

const authStore = useAuthStore();
const calendarStore = useCalendarStore();
const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();

const roleLabel = computed(() => authStore.user?.role?.toLowerCase() ?? '');
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
        canViewAllSchedulerEmployees(roleLabel.value)
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
        if (canViewAllSchedulerEmployees(roleLabel.value)) {
          await schedulerStore.reloadEmployeesForSearch(
            calendarStore.currentEmployee,
            roleLabel.value,
          );
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
