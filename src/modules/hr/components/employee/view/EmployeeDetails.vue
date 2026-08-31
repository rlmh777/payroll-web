<template>
  <q-card class="q-gutter-y-md q-mt-sm">
    <q-tabs v-model="tab" dense no-caps inline-label class="bg-primary text-white shadow-4" align="left">
      <q-tab name="allowances" icon="movie" label="Default Other Payments" />
      <q-tab name="deductions" icon="movie" label="Default Deductions" />
      <!-- <q-tab name="historical-deductions" icon="history" label="Historical Deductions" /> -->
      <q-tab name="ss-benefit" icon="health_and_safety" label="SS Benefit" />
      <!-- <q-tab name="qualifications" icon="mail" label="Qualifications" /> -->
      <q-tab name="contracts" icon="movie" label="Contracts" />
      <q-tab name="compensation" icon="payments" label="Compensation" />
      <q-tab name="documents" icon="description" label="Documents" />
      <q-tab name="incidents" icon="report_problem" label="Incidents" />
      <q-tab name="time-travel" icon="history" label="Time Travel" />
    </q-tabs>

    <q-separator class="q-my-sm" />

    <q-tab-panels v-model="tab" animated class="q-mt-none">
      <q-tab-panel name="allowances">
        <manage-employee-default-allowances />
      </q-tab-panel>

      <q-tab-panel name="deductions">
        <manage-employee-default-deductions />
      </q-tab-panel>

      <q-tab-panel name="historical-deductions">
        <manage-historical-employee-deductions />
      </q-tab-panel>

      <q-tab-panel name="ss-benefit">
        <manage-employee-ss-benefit
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="contracts">
        <manage-employment-details
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="compensation">
        <manage-employee-compensation
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="documents">
        <manage-employee-documents
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="incidents">
        <manage-employee-incidents
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="time-travel">
        <employee-time-travel
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useEmployeeStore, type EmployeeDetailsTab } from '@hr/stores/employee-store';
import ManageEmployeeDefaultAllowances from '@payroll/components/employee/default-allowance/ManageEmployeeDefaultAllowances.vue';
import ManageEmployeeDefaultDeductions from '@payroll/components/employee/default-deduction/ManageEmployeeDefaultDeductions.vue';
import ManageHistoricalEmployeeDeductions from '@payroll/components/employee/historical-deduction/ManageHistoricalEmployeeDeductions.vue';
import ManageEmployeeSsBenefit from '@payroll/components/employee/ss-benefit/ManageEmployeeSsBenefit.vue';
import ManageEmploymentDetails from '../employment-detail/ManageEmploymentDetails.vue';
import ManageEmployeeCompensation from '@payroll/components/employee/compensation/ManageEmployeeCompensation.vue';
import ManageEmployeeDocuments from '../document/ManageEmployeeDocuments.vue';
import ManageEmployeeIncidents from '../incident/ManageEmployeeIncidents.vue';
import EmployeeTimeTravel from '../time-travel/EmployeeTimeTravel.vue';

const employeeStore = useEmployeeStore();
const { activeDetailsTab } = storeToRefs(employeeStore);

const validTabs = new Set<EmployeeDetailsTab>([
  'allowances',
  'deductions',
  'historical-deductions',
  'ss-benefit',
  'contracts',
  'compensation',
  'documents',
  'incidents',
  'time-travel',
]);

const tab = computed({
  get: () => (
    validTabs.has(activeDetailsTab.value)
      ? activeDetailsTab.value
      : 'allowances'
  ),
  set: (value: string) => {
    if (validTabs.has(value as EmployeeDetailsTab)) {
      activeDetailsTab.value = value as EmployeeDetailsTab;
    }
  },
});
</script>
