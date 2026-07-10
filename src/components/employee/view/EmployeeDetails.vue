<template>
  <q-card class="q-gutter-y-md q-mt-sm">
    <q-tabs v-model="tab" dense no-caps inline-label class="bg-primary text-white shadow-4" align="left">
      <!-- leaves, loans, allowances, 
        deductions, contacts, qualifications,
        employment history, employment details -->
      <q-tab name="attendance" icon="event_available" label="Attendance" />
      <q-tab name="leaves" icon="alarm" label="Leaves" />
      <q-tab name="allowances" icon="movie" label="Default Allowances" />
      <q-tab name="deductions" icon="movie" label="Default Deductions" />
      <!-- <q-tab name="historical-deductions" icon="history" label="Historical Deductions" /> -->
      <q-tab name="ss-benefit" icon="health_and_safety" label="SS Benefit" />
      <!-- <q-tab name="qualifications" icon="mail" label="Qualifications" /> -->
      <q-tab name="contracts" icon="movie" label="Contracts" />
      <q-tab name="compensation" icon="payments" label="Compensation" />
      <q-tab name="documents" icon="description" label="Documents" />
    </q-tabs>

    <q-separator class="q-my-sm" />
    
    <q-tab-panels v-model="tab" animated class="q-mt-none">
      <q-tab-panel name="attendance">
        <employee-attendance-tab
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
      </q-tab-panel>

      <q-tab-panel name="leaves">
        <employee-leave-balances
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
        />
        <employee-leave-list />
      </q-tab-panel>

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
    </q-tab-panels>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useEmployeeStore, type EmployeeDetailsTab } from 'src/stores/employee-store';
import EmployeeAttendanceTab from '../attendance/EmployeeAttendanceTab.vue';
import EmployeeLeaveList from '../leave/EmployeeLeaveList.vue';
import EmployeeLeaveBalances from '../leave/EmployeeLeaveBalances.vue';
import ManageEmployeeDefaultAllowances from '../default-allowance/ManageEmployeeDefaultAllowances.vue';
import ManageEmployeeDefaultDeductions from '../default-deduction/ManageEmployeeDefaultDeductions.vue';
import ManageHistoricalEmployeeDeductions from '../historical-deduction/ManageHistoricalEmployeeDeductions.vue';
import ManageEmployeeSsBenefit from '../ss-benefit/ManageEmployeeSsBenefit.vue';
import ManageEmploymentDetails from '../employment-detail/ManageEmploymentDetails.vue';
import ManageEmployeeCompensation from '../compensation/ManageEmployeeCompensation.vue';
import ManageEmployeeDocuments from '../document/ManageEmployeeDocuments.vue';

const employeeStore = useEmployeeStore();
const { activeDetailsTab } = storeToRefs(employeeStore);

const validTabs = new Set<EmployeeDetailsTab>([
  'attendance',
  'leaves',
  'allowances',
  'deductions',
  'historical-deductions',
  'ss-benefit',
  'contracts',
  'compensation',
  'documents',
]);

const tab = computed({
  get: () => activeDetailsTab.value,
  set: (value: string) => {
    if (validTabs.has(value as EmployeeDetailsTab)) {
      activeDetailsTab.value = value as EmployeeDetailsTab;
    }
  },
});
</script>