<template>
  <div class="scheduler-filter-options q-pb-md">
    <div class="text-subtitle2 text-weight-medium q-mb-sm">View shifts by</div>
    <q-option-group
      :model-value="schedulerStore.viewBy"
      :options="viewByOptions"
      color="primary"
      dense
      @update:model-value="schedulerStore.setViewBy($event)"
    />

    <div v-if="schedulerStore.viewBy === 'users'" class="q-mt-md">
      <q-select
        :model-value="schedulerStore.sortBy"
        :options="sortByOptions"
        label="Sort by"
        outlined
        dense
        emit-value
        map-options
        @update:model-value="schedulerStore.setSortBy($event)"
      />
    </div>

    <div class="q-mt-md">
      <DepartmentSelect
        :model-value="schedulerStore.filterDepartmentId"
        label="Department"
        clearable
        @update:model-value="schedulerStore.setFilterDepartmentId($event)"
      />
    </div>

    <q-separator class="q-my-md" />

    <q-toggle
      :model-value="schedulerStore.hideUnscheduledUsers"
      label="Hide unscheduled users"
      dense
      @update:model-value="schedulerStore.setHideUnscheduledUsers($event)"
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
import DepartmentSelect from 'src/components/department/DepartmentSelect.vue';
import { useSchedulerStore } from 'src/stores/scheduler-store';

const schedulerStore = useSchedulerStore();

const viewByOptions = [
  { label: 'Users', value: 'users' as const },
  { label: 'Department', value: 'department' as const },
];

const sortByOptions = [
  { label: 'First name', value: 'firstName' as const },
  { label: 'Last name', value: 'lastName' as const },
];
</script>

<style scoped>
.scheduler-filter-options {
  padding-top: 4px;
}
</style>
