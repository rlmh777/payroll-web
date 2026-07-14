<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Assign Leave</div>

    <q-card flat bordered class="q-pa-md" style="max-width: 640px">
      <div class="text-subtitle2 q-mb-sm">Employee</div>
      <q-select
        v-model="selectedEmployeeId"
        class="q-mb-lg"
        :options="employeeOptions"
        option-value="id"
        option-label="label"
        emit-value
        map-options
        use-input
        input-debounce="300"
        outlined
        dense
        clearable
        label="Employee *"
        :loading="employeeStore.isLoading"
        :rules="[(val: string | null) => !!val || 'Employee is required']"
        @filter="filterEmployees"
        @update:model-value="onEmployeeSelected"
      />

      <div class="text-subtitle2 q-mb-sm">Leave details</div>
      <AddEmployeeLeave
        embedded
        :disabled="!selectedEmployeeId"
        @saved="onLeaveSaved"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AddEmployeeLeave from '@hr/components/employee/leave/AddEmployeeLeave.vue';
import { useEmployeeStore } from '@hr/stores/employee-store';

const employeeStore = useEmployeeStore();
const selectedEmployeeId = ref<string | null>(null);
const filterText = ref('');

const employeeOptions = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  return employeeStore.employees
    .map((employee) => ({
      id: employee.id,
      label: [employee.code, employee.firstName, employee.lastName].filter(Boolean).join(' — '),
    }))
    .filter((option) => !needle || option.label.toLowerCase().includes(needle));
});

function filterEmployees(val: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = val;
  });
}

function onEmployeeSelected(employeeId: string | null) {
  if (!employeeId) {
    employeeStore.selectedEmployee = null;
    return;
  }

  employeeStore.selectedEmployee =
    employeeStore.employees.find((item) => item.id === employeeId) ?? null;
}

function onLeaveSaved() {
  // Success notification is handled by AddEmployeeLeave.
}

onMounted(async () => {
  employeeStore.perPage = 100;
  if (!employeeStore.employees.length) {
    await employeeStore.fetchEmployees(true);
  }
});
</script>
