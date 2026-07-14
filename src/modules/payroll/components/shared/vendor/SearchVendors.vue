<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-3">
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
      <div class="col-12 col-md-3">
        <BankSelect
          v-model="searchFilters.bankId"
          label="Filter by Bank"
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
          label="Add Vendor"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddVendor
      v-model="showAddDialog"
      @saved="onVendorSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVendorStore } from '@payroll/stores/vendor-store';
import AddVendor from './AddVendor.vue';
import BankSelect from '../bank/BankSelect.vue';

const vendorStore = useVendorStore();

const searchFilters = computed({
  get: () => vendorStore.searchFilters,
  set: (value) => {
    vendorStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.bankId !== null
  );
});

const onSearch = async () => {
  await vendorStore.fetchVendors();
};

const clearFilters = async () => {
  vendorStore.searchFilters = {
    search: null,
    bankId: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onVendorSaved = async () => {
  // Refresh the list after a new vendor is added
  await vendorStore.fetchVendors();
};
</script>

<style scoped>
</style>

