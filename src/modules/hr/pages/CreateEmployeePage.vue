<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Add employee</div>
      <q-btn flat color="grey-8" label="Cancel" @click="goBack" />
    </div>

    <view-employee mode="create" />
  </q-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { employeePath } from '@core/config/module-routes';
import type { Employee } from '@core/types/models';
import { useEmployeeStore } from '@hr/stores/employee-store';
import ViewEmployee from '@hr/components/employee/view/ViewEmployee.vue';

const router = useRouter();
const employeeStore = useEmployeeStore();

function emptyEmployeeDraft(): Employee {
  return {
    id: '',
    code: '',
    firstName: '',
    lastName: '',
    birthdate: '',
    address1: '',
    localityId: '',
    socialSecurityNumber: '',
    paymentMethodId: '',
    middleName: null,
    maidenName: null,
    address2: null,
    phone: null,
    email: null,
    genderId: null,
    honorificId: null,
    socialSecurityExpirationDate: null,
    taxIdentificationNumber: null,
    passportNumber: null,
    votersId: null,
    citizenshipStatusId: null,
    nationalityId: null,
    health: null,
    unionMembership: null,
    employeeStatusId: null,
    employmentStatusId: null,
    timesheetTemplateId: null,
    supervisorId: null,
  };
}

function goBack() {
  void router.push(employeePath());
}

onMounted(() => {
  employeeStore.selectedEmployee = emptyEmployeeDraft();
});

onBeforeUnmount(() => {
  if (!employeeStore.selectedEmployee?.id) {
    employeeStore.selectedEmployee = null;
  }
});
</script>
