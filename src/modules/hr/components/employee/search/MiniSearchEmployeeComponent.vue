<template>
  <div class="employee-search-filters" data-onboarding="employees-search">
    <div class="text-subtitle2 text-weight-medium q-mb-xs">Search employees</div>
    <q-input
      v-model="searchInput"
      outlined
      dense
      clearable
      debounce="300"
      placeholder="Name, code, or internal code"
      class="q-mb-sm"
    >
      <template #prepend>
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

    <ParentDepartmentSelect
      v-model="filterDepartmentId"
      label="Department"
      clearable
      outlined
      dense
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import {
  useEmployeeStatusStore,
  type EmployeeStatus,
} from 'src/stores/employee-status-store';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';

const employeeStore = useEmployeeStore();
const employeeStatusStore = useEmployeeStatusStore();
const statusOptions = ref<EmployeeStatus[]>([]);
const searchInput = ref(employeeStore.searchName);

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

watch(searchInput, (value) => {
  const next = value ?? '';
  if (employeeStore.searchName !== next) {
    employeeStore.searchName = next;
  }
});

watch(
  () => employeeStore.searchName,
  (value) => {
    if (searchInput.value !== value) {
      searchInput.value = value;
    }
  },
);

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
