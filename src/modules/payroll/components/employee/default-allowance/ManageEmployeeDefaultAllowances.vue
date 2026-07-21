<template>
  <div>
    <search-employee-default-allowances />
    
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
      <template v-slot:body-cell-allowance="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-chartOfAccount="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-quantity="props">
        <q-td :props="props">
          {{ props.value ?? '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-unitAmount="props">
        <q-td :props="props">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-amount="props">
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
              <q-tooltip>Edit Default Allowance</q-tooltip>
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
              <q-tooltip>Delete Default Allowance</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditEmployeeDefaultAllowance
      v-model="showEditDialog"
      :employeeDefaultAllowance="selectedEmployeeDefaultAllowance"
      @updated="onEmployeeDefaultAllowanceUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this default allowance? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="employeeDefaultAllowanceStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeDefaultAllowanceStore } from '@/stores/employee-default-allowance-store';
import { useEmployeeStore } from '@/stores/employee-store';
import SearchEmployeeDefaultAllowances from './SearchEmployeeDefaultAllowances.vue';
import EditEmployeeDefaultAllowance from './EditEmployeeDefaultAllowance.vue';
import type { EmployeeDefaultAllowance } from '@core/types/models';

const $q = useQuasar();
const employeeDefaultAllowanceStore = useEmployeeDefaultAllowanceStore();
const employeeStore = useEmployeeStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => employeeDefaultAllowanceStore.searchFilters,
  async () => {
    employeeDefaultAllowanceStore.currentPage = 1;
    await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

// Watch for selectedEmployee changes and refetch (reset to page 1)
watch(
  () => employeeStore.selectedEmployee?.id,
  async () => {
    employeeDefaultAllowanceStore.currentPage = 1;
    await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(1, pagination.value.rowsPerPage);
  }
);

const columns = [
  {
    name: 'allowance',
    label: 'Allowance',
    field: (row: EmployeeDefaultAllowance) => row.allowance,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'chartOfAccount',
    label: 'Account',
    field: (row: EmployeeDefaultAllowance) => row.chart_of_account,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'quantity',
    label: 'Qty',
    field: 'quantity',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'unitAmount',
    label: 'Unit amount',
    field: 'unitAmount',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'amount',
    label: 'Amount',
    field: 'amount',
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

const rows = computed(() => employeeDefaultAllowanceStore.employeeDefaultAllowances);
const loading = computed(() => employeeDefaultAllowanceStore.isLoadingEmployeeDefaultAllowances);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedEmployeeDefaultAllowance = ref<EmployeeDefaultAllowance | null>(null);
const employeeDefaultAllowanceToDelete = ref<EmployeeDefaultAllowance | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [employeeDefaultAllowanceStore.currentPage, employeeDefaultAllowanceStore.total],
  () => {
    pagination.value.page = employeeDefaultAllowanceStore.currentPage;
    pagination.value.rowsNumber = employeeDefaultAllowanceStore.total;
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
  await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = employeeDefaultAllowanceStore.total;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (employeeDefaultAllowance: EmployeeDefaultAllowance) => {
  selectedEmployeeDefaultAllowance.value = employeeDefaultAllowance;
  showEditDialog.value = true;
};

const onEmployeeDefaultAllowanceUpdated = async () => {
  // Refresh the list after a default allowance is updated (keep current page)
  await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(
    employeeDefaultAllowanceStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (employeeDefaultAllowance: EmployeeDefaultAllowance) => {
  employeeDefaultAllowanceToDelete.value = employeeDefaultAllowance;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!employeeDefaultAllowanceToDelete.value) return;

  const success = await employeeDefaultAllowanceStore.deleteEmployeeDefaultAllowance(employeeDefaultAllowanceToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Default allowance deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    employeeDefaultAllowanceToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(
      employeeDefaultAllowanceStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: employeeDefaultAllowanceStore.error || 'Failed to delete default allowance',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch employee default allowances with current search filters
  // employeeId will be taken from employeeStore.selectedEmployee if needed
  // Start with page 1 and default rows per page
  await employeeDefaultAllowanceStore.fetchEmployeeDefaultAllowances(1, pagination.value.rowsPerPage);
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

