<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-sm">My profile</div>
    <div class="text-body2 text-grey-7 q-mb-md">
      Your employee record is shown here for reference. Use Request update to submit address, phone, or email changes for approval.
    </div>

    <q-banner v-if="isLoading" class="bg-grey-2 text-grey-8" rounded>
      Loading your employee profile…
    </q-banner>

    <q-banner v-else-if="error" class="bg-negative text-white" rounded>
      {{ error }}
    </q-banner>

    <q-banner v-else-if="!employee" class="bg-grey-2 text-grey-8" rounded>
      No employee record is linked to your user account.
    </q-banner>

    <template v-else>
      <q-tabs v-model="tab" dense no-caps inline-label class="bg-primary text-white shadow-2" align="left">
        <q-tab name="profile" icon="badge" label="Profile" />
        <q-tab
          name="request"
          icon="edit_location_alt"
          label="Request update"
          :alert="hasPendingRequest"
        />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="q-mt-sm">
        <q-tab-panel name="profile" class="q-pa-none">
          <view-employee readonly />
        </q-tab-panel>
        <q-tab-panel name="request" class="q-pa-none">
          <profile-change-request-card :employee="employee" @updated="reload" />
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ViewEmployee from '@hr/components/employee/view/ViewEmployee.vue';
import ProfileChangeRequestCard from '@employee/components/ProfileChangeRequestCard.vue';
import { provideReadonlyEmployeeProfile } from '@core/composables/useEmployeeFormAccess';
import { useEmployeeStore } from '@hr/stores/employee-store';
import type { Employee } from '@core/types/models';

provideReadonlyEmployeeProfile();

const employeeStore = useEmployeeStore();
const employee = ref<Employee | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const tab = ref<'profile' | 'request'>('profile');
const hasPendingRequest = computed(() => Boolean(employee.value?.pendingProfileChange));

async function reload() {
  employee.value = await employeeStore.fetchMyEmployee();
}

onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  try {
    employee.value = await employeeStore.fetchMyEmployee();
  } catch (err) {
    employee.value = null;
    error.value = err instanceof Error ? err.message : 'Failed to load your profile.';
  } finally {
    isLoading.value = false;
  }
});
</script>
