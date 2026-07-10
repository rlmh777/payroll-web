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
          v-model="searchFilters.account_type_id"
          :options="accountTypeOptions"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          outlined
          dense
          label="Account Type"
          clearable
          :loading="isLoadingAccountTypes"
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-checkbox
          v-model="searchFilters.root_only"
          label="Root Only"
          :disable="searchFilters.sub_accounts_only === true"
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-checkbox
          v-model="searchFilters.sub_accounts_only"
          label="Sub Accounts Only"
          :disable="searchFilters.root_only === true"
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-1">
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
          label="Add Account"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddAccount
      v-model="showAddDialog"
      @saved="onAccountSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAccountStore } from '../../../stores/account-store';
import { useAuthStore } from '../../../stores/auth';
import AddAccount from './AddAccount.vue';
import type { AccountType } from '../../models';

const accountStore = useAccountStore();
const authStore = useAuthStore();

const accountTypeOptions = ref<AccountType[]>([]);
const isLoadingAccountTypes = ref(false);

const searchFilters = computed({
  get: () => accountStore.searchFilters,
  set: (value) => {
    accountStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.account_type_id !== null ||
    searchFilters.value.root_only !== null ||
    searchFilters.value.sub_accounts_only !== null
  );
});

const onSearch = async () => {
  await accountStore.fetchAccounts();
};

const clearFilters = async () => {
  accountStore.searchFilters = {
    search: null,
    account_type_id: null,
    parent_id: null,
    root_only: null,
    sub_accounts_only: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onAccountSaved = async () => {
  // Refresh the list after a new account is added
  await accountStore.fetchAccounts();
};

const fetchAccountTypes = async () => {
  isLoadingAccountTypes.value = true;
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/account-types`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      accountTypeOptions.value = data.data || data;
    }
  } catch (error) {
    console.error('Error fetching account types:', error);
  } finally {
    isLoadingAccountTypes.value = false;
  }
};

onMounted(async () => {
  await fetchAccountTypes();
});
</script>

<style scoped>
</style>

