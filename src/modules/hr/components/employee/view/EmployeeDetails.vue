<template>
  <q-card v-if="visibleDetailTabs.length > 0" class="q-gutter-y-md q-mt-sm">
    <q-tabs v-model="tab" dense no-caps inline-label class="bg-primary text-white shadow-4" align="left">
      <q-tab
        v-for="item in visibleDetailTabs"
        :key="item.name"
        :name="item.name"
        :icon="item.icon"
        :label="item.label"
      />
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
          :readonly="!isTabEditable('contracts')"
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
          :readonly="!isTabEditable('documents')"
        />
      </q-tab-panel>

      <q-tab-panel name="incidents">
        <manage-employee-incidents
          v-if="employeeStore.selectedEmployee?.id"
          :employee-id="employeeStore.selectedEmployee.id"
          :readonly="!isTabEditable('incidents')"
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
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useEmployeeStore, type EmployeeDetailsTab } from '@hr/stores/employee-store';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
import type { EmployeeFormTabKey } from '@core/types/employee-form-access';
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
const { isTabVisible, isTabEditable } = useEmployeeFormAccess();

const detailTabMap: Array<{
  name: EmployeeDetailsTab;
  accessKey: EmployeeFormTabKey;
  label: string;
  icon: string;
}> = [
  { name: 'allowances', accessKey: 'allowances', label: 'Default Other Payments', icon: 'movie' },
  { name: 'deductions', accessKey: 'deductions', label: 'Default Deductions', icon: 'movie' },
  { name: 'ss-benefit', accessKey: 'ss_benefit', label: 'SS Benefit', icon: 'health_and_safety' },
  { name: 'contracts', accessKey: 'contracts', label: 'Contracts', icon: 'movie' },
  { name: 'compensation', accessKey: 'compensation', label: 'Compensation', icon: 'payments' },
  { name: 'documents', accessKey: 'documents', label: 'Documents', icon: 'description' },
  { name: 'incidents', accessKey: 'incidents', label: 'Incidents', icon: 'report_problem' },
  { name: 'time-travel', accessKey: 'time_travel', label: 'Time Travel', icon: 'history' },
];

const visibleDetailTabs = computed(() =>
  detailTabMap.filter((item) => isTabVisible(item.accessKey)),
);

const tab = computed({
  get: () => {
    const visible = visibleDetailTabs.value.map((item) => item.name);
    if (visible.includes(activeDetailsTab.value)) {
      return activeDetailsTab.value;
    }
    return visible[0] || 'contracts';
  },
  set: (value: string) => {
    if (visibleDetailTabs.value.some((item) => item.name === value)) {
      activeDetailsTab.value = value as EmployeeDetailsTab;
    }
  },
});

watch(visibleDetailTabs, (tabs) => {
  if (tabs.length > 0 && !tabs.some((item) => item.name === activeDetailsTab.value)) {
    activeDetailsTab.value = tabs[0]!.name;
  }
}, { immediate: true });
</script>
