<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-2">
        <q-input
          v-model="searchFilters.search"
          label="Search by Note"
          outlined
          dense
          :clearable="true"
          @update:model-value="onSearch"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-2">
        <DeductionTypeSelect
          v-model="searchFilters.deductionTypeId"
          label="Filter by Deduction Type"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-select
          v-model="searchFilters.occurrence"
          :options="PAYROLL_OCCURRENCE_OPTIONS"
          emit-value
          map-options
          label="Filter by Occurrence"
          outlined
          dense
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <AccountSelect
          v-model="searchFilters.accountId"
          label="Filter by Account"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-btn
          flat
          label="Clear Filters"
          color="grey"
          @click="clearFilters"
          :disable="!hasActiveFilters"
        />
      </div>
      <q-space />
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Add Default Deduction"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddEmployeeDefaultDeduction
      v-model="showAddDialog"
      @saved="onEmployeeDefaultDeductionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeDefaultDeductionStore } from '@/stores/employee-default-deduction-store';
import { useEmployeeStore } from '@/stores/employee-store';
import { useDeductionTypeStore } from '@/stores/deduction-type-store';
import DeductionTypeSelect from '@payroll/components/shared/deduction-type/DeductionTypeSelect.vue';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import AddEmployeeDefaultDeduction from './AddEmployeeDefaultDeduction.vue';
import { PAYROLL_OCCURRENCE_OPTIONS } from '@payroll/components/shared/occurrence/payroll-occurrence';

const employeeDefaultDeductionStore = useEmployeeDefaultDeductionStore();
const employeeStore = useEmployeeStore();
const deductionTypeStore = useDeductionTypeStore();

const searchFilters = computed({
  get: () => employeeDefaultDeductionStore.searchFilters,
  set: (value) => {
    employeeDefaultDeductionStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.deductionTypeId ||
    searchFilters.value.occurrence ||
    searchFilters.value.accountId
  );
});

const onSearch = async () => {
  await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions();
};

const clearFilters = async () => {
  employeeDefaultDeductionStore.searchFilters = {
    search: null,
    deductionTypeId: null,
    occurrence: null,
    accountId: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onEmployeeDefaultDeductionSaved = async () => {
  // Refresh the list after a new default deduction is added
  await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions();
};

// Fetch initial data on mount
onMounted(async () => {
  if (deductionTypeStore.deductionTypes.length === 0) {
    await deductionTypeStore.fetchDeductionTypes();
  }
  if (employeeStore.accounts.length === 0) {
    await employeeStore.fetchAccounts();
  }
});
</script>

<style scoped>
</style>

