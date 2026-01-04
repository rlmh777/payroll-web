<template>
  <div>
    <search-allowances />
    
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
      <template v-slot:body-cell-isTaxable="props">
        <q-td :props="props">
          <q-icon
            :name="props.value ? 'check_circle' : 'cancel'"
            :color="props.value ? 'positive' : 'negative'"
            size="sm"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-isSocialSecurityDeductable="props">
        <q-td :props="props">
          <q-icon
            :name="props.value ? 'check_circle' : 'cancel'"
            :color="props.value ? 'positive' : 'negative'"
            size="sm"
          />
        </q-td>
      </template>
      <template v-slot:body-cell-defaultAmount="props">
        <q-td :props="props">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-note="props">
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
              <q-tooltip>Edit Allowance</q-tooltip>
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
              <q-tooltip>Delete Allowance</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditAllowance
      v-model="showEditDialog"
      :allowance="selectedAllowance"
      @updated="onAllowanceUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this allowance? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="allowanceStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAllowanceStore } from '../../stores/allowance-store';
import SearchAllowances from './SearchAllowances.vue';
import EditAllowance from './EditAllowance.vue';
import type { Allowance } from '../models';

const $q = useQuasar();
const allowanceStore = useAllowanceStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => allowanceStore.searchFilters,
  async () => {
    allowanceStore.currentPage = 1;
    await allowanceStore.fetchAllowances(1, pagination.value.rowsPerPage);
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
    name: 'isTaxable',
    label: 'Taxable',
    field: 'isTaxable',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'isSocialSecurityDeductable',
    label: 'Social Security Deductable',
    field: 'isSocialSecurityDeductable',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'defaultAmount',
    label: 'Default Amount',
    field: 'defaultAmount',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'note',
    label: 'Note',
    field: 'note',
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'right' as const,
    sortable: false,
  },
];

const rows = computed(() => allowanceStore.allowances);
const loading = computed(() => allowanceStore.isLoadingAllowances);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedAllowance = ref<Allowance | null>(null);
const allowanceToDelete = ref<Allowance | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [allowanceStore.currentPage, allowanceStore.total],
  () => {
    pagination.value.page = allowanceStore.currentPage;
    pagination.value.rowsNumber = allowanceStore.total;
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
  await allowanceStore.fetchAllowances(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = allowanceStore.total;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (allowance: Allowance) => {
  selectedAllowance.value = allowance;
  showEditDialog.value = true;
};

const onAllowanceUpdated = async () => {
  // Refresh the list after an allowance is updated (keep current page)
  await allowanceStore.fetchAllowances(
    allowanceStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (allowance: Allowance) => {
  allowanceToDelete.value = allowance;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!allowanceToDelete.value) return;

  const success = await allowanceStore.deleteAllowance(allowanceToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Allowance deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    allowanceToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await allowanceStore.fetchAllowances(
      allowanceStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: allowanceStore.error || 'Failed to delete allowance',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch allowances with current search filters
  await allowanceStore.fetchAllowances(1, pagination.value.rowsPerPage);
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

