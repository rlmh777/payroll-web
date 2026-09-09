<template>
  <div class="view-by-filters">
    <div class="view-by-filters__heading">
      <div class="text-subtitle2 text-weight-medium view-by-filters__label">{{ label }}</div>
      <q-option-group
        class="view-by-filters__options"
        :model-value="schedulerStore.viewBy"
        :options="viewByOptions"
        color="primary"
        dense
        @update:model-value="schedulerStore.setViewBy($event)"
      />
    </div>

    <div v-if="schedulerStore.viewBy === 'users' && showSortBy" class="q-mt-md">
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

    <div v-if="schedulerStore.viewBy === 'users' && $slots['users-extra']" class="q-mt-md">
      <slot name="users-extra" />
    </div>

    <template v-if="schedulerStore.viewBy === 'group'">
      <div class="q-mt-md">
        <EmployeeGroupSelect
          :model-value="schedulerStore.filterEmployeeGroupId"
          label="Employee group"
          @update:model-value="schedulerStore.setFilterEmployeeGroupId($event)"
        />
      </div>

      <div v-if="schedulerStore.filterEmployeeGroupId" class="q-mt-md">
        <EmployeeGroupMembersPanel
          :group-id="schedulerStore.filterEmployeeGroupId"
          @members-changed="$emit('members-changed')"
        />
      </div>
    </template>

    <template v-if="schedulerStore.viewBy === 'department'">
      <div class="q-mt-md">
        <DepartmentSelect
          :model-value="schedulerStore.filterDepartmentId"
          label="Department"
          clearable
          @update:model-value="schedulerStore.setFilterDepartmentId($event)"
        />
      </div>

      <div v-if="schedulerStore.filterDepartmentId != null" class="q-mt-md">
        <DepartmentEmployeesPanel :department-id="schedulerStore.filterDepartmentId" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import DepartmentEmployeesPanel from '@hr/components/department/DepartmentEmployeesPanel.vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import EmployeeGroupMembersPanel from '@hr/components/employee-group/EmployeeGroupMembersPanel.vue';
import EmployeeGroupSelect from '@hr/components/employee-group/EmployeeGroupSelect.vue';
import { useSchedulerStore } from '@hr/stores/scheduler-store';

withDefaults(defineProps<{
  label?: string;
  showSortBy?: boolean;
}>(), {
  label: 'View by',
  showSortBy: false,
});

defineEmits<{
  'members-changed': [];
}>();

const schedulerStore = useSchedulerStore();

const viewByOptions = [
  { label: 'Users', value: 'users' as const },
  { label: 'Department', value: 'department' as const },
  { label: 'Group', value: 'group' as const },
];

const sortByOptions = [
  { label: 'First name', value: 'firstName' as const },
  { label: 'Last name', value: 'lastName' as const },
];
</script>

<style scoped>
.view-by-filters__heading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-by-filters__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.view-by-filters__options :deep(.q-radio) {
  margin: 0;
}
</style>
