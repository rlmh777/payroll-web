<template>
  <div class="scheduler-filter-options q-pb-md">
    <q-toggle
      :model-value="schedulerStore.hideUnscheduledUsers"
      label="Hide unscheduled users"
      dense
      @update:model-value="schedulerStore.setHideUnscheduledUsers($event)"
    />

    <q-separator class="q-my-md" />

    <ViewByEmployeeFilters
      label="View shifts by"
      show-sort-by
      @members-changed="onGroupMembersChanged"
    />

    <div v-if="schedulerStore.hasActiveFilters" class="q-mt-md">
      <q-btn
        flat
        dense
        color="primary"
        icon="filter_alt_off"
        label="Clear filters"
        class="full-width"
        @click="schedulerStore.clearFilters()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ViewByEmployeeFilters from '@hr/components/shared/ViewByEmployeeFilters.vue';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';

const schedulerStore = useSchedulerStore();

async function onGroupMembersChanged() {
  if (
    !schedulerStore.hasLoadedEmployees
    || !canViewAllSchedulerEmployees()
    || schedulerStore.employeesMode !== 'paginated'
  ) {
    return;
  }

  await schedulerStore.fetchEmployees(true);
}
</script>

<style scoped>
.scheduler-filter-options {
  padding-top: 4px;
}
</style>
