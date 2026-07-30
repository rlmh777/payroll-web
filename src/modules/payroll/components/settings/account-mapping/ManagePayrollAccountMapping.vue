<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchPayrollAccountMapping />
      <q-card-section class="q-pa-none">
        <q-table
          title="Payroll Account Mappings"
          :rows="mappings"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          no-data-label="No account mappings"
          :pagination="{ rowsPerPage: 20 }"
        >
          <template #body-cell-account="props">
            <q-td :props="props">
              <span v-if="props.row.account">
                {{ props.row.account.code1 }} — {{ props.row.account.name }}
              </span>
              <span v-else class="text-grey-6">Unmapped</span>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                {{ props.row.is_active ? 'Active' : 'Inactive' }}
              </q-badge>
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

    <UpdatePayrollAccountMapping />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  usePayrollAccountMappingStore,
  type PayrollAccountMapping,
} from 'src/stores/payroll-account-mapping-store';
import SearchPayrollAccountMapping from './SearchPayrollAccountMapping.vue';
import UpdatePayrollAccountMapping from './UpdatePayrollAccountMapping.vue';

const store = usePayrollAccountMappingStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  { name: 'name', label: 'Payment Type', field: 'name', align: 'left', sortable: true },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'account', label: 'GL Account', field: 'account', align: 'left' },
  { name: 'sort_order', label: 'Order', field: 'sort_order', align: 'right', sortable: true },
  { name: 'status', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const mappings = computed(() => store.mappings);

const onEdit = (row: PayrollAccountMapping) => store.setMappingToEdit(row);

const onDelete = (row: PayrollAccountMapping) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete account mapping "${row.code}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteMapping(row.id);
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Account mapping deleted.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Failed to delete account mapping.',
        });
      }
    })();
  });
};

onMounted(() => {
  void store.fetchMappings();
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
