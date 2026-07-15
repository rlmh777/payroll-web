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
import { computed, onMounted, ref, watch } from 'vue';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useAuthStore } from '@core/stores/auth';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { prepareSchedulerEmployees } from '@hr/utils/scheduler-bootstrap';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import SchedulerMiniSearch from './SchedulerMiniSearch.vue';
import SchedulerFilterOptions from './SchedulerFilterOptions.vue';

const schedulerStore = useSchedulerStore();
const calendarStore = useCalendarStore();
const authStore = useAuthStore();

const roleLabel = computed(() => authStore.user?.role?.toLowerCase() ?? '');

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
      if (!canViewAllSchedulerEmployees(roleLabel.value)) {
        return;
      }

      void schedulerStore.reloadEmployeesForSearch(
        calendarStore.currentEmployee,
        roleLabel.value,
      );
    }, 300);
  },
);

watch(
  () => schedulerStore.filterDepartmentId,
  () => {
    if (
      !schedulerStore.hasLoadedEmployees
      || !canViewAllSchedulerEmployees(roleLabel.value)
      || schedulerStore.employeesMode !== 'paginated'
    ) {
      return;
    }

    void schedulerStore.fetchEmployees(true);
  },
);

onMounted(async () => {
  if (!schedulerStore.hasLoadedEmployees || schedulerStore.employees.length === 0) {
    await prepareSchedulerEmployees({ force: true });
  }
});
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
