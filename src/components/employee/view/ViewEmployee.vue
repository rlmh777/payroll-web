<template>
    <div>
      <q-stepper
        v-model="step"
        ref="stepper"
        color="primary"
        header-nav
        animated
      >
        <q-step
          :name="1"
          title="Personal Info"
          icon="person"
          :done="step > 1"
        >
          <personal-info />
        </q-step>
  
        <q-step
          :name="2"
          title="Address"
          icon="home"
          :done="step > 2"
        >
          <other-info />
        </q-step>

        <q-step
          :name="3"
          title="Employment"
          icon="work"
          :done="step > 3"
        >
          <employment-info />
        </q-step>

        <q-step
          :name="4"
          title="Education"
          icon="school"
          :done="step > 4"
        >
          <employee-education-info />
        </q-step>

        <q-step
          :name="5"
          title="Payment Details"
          icon="account_balance"
          :done="step > 5"
        >
          <employee-payment-details-info />
        </q-step>

        <q-step
          :name="6"
          title="Contact Info"
          icon="contacts"
          :done="step > 6"
        >
          <employee-contact-info />
        </q-step>
        <!-- <template v-slot:navigation>
          <q-stepper-navigation>
            <q-btn @click="next()" color="primary" :label="step === 3 ? 'Finish' : 'Continue'" />
            <q-btn v-if="step > 1" flat color="primary" @click="previous()" label="Back" class="q-ml-sm" />
          </q-stepper-navigation>
        </template> -->
      </q-stepper>

      <div class="row justify-end q-mt-md q-gutter-sm">
        <q-btn
          color="primary"
          label="Save changes"
          :loading="isSaving"
          @click="saveEmployee"
        />
      </div>

      <employee-details />
    </div>
  </template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeStore } from 'src/stores/employee-store';
import PersonalInfo from '../common/PersonalInfo.vue';
import OtherInfo from '../common/OtherInfo.vue';
import EmploymentInfo from '../common/EmploymentInfo.vue';
import EmployeeEducationInfo from '../education/EmployeeEducationInfo.vue';
import EmployeePaymentDetailsInfo from '../payment-details/EmployeePaymentDetailsInfo.vue';
import EmployeeContactInfo from '../contact/EmployeeContactInfo.vue';
import EmployeeDetails from './EmployeeDetails.vue';

const $q = useQuasar();
const employeeStore = useEmployeeStore();
const step = ref(1);
const isSaving = ref(false);

async function saveEmployee() {
  if (!employeeStore.selectedEmployee?.id) {
    return;
  }

  isSaving.value = true;

  try {
    await employeeStore.updateEmployee(employeeStore.selectedEmployee.id, employeeStore.selectedEmployee);
    $q.notify({ color: 'positive', position: 'top', message: 'Employee saved.' });
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to save employee.',
    });
  } finally {
    isSaving.value = false;
  }
}
</script>