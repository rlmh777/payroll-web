<template>
  <div>
    <search-employee-default-deductions />
    
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
      <template v-slot:body-cell-deduction="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-vendor="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-payrateFrequency="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
        </q-td>
      </template>
      <template v-slot:body-cell-chartOfAccount="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
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
              <q-tooltip>Edit Default Deduction</q-tooltip>
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
              <q-tooltip>Delete Default Deduction</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditEmployeeDefaultDeduction
      v-model="showEditDialog"
      :employeeDefaultDeduction="selectedEmployeeDefaultDeduction"
      @updated="onEmployeeDefaultDeductionUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this default deduction? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="employeeDefaultDeductionStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeDefaultDeductionStore } from '../../../stores/employee-default-deduction-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import SearchEmployeeDefaultDeductions from './SearchEmployeeDefaultDeductions.vue';
import EditEmployeeDefaultDeduction from './EditEmployeeDefaultDeduction.vue';
import type { EmployeeDefaultDeduction } from '../../models';

const $q = useQuasar();
const employeeDefaultDeductionStore = useEmployeeDefaultDeductionStore();
const employeeStore = useEmployeeStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => employeeDefaultDeductionStore.searchFilters,
  async () => {
    employeeDefaultDeductionStore.currentPage = 1;
    await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

// Watch for selectedEmployee changes and refetch (reset to page 1)
watch(
  () => employeeStore.selectedEmployee?.id,
  async () => {
    employeeDefaultDeductionStore.currentPage = 1;
    await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(1, pagination.value.rowsPerPage);
  }
);

const columns = [
  {
    name: 'deduction',
    label: 'Deduction Type',
    field: (row: EmployeeDefaultDeduction) => row.deduction || row.deductionType,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'vendor',
    label: 'Vendor',
    field: (row: EmployeeDefaultDeduction) => row.vendor,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'payrateFrequency',
    label: 'Frequency',
    field: (row: EmployeeDefaultDeduction) => row.payrate_frequency,
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'chartOfAccount',
    label: 'Account',
    field: (row: EmployeeDefaultDeduction) => row.chart_of_account,
    align: 'left' as const,
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

const rows = computed(() => employeeDefaultDeductionStore.employeeDefaultDeductions);
const loading = computed(() => employeeDefaultDeductionStore.isLoadingEmployeeDefaultDeductions);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedEmployeeDefaultDeduction = ref<EmployeeDefaultDeduction | null>(null);
const employeeDefaultDeductionToDelete = ref<EmployeeDefaultDeduction | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [employeeDefaultDeductionStore.currentPage, employeeDefaultDeductionStore.total],
  () => {
    pagination.value.page = employeeDefaultDeductionStore.currentPage;
    pagination.value.rowsNumber = employeeDefaultDeductionStore.total;
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
  await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = employeeDefaultDeductionStore.total;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (employeeDefaultDeduction: EmployeeDefaultDeduction) => {
  selectedEmployeeDefaultDeduction.value = employeeDefaultDeduction;
  showEditDialog.value = true;
};

const onEmployeeDefaultDeductionUpdated = async () => {
  // Refresh the list after a default deduction is updated (keep current page)
  await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(
    employeeDefaultDeductionStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (employeeDefaultDeduction: EmployeeDefaultDeduction) => {
  employeeDefaultDeductionToDelete.value = employeeDefaultDeduction;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!employeeDefaultDeductionToDelete.value) return;

  const success = await employeeDefaultDeductionStore.deleteEmployeeDefaultDeduction(employeeDefaultDeductionToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Default deduction deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    employeeDefaultDeductionToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(
      employeeDefaultDeductionStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: employeeDefaultDeductionStore.error || 'Failed to delete default deduction',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch employee default deductions with current search filters
  // employeeId will be taken from employeeStore.selectedEmployee if needed
  // Start with page 1 and default rows per page
  await employeeDefaultDeductionStore.fetchEmployeeDefaultDeductions(1, pagination.value.rowsPerPage);
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

