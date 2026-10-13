<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Assign Leave</div>

    <q-card flat bordered class="q-pa-md assign-leave-card">
      <div class="text-subtitle2 q-mb-sm">Employee</div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-sm-8 col-md-6">
          <q-select
            v-model="selectedEmployeeId"
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
        </div>
      </div>

      <template v-if="selectedEmployeeId">
        <div class="text-subtitle2 q-mb-sm">Leave details</div>
        <AddEmployeeLeave
          :key="selectedEmployeeId"
          embedded
          assigned
          wide
          leave-type-picker="cards"
          :show-leave-type-actions="false"
          @saved="onLeaveSaved"
        />
      </template>
      <q-banner v-else rounded class="bg-grey-2 text-grey-8">
        Select an employee to choose a leave type and enter leave details.
      </q-banner>
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

<style scoped>
.assign-leave-card {
  max-width: 1100px;
}
</style>
