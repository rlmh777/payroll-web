<template>
  <div>
    <search-vendors />
    
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
      <template v-slot:body-cell-bank="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
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
              <q-tooltip>Edit Vendor</q-tooltip>
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
              <q-tooltip>Delete Vendor</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditVendor
      v-model="showEditDialog"
      :vendor="selectedVendor"
      @updated="onVendorUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this vendor? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="vendorStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useVendorStore } from '@payroll/stores/vendor-store';
import SearchVendors from './SearchVendors.vue';
import EditVendor from './EditVendor.vue';
import type { Vendor } from '@core/types/models';

const $q = useQuasar();
const vendorStore = useVendorStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => vendorStore.searchFilters,
  async () => {
    vendorStore.currentPage = 1;
    await vendorStore.fetchVendors(1, pagination.value.rowsPerPage);
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
    name: 'phone',
    label: 'Phone',
    field: 'phone',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'email',
    label: 'Email',
    field: 'email',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'bank',
    label: 'Bank',
    field: (row: Vendor) => row.bank,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'accountNumber',
    label: 'Account Number',
    field: 'accountNumber',
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

const rows = computed(() => vendorStore.vendors);
const loading = computed(() => vendorStore.isLoadingVendors);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedVendor = ref<Vendor | null>(null);
const vendorToDelete = ref<Vendor | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [vendorStore.currentPage, vendorStore.total],
  () => {
    pagination.value.page = vendorStore.currentPage;
    pagination.value.rowsNumber = vendorStore.total;
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
  await vendorStore.fetchVendors(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = vendorStore.total;
};

const openEditDialog = (vendor: Vendor) => {
  selectedVendor.value = vendor;
  showEditDialog.value = true;
};

const onVendorUpdated = async () => {
  // Refresh the list after a vendor is updated (keep current page)
  await vendorStore.fetchVendors(
    vendorStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (vendor: Vendor) => {
  vendorToDelete.value = vendor;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!vendorToDelete.value) return;

  const success = await vendorStore.deleteVendor(vendorToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Vendor deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    vendorToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await vendorStore.fetchVendors(
      vendorStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: vendorStore.error || 'Failed to delete vendor',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch vendors with current search filters
  await vendorStore.fetchVendors(1, pagination.value.rowsPerPage);
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

