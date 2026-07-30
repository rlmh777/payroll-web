<template>
  <div>
    <search-historical-employee-deductions />

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
        <q-td :props="props">{{ props.value?.name || '-' }}</q-td>
      </template>
      <template v-slot:body-cell-vendor="props">
        <q-td :props="props">{{ props.value?.name || '-' }}</q-td>
      </template>
      <template v-slot:body-cell-chartOfAccount="props">
        <q-td :props="props">{{ props.value?.name || '-' }}</q-td>
      </template>
      <template v-slot:body-cell-amount="props">
        <q-td :props="props">{{ formatCurrency(props.value) }}</q-td>
      </template>
      <template v-slot:body-cell-carryForwardShortfall="props">
        <q-td :props="props">{{ formatCurrency(props.value) }}</q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <div class="action-buttons">
            <q-btn flat round dense icon="edit" color="primary" size="sm" class="action-btn" @click="openEdit(props.row)">
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn flat round dense icon="delete" color="negative" size="sm" class="action-btn" @click="confirmDelete(props.row)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <EditHistoricalEmployeeDeduction
      v-model="showEditDialog"
      :historical-deduction="selected"
      @updated="onUpdated"
    />

    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>
        <q-card-section>
          <span>Delete this historical deduction? This cannot be undone.</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="store.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useHistoricalEmployeeDeductionStore } from '@/stores/historical-employee-deduction-store';
import { useEmployeeStore } from '@/stores/employee-store';
import SearchHistoricalEmployeeDeductions from './SearchHistoricalEmployeeDeductions.vue';
import EditHistoricalEmployeeDeduction from './EditHistoricalEmployeeDeduction.vue';
import type { HistoricalEmployeeDeduction } from '@core/types/models';

const $q = useQuasar();
const store = useHistoricalEmployeeDeductionStore();
const employeeStore = useEmployeeStore();

const columns = [
  { name: 'deduction', label: 'Deduction', field: (row: HistoricalEmployeeDeduction) => row.deductionType, align: 'left' as const },
  { name: 'vendor', label: 'Vendor', field: (row: HistoricalEmployeeDeduction) => row.vendor, align: 'left' as const },
  { name: 'chartOfAccount', label: 'Account', field: (row: HistoricalEmployeeDeduction) => row.chart_of_account, align: 'left' as const },
  { name: 'payroll_run_id', label: 'Payroll Run', field: 'payroll_run_id', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'carryForwardShortfall', label: 'Carry Forward', field: 'carryForwardShortfall', align: 'right' as const },
  { name: 'priority', label: 'Priority', field: 'priority', align: 'right' as const },
  { name: 'note', label: 'Note', field: 'note', align: 'left' as const },
  { name: 'actions', label: '', field: '', align: 'right' as const },
];

const rows = computed(() => store.historicalEmployeeDeductions);
const loading = computed(() => store.isLoadingHistoricalEmployeeDeductions);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selected = ref<HistoricalEmployeeDeduction | null>(null);
const toDelete = ref<HistoricalEmployeeDeduction | null>(null);

const pagination = ref({ rowsPerPage: 20, page: 1, rowsNumber: 0 });

watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  }
);

watch(
  () => employeeStore.selectedEmployee?.id,
  async () => {
    store.currentPage = 1;
    await store.fetchHistoricalEmployeeDeductions(1, pagination.value.rowsPerPage);
  }
);

const onRequest = async (props: { pagination: { page: number; rowsPerPage: number } }) => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  await store.fetchHistoricalEmployeeDeductions(props.pagination.page, props.pagination.rowsPerPage);
  pagination.value.rowsNumber = store.total;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const openEdit = (row: HistoricalEmployeeDeduction) => {
  selected.value = row;
  showEditDialog.value = true;
};

const onUpdated = async () => {
  await store.fetchHistoricalEmployeeDeductions(store.currentPage, pagination.value.rowsPerPage);
};

const confirmDelete = (row: HistoricalEmployeeDeduction) => {
  toDelete.value = row;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!toDelete.value) return;
  const ok = await store.deleteHistoricalEmployeeDeduction(toDelete.value.id);
  if (ok) {
    $q.notify({ type: 'positive', message: 'Deleted', position: 'top' });
    showDeleteDialog.value = false;
    toDelete.value = null;
    await store.fetchHistoricalEmployeeDeductions(store.currentPage, pagination.value.rowsPerPage);
  } else {
    $q.notify({ type: 'negative', message: store.error || 'Delete failed', position: 'top' });
  }
};

onMounted(async () => {
  await store.fetchHistoricalEmployeeDeductions(1, pagination.value.rowsPerPage);
});
</script>

<style scoped>
.my-sticky-dynamic { max-height: 600px; }
.action-buttons { display: flex; gap: 4px; justify-content: flex-end; }
.action-btn { opacity: 0; transition: opacity 0.2s ease; }
:deep(.q-table tbody tr:hover .action-btn) { opacity: 1; }
</style>
