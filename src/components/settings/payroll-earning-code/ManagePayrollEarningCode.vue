<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchPayrollEarningCode />
      <q-card-section class="q-pa-none">
        <q-table
          title="Payroll Earning Codes"
          :rows="earningCodes"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          no-data-label="No earning codes"
        >
          <template #body-cell-account="props">
            <q-td :props="props">
              <span v-if="props.row.account">{{ props.row.account.code1 }} — {{ props.row.account.name }}</span>
              <span v-else class="text-grey-6">—</span>
            </q-td>
          </template>
          <template #body-cell-flags="props">
            <q-td :props="props">
              <q-badge v-if="props.row.is_taxable" color="blue-grey" class="q-mr-xs">Taxable</q-badge>
              <q-badge v-if="props.row.is_ss_subject" color="teal">SS</q-badge>
              <q-badge v-if="!props.row.is_active" color="grey" class="q-ml-xs">Inactive</q-badge>
            </q-td>
          </template>
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
                  <q-tooltip>Edit</q-tooltip>
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
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <UpdatePayrollEarningCode />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  usePayrollEarningCodeStore,
  type PayrollEarningCode,
} from 'src/stores/payroll-earning-code-store';
import SearchPayrollEarningCode from './SearchPayrollEarningCode.vue';
import UpdatePayrollEarningCode from './UpdatePayrollEarningCode.vue';

const store = usePayrollEarningCodeStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'account', label: 'GL Account', field: 'account', align: 'left' },
  { name: 'sort_order', label: 'Order', field: 'sort_order', align: 'right', sortable: true },
  { name: 'flags', label: 'Flags', field: 'flags', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const earningCodes = computed(() => store.earningCodes);

const onEdit = (row: PayrollEarningCode) => store.setCodeToEdit(row);

const onDelete = (row: PayrollEarningCode) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete earning code "${row.code}"?`,
    cancel: true,
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteEarningCode(row.id);
        $q.notify({ color: 'positive', position: 'top', icon: 'check_circle', message: 'Earning code deleted.' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Failed to delete earning code.',
        });
      }
    })();
  });
};

onMounted(() => {
  void store.fetchEarningCodes();
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
