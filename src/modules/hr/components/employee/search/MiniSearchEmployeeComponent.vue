<template>
  <div class="q-my-md employee-search-filters">
    <q-input
      v-model="searchName"
      outlined
      dense
      placeholder="Search by name"
      class="q-mb-sm"
    >
      <template #append>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-select
      v-model="filterEmployeeStatusIds"
      class="q-mb-sm"
      :options="statusOptions"
      option-value="id"
      option-label="name"
      emit-value
      map-options
      multiple
      use-chips
      use-input
      input-debounce="200"
      outlined
      dense
      clearable
      label="Employee status"
      :loading="employeeStatusStore.isLoadingEmployeeStatuses"
      @filter="filterStatuses"
    />

    <DepartmentSelect
      v-model="filterDepartmentId"
      label="Department"
      clearable
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import {
  useEmployeeStatusStore,
  type EmployeeStatus,
} from 'src/stores/employee-status-store';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';

const employeeStore = useEmployeeStore();
const employeeStatusStore = useEmployeeStatusStore();
const statusOptions = ref<EmployeeStatus[]>([]);

const searchName = computed({
  get: () => employeeStore.searchName,
  set: (value: string) => {
    employeeStore.searchName = value;
  },
}) as Ref<string>;

const filterEmployeeStatusIds = computed({
  get: () => employeeStore.filterEmployeeStatusIds,
  set: (value: number[] | null) => {
    employeeStore.filterEmployeeStatusIds = Array.isArray(value) ? value : [];
  },
});

const filterDepartmentId = computed({
  get: () => employeeStore.filterDepartmentId,
  set: (value: number | null) => {
    employeeStore.filterDepartmentId = value;
  },
});

function filterStatuses(val: string, update: (fn: () => void) => void) {
  update(() => {
    const search = val?.trim().toLowerCase() ?? '';
    statusOptions.value = search
      ? employeeStatusStore.employeeStatuses.filter((item) =>
          item.name.toLowerCase().includes(search),
        )
      : [...employeeStatusStore.employeeStatuses];
  });
}

onMounted(async () => {
  if (employeeStatusStore.employeeStatuses.length === 0) {
    await employeeStatusStore.fetchEmployeeStatuses();
  }
  statusOptions.value = [...employeeStatusStore.employeeStatuses];
});
</script>

<style scoped>
.employee-search-filters {
  padding: 0 4px;
}
</style>
