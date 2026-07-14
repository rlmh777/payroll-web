<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Request Leave</div>

    <q-banner v-if="loadingEmployee" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      Loading your employee profile…
    </q-banner>

    <q-banner v-else-if="!employee" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      No employee record is linked to your user account, so you cannot request leave.
    </q-banner>

    <q-card v-else flat bordered class="q-pa-md" style="max-width: 640px">
      <div class="text-subtitle2 q-mb-xs">Employee</div>
      <div class="text-body1 q-mb-lg">
        {{ employeeDisplayName }}
        <span v-if="employee.code" class="text-grey-7"> ({{ employee.code }})</span>
      </div>

      <div class="text-subtitle2 q-mb-sm">Leave details</div>
      <AddEmployeeLeave
        embedded
        submit-label="Request leave"
        @saved="onLeaveSaved"
      />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AddEmployeeLeave from '@hr/components/employee/leave/AddEmployeeLeave.vue';
import { useAuthStore } from '@core/stores/auth';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useEmployeeStore } from '@hr/stores/employee-store';

const authStore = useAuthStore();
const calendarStore = useCalendarStore();
const employeeStore = useEmployeeStore();

const loadingEmployee = ref(true);

const employee = computed(() => calendarStore.currentEmployee ?? employeeStore.selectedEmployee);

const employeeDisplayName = computed(() => {
  const current = employee.value;
  if (!current) {
    return 'Employee';
  }

  const lastName = String(current.lastName ?? '').trim();
  const firstName = String(current.firstName ?? '').trim();
  const person =
    'person' in current && current.person
      ? current.person
      : null;
  const middleName = String(person?.middleName ?? '').trim();

  if (lastName) {
    const given = [firstName, middleName].filter(Boolean).join(' ');
    return given ? `${lastName}, ${given}` : lastName;
  }

  return [firstName, middleName].filter(Boolean).join(' ') || 'Employee';
});

function onLeaveSaved() {
  // Success notification is handled by AddEmployeeLeave.
}

onMounted(async () => {
  loadingEmployee.value = true;
  try {
    authStore.checkAuth();
    await authStore.ensureUser();

    if (authStore.user?.id) {
      await calendarStore.fetchEmployeeByUserId(String(authStore.user.id));
    }

    if (calendarStore.currentEmployee) {
      employeeStore.selectedEmployee = calendarStore.currentEmployee as typeof employeeStore.selectedEmployee;
    }
  } finally {
    loadingEmployee.value = false;
  }
});
</script>
