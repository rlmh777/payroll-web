<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-4">
        <q-input
          v-model="searchFilters.search"
          label="Search by Name or Code"
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
          label="Add Bank"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddBank
      v-model="showAddDialog"
      @saved="onBankSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBankStore } from '@core/stores/bank-store';
import AddBank from './AddBank.vue';

const bankStore = useBankStore();

const searchFilters = computed({
  get: () => bankStore.searchFilters,
  set: (value) => {
    bankStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!searchFilters.value.search;
});

const onSearch = async () => {
  await bankStore.fetchBanks();
};

const clearFilters = async () => {
  bankStore.searchFilters = {
    search: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onBankSaved = async () => {
  // Refresh the list after a new bank is added
  await bankStore.fetchBanks();
};
</script>

<style scoped>
</style>

