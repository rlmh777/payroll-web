<template>
  <div>
    <search-account-types />
    
    <q-table
      class="my-sticky-dynamic q-mt-sm"
      flat
      bordered
      dense
      :rows="rows"
      :columns="columns"
      :loading="loading"
      row-key="id"
      v-model:pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20]"
      @request="onRequest"
      server-side
    >
      <template v-slot:body-cell-statement="props">
        <q-td :props="props">
          {{ props.value || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-normal_balance="props">
        <q-td :props="props">
          {{ props.value || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <div class="action-buttons">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              class="action-btn"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Edit Account Type</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              size="sm"
              class="action-btn"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Delete Account Type</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditAccountType
      v-model="showEditDialog"
      :account-type="selectedAccountType"
      @updated="onAccountTypeUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this account type? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="accountTypeStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAccountTypeStore } from '../../stores/account-type-store';
import SearchAccountTypes from './SearchAccountTypes.vue';
import EditAccountType from './EditAccountType.vue';
import type { AccountType } from '../models';

const $q = useQuasar();
const accountTypeStore = useAccountTypeStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => accountTypeStore.searchFilters,
  async () => {
    accountTypeStore.currentPage = 1;
    await accountTypeStore.fetchAccountTypes(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

const columns = [
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'normal_balance',
    label: 'Normal Balance',
    field: 'normal_balance',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'statement',
    label: 'Statement',
    field: 'statement',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'right' as const,
    sortable: false,
  },
];

const rows = computed(() => accountTypeStore.accountTypes);
const loading = computed(() => accountTypeStore.isLoadingAccountTypes);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAccountType = ref<AccountType | null>(null);
const accountTypeToDelete = ref<AccountType | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [accountTypeStore.currentPage, accountTypeStore.total],
  () => {
    pagination.value.page = accountTypeStore.currentPage;
    pagination.value.rowsNumber = accountTypeStore.total;
  }
);

const onRequest = async (props: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
  filter?: string;
}) => {
  const { page, rowsPerPage } = props.pagination;
  
  // Update local pagination
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  
  // Fetch data from server
  await accountTypeStore.fetchAccountTypes(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = accountTypeStore.total;
};

const openEditDialog = (accountType: AccountType) => {
  selectedAccountType.value = accountType;
  showEditDialog.value = true;
};

const onAccountTypeUpdated = async () => {
  // Refresh the list after an account type is updated (keep current page)
  await accountTypeStore.fetchAccountTypes(
    accountTypeStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (accountType: AccountType) => {
  accountTypeToDelete.value = accountType;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!accountTypeToDelete.value) return;

  const success = await accountTypeStore.deleteAccountType(accountTypeToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Account type deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    accountTypeToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await accountTypeStore.fetchAccountTypes(
      accountTypeStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: accountTypeStore.error || 'Failed to delete account type',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch account types with current search filters
  await accountTypeStore.fetchAccountTypes(1, pagination.value.rowsPerPage);
});
</script>

<style scoped>
.my-sticky-dynamic {
  max-height: 600px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>

