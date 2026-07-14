<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">My Leave Usage</div>

    <q-banner v-if="!employeeId" class="bg-grey-2 text-grey-8" rounded>
      No employee record is linked to your user account, so leave balances cannot be shown.
    </q-banner>

    <EmployeeLeaveBalances v-else :employee-id="employeeId" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import EmployeeLeaveBalances from '@hr/components/employee/leave/EmployeeLeaveBalances.vue';
import { useAuthStore } from '@core/stores/auth';
import { useCalendarStore } from '@hr/stores/calendar-store';

const authStore = useAuthStore();
const calendarStore = useCalendarStore();

const employeeId = computed(() => calendarStore.currentEmployee?.id ?? null);

async function loadCurrentEmployee() {
  authStore.checkAuth();
  await authStore.ensureUser();

  if (authStore.user?.id) {
    await calendarStore.fetchEmployeeByUserId(String(authStore.user.id));
  }
}

onMounted(() => {
  void loadCurrentEmployee();
});
</script>
