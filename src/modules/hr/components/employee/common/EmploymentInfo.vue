<template>
  <div>
    <div class="row q-gutter-x-lg q-gutter-y-md">
      <div class="col-12 col-md-4">
        <EmploymentStatusSelect
          v-model="employmentStatusId"
          label="Employment status"
          show-add-new
          show-edit
        />
      </div>
      <div class="col-12 col-md-4">
        <EmployeeStatusSelect
          v-model="employeeStatusId"
          label="Employee status"
          show-add-new
          show-edit
        />
      </div>
      <div class="col-12 col-md-4">
        <TimesheetTemplateSelect
          v-model="timesheetTemplateId"
          label="Default timesheet template"
          clearable
          show-add-new
          show-edit
        />
      </div>
      <div class="col-12 col-md-4">
        <EmployeeSelect
          v-model="supervisorId"
          label="Supervisor"
          clearable
          :exclude-employee-id="employeeStore.selectedEmployee?.id || null"
        />
      </div>
      <div class="col-12 col-md-4">
        <PaymentMethodSelect
          v-model="paymentMethodId"
          label="Payment method"
          :rules="[(val: number | string | null | undefined) => (val != null && val !== '') || 'Payment method is required']"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '@hr/stores/employee-store';
import EmploymentStatusSelect from '@hr/components/shared/employment-status/EmploymentStatusSelect.vue';
import EmployeeStatusSelect from '@hr/components/shared/employee-status/EmployeeStatusSelect.vue';
import TimesheetTemplateSelect from '@hr/components/settings/department/TimesheetTemplateSelect.vue';
import PaymentMethodSelect from '@hr/components/employee/common/PaymentMethodSelect.vue';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';

const employeeStore = useEmployeeStore();

const employmentStatusId = computed({
  get: () => employeeStore.selectedEmployee?.employmentStatusId ?? null,
  set: (value: number | null) => {
    if (employeeStore.selectedEmployee) {
      employeeStore.selectedEmployee.employmentStatusId = value;
    }
  },
});

const employeeStatusId = computed({
  get: () => employeeStore.selectedEmployee?.employeeStatusId ?? null,
  set: (value: number | null) => {
    if (employeeStore.selectedEmployee) {
      employeeStore.selectedEmployee.employeeStatusId = value;
    }
  },
});

const timesheetTemplateId = computed({
  get: () => employeeStore.selectedEmployee?.timesheetTemplateId ?? null,
  set: (value: string | null) => {
    if (employeeStore.selectedEmployee) {
      employeeStore.selectedEmployee.timesheetTemplateId = value;
    }
  },
});

const supervisorId = computed({
  get: () => employeeStore.selectedEmployee?.supervisorId ?? null,
  set: (value: string | null) => {
    if (employeeStore.selectedEmployee) {
      employeeStore.selectedEmployee.supervisorId = value;
    }
  },
});

const paymentMethodId = computed({
  get: () => employeeStore.selectedEmployee?.paymentMethodId || null,
  set: (value: number | string | null) => {
    if (employeeStore.selectedEmployee) {
      employeeStore.selectedEmployee.paymentMethodId = value != null && value !== ''
        ? String(value)
        : '';
    }
  },
});
</script>
