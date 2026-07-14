<template>
  <div>
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
      <template v-slot:body-cell-accountType="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-parent="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-balance="props">
        <q-td :props="props">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-description="props">
        <q-td :props="props">
          <div class="text-ellipsis" :title="props.value">
            {{ props.value || '-' }}
          </div>
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
              <q-tooltip>Edit Account</q-tooltip>
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
              <q-tooltip>Delete Account</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditAccount
      v-model="showEditDialog"
      :account="selectedAccount"
      @updated="onAccountUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this account? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="accountStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAccountStore } from '@payroll/stores/account-store';
import EditAccount from './EditAccount.vue';
import type { Account } from '@core/types/models';

const $q = useQuasar();
const accountStore = useAccountStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => accountStore.searchFilters,
  async () => {
    accountStore.currentPage = 1;
    await accountStore.fetchAccounts(1, pagination.value.rowsPerPage);
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
    name: 'description',
    label: 'Description',
    field: 'description',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'code1',
    label: 'Code 1',
    field: 'code1',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'code2',
    label: 'Code 2',
    field: 'code2',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'accountType',
    label: 'Account Type',
    field: (row: Account) => row.accountType,
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'parent',
    label: 'Parent',
    field: (row: Account) => row.parent,
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'balance',
    label: 'Balance',
    field: 'balance',
    align: 'right' as const,
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

const rows = computed(() => accountStore.accounts);
const loading = computed(() => accountStore.isLoadingAccounts);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAccount = ref<Account | null>(null);
const accountToDelete = ref<Account | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [accountStore.currentPage, accountStore.total],
  () => {
    pagination.value.page = accountStore.currentPage;
    pagination.value.rowsNumber = accountStore.total;
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
  await accountStore.fetchAccounts(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = accountStore.total;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (account: Account) => {
  selectedAccount.value = account;
  showEditDialog.value = true;
};

const onAccountUpdated = async () => {
  // Refresh the list after an account is updated (keep current page)
  await accountStore.fetchAccounts(
    accountStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (account: Account) => {
  accountToDelete.value = account;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!accountToDelete.value) return;

  const success = await accountStore.deleteAccount(accountToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Account deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    accountToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await accountStore.fetchAccounts(
      accountStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: accountStore.error || 'Failed to delete account',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch accounts with current search filters
  await accountStore.fetchAccounts(1, pagination.value.rowsPerPage);
});
</script>

<style scoped>
.my-sticky-dynamic {
  max-height: 600px;
}

.text-ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

