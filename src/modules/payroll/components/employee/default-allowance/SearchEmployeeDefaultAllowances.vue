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
        <AllowanceSelect
          v-model="searchFilters.allowanceId"
          label="Filter by Other Payment"
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
          label="Add Default Other Payment"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddEmployeeDefaultAllowance
      v-model="showAddDialog"
      @saved="onEmployeeDefaultAllowanceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeDefaultAllowanceStore } from '@/stores/employee-default-allowance-store';
import { useEmployeeStore } from '@/stores/employee-store';
import AllowanceSelect from '@payroll/components/shared/allowance/AllowanceSelect.vue';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import AddEmployeeDefaultAllowance from './AddEmployeeDefaultAllowance.vue';
import { PAYROLL_OCCURRENCE_OPTIONS } from '@payroll/components/shared/occurrence/payroll-occurrence';

const employeeDefaultAllowanceStore = useEmployeeDefaultAllowanceStore();
const employeeStore = useEmployeeStore();

const searchFilters = computed({
  get: () => employeeDefaultAllowanceStore.searchFilters,
  set: (value) => {
    employeeDefaultAllowanceStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search
    || searchFilters.value.allowanceId
    || searchFilters.value.accountId
    || searchFilters.value.occurrence
  );
});

const onSearch = async () => {
  await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances();
};

const clearFilters = async () => {
  employeeDefaultAllowanceStore.searchFilters = {
    search: null,
    allowanceId: null,
    accountId: null,
    occurrence: null,
  };
  await onSearch();
};

const showAddDialog = ref(false);

const onEmployeeDefaultAllowanceSaved = async () => {
  await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances();
};

onMounted(async () => {
  if (employeeStore.allowances.length === 0) {
    await employeeStore.fetchAllowances();
  }
  if (employeeStore.accounts.length === 0) {
    await employeeStore.fetchAccounts();
  }
});
</script>
