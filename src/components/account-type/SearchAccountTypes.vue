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
      <div class="col-12 col-md-2">
        <q-select
          v-model="searchFilters.statement"
          :options="statementOptions"
          outlined
          dense
          label="Statement"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-input
          v-model="searchFilters.normal_balance"
          label="Normal Balance"
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
          label="Add Account Type"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddAccountType
      v-model="showAddDialog"
      @saved="onAccountTypeSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAccountTypeStore } from '../../stores/account-type-store';
import AddAccountType from './AddAccountType.vue';

const accountTypeStore = useAccountTypeStore();

const statementOptions = [
  'Balance Sheet',
  'Income Statement',
];

const searchFilters = computed({
  get: () => accountTypeStore.searchFilters,
  set: (value) => {
    accountTypeStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.statement ||
    searchFilters.value.normal_balance
  );
});

const onSearch = async () => {
  await accountTypeStore.fetchAccountTypes();
};

const clearFilters = async () => {
  accountTypeStore.searchFilters = {
    search: null,
    statement: null,
    normal_balance: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onAccountTypeSaved = async () => {
  // Refresh the list after a new account type is added
  await accountTypeStore.fetchAccountTypes();
};
</script>

<style scoped>
</style>

