<template>
  <div>
    <search-banks />
    
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
      <template v-slot:body-cell-code="props">
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
              <q-tooltip>Edit Bank</q-tooltip>
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
              <q-tooltip>Delete Bank</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditBank
      v-model="showEditDialog"
      :bank="selectedBank"
      @updated="onBankUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this bank? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="bankStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useBankStore } from '../../stores/bank-store';
import SearchBanks from './SearchBanks.vue';
import EditBank from './EditBank.vue';
import type { Bank } from '../models';

const $q = useQuasar();
const bankStore = useBankStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => bankStore.searchFilters,
  async () => {
    bankStore.currentPage = 1;
    await bankStore.fetchBanks(1, pagination.value.rowsPerPage);
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
    name: 'code',
    label: 'Code',
    field: 'code',
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

const rows = computed(() => bankStore.banks);
const loading = computed(() => bankStore.isLoadingBanks);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedBank = ref<Bank | null>(null);
const bankToDelete = ref<Bank | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [bankStore.currentPage, bankStore.total],
  () => {
    pagination.value.page = bankStore.currentPage;
    pagination.value.rowsNumber = bankStore.total;
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
  await bankStore.fetchBanks(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = bankStore.total;
};

const openEditDialog = (bank: Bank) => {
  selectedBank.value = bank;
  showEditDialog.value = true;
};

const onBankUpdated = async () => {
  // Refresh the list after a bank is updated (keep current page)
  await bankStore.fetchBanks(
    bankStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (bank: Bank) => {
  bankToDelete.value = bank;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!bankToDelete.value) return;

  const success = await bankStore.deleteBank(bankToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Bank deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    bankToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await bankStore.fetchBanks(
      bankStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: bankStore.error || 'Failed to delete bank',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch banks with current search filters
  await bankStore.fetchBanks(1, pagination.value.rowsPerPage);
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

