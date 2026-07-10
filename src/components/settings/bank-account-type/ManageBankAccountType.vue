<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchBankAccountType />
      <q-card-section class="q-pa-none">
        <q-table
          title="Bank Account Types"
          :rows="bankAccountTypes"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingBankAccountTypes"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20]"
          @request="onRequest"
          no-data-label="No bank account types"
        >
          <template #body-cell-actions="props">
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
                  @click="onEdit(props.row)"
                >
                  <q-tooltip>Edit Bank Account Type</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  class="action-btn"
                  @click="onDelete(props.row)"
                >
                  <q-tooltip>Delete Bank Account Type</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <UpdateBankAccountType />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useBankAccountTypeStore,
  type BankAccountType,
} from 'src/stores/bank-account-type-store';
import SearchBankAccountType from './SearchBankAccountType.vue';
import UpdateBankAccountType from './UpdateBankAccountType.vue';

const store = useBankAccountTypeStore();
const $q = useQuasar();

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const bankAccountTypes = computed(() => store.bankAccountTypes);

watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await store.fetchBankAccountTypes(1, pagination.value.rowsPerPage);
    pagination.value.rowsNumber = store.total;
  },
);

watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  },
);

const onRequest = async (props: { pagination: { page: number; rowsPerPage: number } }) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  await store.fetchBankAccountTypes(page, rowsPerPage);
  pagination.value.rowsNumber = store.total;
};

const onEdit = (row: BankAccountType) => store.setBankAccountTypeToEdit(row);

const onDelete = (row: BankAccountType) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${row.name}"?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteBankAccountType(row.id);
        pagination.value.rowsNumber = store.total;
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Bank account type deleted successfully.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Failed to delete bank account type.',
        });
      }
    })();
  });
};

onMounted(async () => {
  await store.fetchBankAccountTypes(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total;
});
</script>

<style scoped>
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
