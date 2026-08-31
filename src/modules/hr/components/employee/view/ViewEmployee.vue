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
        <q-banner v-if="isCreating" dense class="bg-grey-2 q-mb-md">
          Save the employee first to add education records.
        </q-banner>
        <employee-education-info />
      </q-step>

      <q-step
        :name="5"
        title="Payment Details"
        icon="account_balance"
        :done="step > 5"
      >
        <q-banner v-if="isCreating" dense class="bg-grey-2 q-mb-md">
          Save the employee first to add bank / payment details.
        </q-banner>
        <employee-payment-details-info />
      </q-step>

      <q-step
        :name="6"
        title="Contact Info"
        icon="contacts"
        :done="step > 6"
      >
        <q-banner v-if="isCreating" dense class="bg-grey-2 q-mb-md">
          Save the employee first to add contacts.
        </q-banner>
        <employee-contact-info />
      </q-step>
    </q-stepper>

    <div class="row justify-end q-mt-md q-gutter-sm">
      <q-btn
        v-if="isCreating"
        flat
        color="grey-8"
        label="Cancel"
        :disable="isSaving"
        @click="cancelCreate"
      />
      <q-btn
        color="primary"
        :label="isCreating ? 'Create employee' : 'Save changes'"
        :loading="isSaving"
        @click="saveEmployee"
      />
    </div>

    <employee-details v-if="!isCreating" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { employeePath } from '@core/config/module-routes';
import type { Employee } from '@core/types/models';
import { useEmployeeStore } from '@hr/stores/employee-store';
import PersonalInfo from '../common/PersonalInfo.vue';
import OtherInfo from '../common/OtherInfo.vue';
import EmploymentInfo from '../common/EmploymentInfo.vue';
import EmployeeEducationInfo from '../education/EmployeeEducationInfo.vue';
import EmployeePaymentDetailsInfo from '@payroll/components/employee/payment-details/EmployeePaymentDetailsInfo.vue';
import EmployeeContactInfo from '../contact/EmployeeContactInfo.vue';
import EmployeeDetails from './EmployeeDetails.vue';

withDefaults(defineProps<{
  mode?: 'create' | 'edit';
}>(), {
  mode: 'edit',
});

const $q = useQuasar();
const router = useRouter();
const employeeStore = useEmployeeStore();
const step = ref(1);
const isSaving = ref(false);

const isCreating = computed(() => !employeeStore.selectedEmployee?.id);

function cancelCreate() {
  void router.push(employeePath());
}

function requiredCreateFields(employee: Employee): string | null {
  if (!employee.firstName?.trim()) return 'First name is required.';
  if (!employee.lastName?.trim()) return 'Last name is required.';
  if (!employee.birthdate) return 'Birthdate is required.';
  if (employee.genderId == null) return 'Gender is required.';
  if (!employee.address1?.trim()) return 'Address is required.';
  if (!employee.localityId) return 'Locality is required.';
  if (!employee.socialSecurityNumber?.trim()) return 'Social security number is required.';
  if (employee.paymentMethodId == null || employee.paymentMethodId === '') {
    return 'Payment method is required.';
  }
  return null;
}

function buildCreatePayload(employee: Employee): Partial<Employee> {
  const payload: Partial<Employee> = {
    firstName: employee.firstName.trim(),
    lastName: employee.lastName.trim(),
    birthdate: employee.birthdate,
    address1: employee.address1.trim(),
    localityId: employee.localityId,
    socialSecurityNumber: employee.socialSecurityNumber.trim(),
    paymentMethodId: employee.paymentMethodId,
  };

  if (employee.genderId != null) {
    payload.genderId = employee.genderId;
  }

  if (employee.code?.trim()) payload.code = employee.code.trim();
  if (employee.honorificId != null) payload.honorificId = employee.honorificId;
  if (employee.middleName?.trim()) payload.middleName = employee.middleName.trim();
  if (employee.maidenName?.trim()) payload.maidenName = employee.maidenName.trim();
  if (employee.address2?.trim()) payload.address2 = employee.address2.trim();
  if (employee.phone?.trim()) payload.phone = employee.phone.trim();
  if (employee.email?.trim()) payload.email = employee.email.trim();
  if (employee.socialSecurityExpirationDate) {
    payload.socialSecurityExpirationDate = employee.socialSecurityExpirationDate;
  }
  if (employee.passportNumber?.trim()) payload.passportNumber = employee.passportNumber.trim();
  if (employee.votersId?.trim()) payload.votersId = employee.votersId.trim();
  if (employee.taxIdentificationNumber?.trim()) {
    payload.taxIdentificationNumber = employee.taxIdentificationNumber.trim();
  }
  if (employee.nationalityId) payload.nationalityId = employee.nationalityId;
  if (employee.citizenshipStatusId != null) {
    payload.citizenshipStatusId = employee.citizenshipStatusId;
  }
  if (employee.health?.trim()) payload.health = employee.health.trim();
  if (employee.unionMembership?.trim()) payload.unionMembership = employee.unionMembership.trim();
  if (employee.employeeStatusId != null) payload.employeeStatusId = employee.employeeStatusId;
  if (employee.employmentStatusId != null) {
    payload.employmentStatusId = employee.employmentStatusId;
  }
  if (employee.timesheetTemplateId) {
    payload.timesheetTemplateId = employee.timesheetTemplateId;
  }
  if (employee.supervisorId) {
    payload.supervisorId = employee.supervisorId;
  }

  return payload;
}

async function saveEmployee() {
  const employee = employeeStore.selectedEmployee;
  if (!employee) {
    return;
  }

  if (isCreating.value) {
    const validationError = requiredCreateFields(employee);
    if (validationError) {
      $q.notify({ color: 'negative', position: 'top', message: validationError });
      return;
    }
  } else if (!employee.id) {
    return;
  }

  isSaving.value = true;

  try {
    if (isCreating.value) {
      const created = await employeeStore.createEmployee(buildCreatePayload(employee));
      $q.notify({ color: 'positive', position: 'top', message: 'Employee created successfully.' });
      await router.replace(employeePath(created.id));
      return;
    }

    await employeeStore.updateEmployee(employee.id, employee);
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
