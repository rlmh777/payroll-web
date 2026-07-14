<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-2">
        <q-input
          v-model="searchFilters.search"
          label="Search by Name"
          outlined
          dense
          clearable
          @update:model-value="onSearch"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-2">
        <q-select
          v-model="searchFilters.isTaxable"
          :options="taxableOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="Taxable"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-select
          v-model="searchFilters.isSocialSecurityDeductable"
          :options="socialSecurityOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="Social Security Deductable"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-input
          v-model.number="searchFilters.minAmount"
          label="Min Amount"
          type="number"
          outlined
          dense
          clearable
          step="0.01"
          min="0"
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-input
          v-model.number="searchFilters.maxAmount"
          label="Max Amount"
          type="number"
          outlined
          dense
          clearable
          step="0.01"
          min="0"
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
          label="Add Allowance"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddAllowance
      v-model="showAddDialog"
      @saved="onAllowanceSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAllowanceStore } from '@payroll/stores/allowance-store';
import AddAllowance from './AddAllowance.vue';

const allowanceStore = useAllowanceStore();

const taxableOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

const socialSecurityOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

const searchFilters = computed({
  get: () => allowanceStore.searchFilters,
  set: (value) => {
    allowanceStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.isTaxable !== null ||
    searchFilters.value.isSocialSecurityDeductable !== null ||
    searchFilters.value.minAmount !== null ||
    searchFilters.value.maxAmount !== null
  );
});

const onSearch = async () => {
  await allowanceStore.fetchAllowances();
};

const clearFilters = async () => {
  allowanceStore.searchFilters = {
    search: null,
    isTaxable: null,
    isSocialSecurityDeductable: null,
    minAmount: null,
    maxAmount: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onAllowanceSaved = async () => {
  // Refresh the list after a new allowance is added
  await allowanceStore.fetchAllowances();
};
</script>

<style scoped>
</style>

