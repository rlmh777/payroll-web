<template>
  <div class="left-pane-container">
    <div class="left-pane-search">
      <SchedulerMiniSearch />
    </div>
    <div class="left-pane-filters">
      <SchedulerFilterOptions />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { prepareSchedulerEmployees } from '@hr/utils/scheduler-bootstrap';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import SchedulerMiniSearch from './SchedulerMiniSearch.vue';
import SchedulerFilterOptions from './SchedulerFilterOptions.vue';

const schedulerStore = useSchedulerStore();
const calendarStore = useCalendarStore();

const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null);

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
      if (!canViewAllSchedulerEmployees()) {
        return;
      }

      void schedulerStore.reloadEmployeesForSearch(calendarStore.currentEmployee);
    }, 300);
  },
);

watch(
  () => schedulerStore.filterDepartmentId,
  () => {
    if (
      !schedulerStore.hasLoadedEmployees
      || !canViewAllSchedulerEmployees()
      || schedulerStore.employeesMode !== 'paginated'
    ) {
      return;
    }

    void schedulerStore.fetchEmployees(true);
  },
);

watch(
  () => schedulerStore.filterEmployeeGroupId,
  () => {
    if (
      !schedulerStore.hasLoadedEmployees
      || !canViewAllSchedulerEmployees()
      || schedulerStore.employeesMode !== 'paginated'
    ) {
      return;
    }

    void schedulerStore.fetchEmployees(true);
  },
);

onMounted(async () => {
  if (!schedulerStore.hasLoadedEmployees || schedulerStore.employees.length === 0) {
    await prepareSchedulerEmployees();
  }
});
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
