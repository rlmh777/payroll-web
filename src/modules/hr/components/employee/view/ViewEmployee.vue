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
        v-if="isTabVisible('personal')"
        name="personal"
        title="Personal Info"
        icon="person"
        :done="stepDone('personal')"
      >
        <personal-info />
      </q-step>

      <q-step
        v-if="isTabVisible('address')"
        name="address"
        title="Address"
        icon="home"
        :done="stepDone('address')"
      >
        <other-info />
      </q-step>

      <q-step
        v-if="isTabVisible('employment')"
        name="employment"
        title="Employment"
        icon="work"
        :done="stepDone('employment')"
      >
        <employment-info />
      </q-step>

      <q-step
        v-if="isTabVisible('education')"
        name="education"
        title="Education"
        icon="school"
        :done="stepDone('education')"
      >
        <q-banner v-if="isCreating" dense class="bg-grey-2 q-mb-md">
          Save the employee first to add education records.
        </q-banner>
        <employee-education-info />
      </q-step>

      <q-step
        v-if="isTabVisible('payment_details')"
        name="payment_details"
        title="Payment Details"
        icon="account_balance"
        :done="stepDone('payment_details')"
      >
        <q-banner v-if="isCreating" dense class="bg-grey-2 q-mb-md">
          Save the employee first to add bank / payment details.
        </q-banner>
        <employee-payment-details-info />
      </q-step>

      <q-step
        v-if="isTabVisible('contact')"
        name="contact"
        title="Contact Info"
        icon="contacts"
        :done="stepDone('contact')"
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
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { employeePath } from '@core/config/module-routes';
import type { Employee } from '@core/types/models';
import type { EmployeeFormTabKey } from '@core/types/employee-form-access';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
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
const route = useRoute();
const router = useRouter();
const employeeStore = useEmployeeStore();
const {
  isTabVisible,
  isFieldVisible,
  canWriteField,
  visibleStepperTabs,
} = useEmployeeFormAccess();

const step = ref<EmployeeFormTabKey>('personal');
const isSaving = ref(false);

const isCreating = computed(() => !employeeStore.selectedEmployee?.id);

watch(visibleStepperTabs, (tabs) => {
  if (tabs.length > 0 && !tabs.includes(step.value)) {
    step.value = tabs[0]!;
  }
}, { immediate: true });

function stepDone(tab: EmployeeFormTabKey): boolean {
  const tabs = visibleStepperTabs.value;
  const currentIndex = tabs.indexOf(step.value);
  const tabIndex = tabs.indexOf(tab);
  return tabIndex >= 0 && currentIndex > tabIndex;
}

function cancelCreate() {
  void router.push(employeePath(undefined, route.path));
}

function requiredCreateFields(employee: Employee): string | null {
  if (canWriteField('firstName', true) && !employee.firstName?.trim()) {
    return 'First name is required.';
  }
  if (canWriteField('lastName', true) && !employee.lastName?.trim()) {
    return 'Last name is required.';
  }
  if (canWriteField('birthdate', true) && !employee.birthdate) {
    return 'Birthdate is required.';
  }
  if (canWriteField('genderId', true) && employee.genderId == null) {
    return 'Gender is required.';
  }
  if (canWriteField('address1', true) && !employee.address1?.trim()) {
    return 'Address is required.';
  }
  if (canWriteField('localityId', true) && !employee.localityId) {
    return 'Locality is required.';
  }
  if (canWriteField('socialSecurityNumber', true) && !employee.socialSecurityNumber?.trim()) {
    return 'Social security number is required.';
  }
  if (
    isFieldVisible('paymentMethodId')
    && canWriteField('paymentMethodId', true)
    && (employee.paymentMethodId == null || employee.paymentMethodId === '')
  ) {
    return 'Payment method is required.';
  }
  return null;
}

function buildCreatePayload(employee: Employee): Partial<Employee> {
  const payload: Partial<Employee> = {};

  const assignIfWritable = <K extends keyof Employee>(key: K, value: Employee[K] | undefined) => {
    if (!canWriteField(String(key), true)) {
      return;
    }
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  };

  if (canWriteField('firstName', true)) payload.firstName = employee.firstName.trim();
  if (canWriteField('lastName', true)) payload.lastName = employee.lastName.trim();
  if (canWriteField('birthdate', true)) payload.birthdate = employee.birthdate;
  if (canWriteField('address1', true)) payload.address1 = employee.address1.trim();
  if (canWriteField('localityId', true)) payload.localityId = employee.localityId;
  if (canWriteField('socialSecurityNumber', true)) {
    payload.socialSecurityNumber = employee.socialSecurityNumber.trim();
  }
  if (canWriteField('paymentMethodId', true) && isFieldVisible('paymentMethodId')) {
    payload.paymentMethodId = employee.paymentMethodId;
  }

  if (employee.genderId != null) assignIfWritable('genderId', employee.genderId);
  if (employee.code?.trim()) assignIfWritable('code', employee.code.trim());
  if (employee.honorificId != null) assignIfWritable('honorificId', employee.honorificId);
  if (employee.middleName?.trim()) assignIfWritable('middleName', employee.middleName.trim());
  if (employee.maidenName?.trim()) assignIfWritable('maidenName', employee.maidenName.trim());
  if (employee.address2?.trim()) assignIfWritable('address2', employee.address2.trim());
  if (employee.phone?.trim()) assignIfWritable('phone', employee.phone.trim());
  if (employee.email?.trim()) assignIfWritable('email', employee.email.trim());
  if (employee.socialSecurityExpirationDate) {
    assignIfWritable('socialSecurityExpirationDate', employee.socialSecurityExpirationDate);
  }
  if (employee.passportNumber?.trim()) {
    assignIfWritable('passportNumber', employee.passportNumber.trim());
  }
  if (employee.votersId?.trim()) assignIfWritable('votersId', employee.votersId.trim());
  if (employee.taxIdentificationNumber?.trim()) {
    assignIfWritable('taxIdentificationNumber', employee.taxIdentificationNumber.trim());
  }
  if (employee.nationalityId) assignIfWritable('nationalityId', employee.nationalityId);
  if (employee.citizenshipStatusId != null) {
    assignIfWritable('citizenshipStatusId', employee.citizenshipStatusId);
  }
  if (employee.health?.trim()) assignIfWritable('health', employee.health.trim());
  if (employee.unionMembership?.trim()) {
    assignIfWritable('unionMembership', employee.unionMembership.trim());
  }
  if (employee.employeeStatusId != null) {
    assignIfWritable('employeeStatusId', employee.employeeStatusId);
  }
  if (employee.employmentStatusId != null) {
    assignIfWritable('employmentStatusId', employee.employmentStatusId);
  }
  if (employee.timesheetTemplateId) {
    assignIfWritable('timesheetTemplateId', employee.timesheetTemplateId);
  }
  if (employee.supervisorId) assignIfWritable('supervisorId', employee.supervisorId);

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
      await router.replace(employeePath(created.id, route.path));
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
