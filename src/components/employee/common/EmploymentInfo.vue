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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import EmploymentStatusSelect from '../../employment-status/EmploymentStatusSelect.vue';
import EmployeeStatusSelect from '../../employee-status/EmployeeStatusSelect.vue';
import TimesheetTemplateSelect from '../../settings/department/TimesheetTemplateSelect.vue';

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
</script>
