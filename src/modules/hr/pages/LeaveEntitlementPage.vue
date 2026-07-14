<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Leave Entitlement</div>

    <q-banner v-if="accessChecked && !canAccess" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      Leave entitlement is available to supervisors with subordinates, and to HR / super admins.
    </q-banner>

    <template v-else>
      <q-card flat bordered class="q-pa-md q-mb-md">
        <div class="text-subtitle2 q-mb-sm">Employee</div>
        <q-select
          v-model="selectedEmployeeId"
          :options="employeeOptions"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          use-input
          input-debounce="250"
          outlined
          dense
          clearable
          label="Select employee"
          :loading="loadingEmployees"
          style="max-width: 420px"
          @filter="filterEmployees"
        />
        <p class="text-caption text-grey-7 q-mt-sm q-mb-none">
          {{
            leaveStore.teamAccess?.isLeaveAdmin
              ? 'As an administrator you can view leave usage for any employee.'
              : 'You can view leave usage for your subordinates.'
          }}
        </p>
      </q-card>

      <q-banner v-if="!selectedEmployeeId" class="bg-grey-2 text-grey-8" rounded>
        Select an employee to load leave usage and balances.
      </q-banner>

      <EmployeeLeaveBalances v-else :employee-id="selectedEmployeeId" />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EmployeeLeaveBalances from '@hr/components/employee/leave/EmployeeLeaveBalances.vue';
import { useEmployeeLeaveStore } from '@hr/stores/employee-leave-store';
import { useLeaveBalanceStore } from '@hr/stores/leave-balance-store';

type SelectableEmployee = {
  id: string;
  name: string;
  code?: string | null;
};

const leaveStore = useEmployeeLeaveStore();
const balanceStore = useLeaveBalanceStore();

const accessChecked = ref(false);
const loadingEmployees = ref(false);
const selectedEmployeeId = ref<string | null>(null);
const employees = ref<SelectableEmployee[]>([]);
const filterText = ref('');

const canAccess = computed(() => Boolean(leaveStore.teamAccess?.canAccess));

const employeeOptions = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  return employees.value.filter((employee) => {
    if (!needle) return true;
    return (
      employee.name.toLowerCase().includes(needle) ||
      (employee.code ?? '').toLowerCase().includes(needle)
    );
  });
});

function filterEmployees(val: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = val;
  });
}

async function loadSelectableEmployees() {
  loadingEmployees.value = true;
  try {
    employees.value = await balanceStore.fetchSelectableEmployees();
    if (!selectedEmployeeId.value && employees.value.length === 1) {
      selectedEmployeeId.value = employees.value[0]?.id ?? null;
    }
  } finally {
    loadingEmployees.value = false;
  }
}

onMounted(async () => {
  await leaveStore.fetchTeamAccess();
  accessChecked.value = true;
  if (leaveStore.teamAccess?.canAccess) {
    await loadSelectableEmployees();
  }
});
</script>
