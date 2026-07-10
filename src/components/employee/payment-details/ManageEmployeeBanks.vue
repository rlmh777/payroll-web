<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add bank account" dense @click="store.openCreateDialog()" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No bank accounts on file"
    >
      <template #body-cell-bank="props">
        <q-td :props="props">
          {{ props.row.bank?.name || '—' }}
        </q-td>
      </template>
      <template #body-cell-isPrimary="props">
        <q-td :props="props">
          <q-badge v-if="props.row.isPrimary" color="primary" label="Primary" />
          <span v-else class="text-grey-6">—</span>
        </q-td>
      </template>
      <template #body-cell-notes="props">
        <q-td :props="props">
          <div class="text-ellipsis" :title="props.row.notes || ''">
            {{ props.row.notes || '—' }}
          </div>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="store.setRecordToEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <AddEmployeeBank :employee-id="employeeId" @saved="refresh" />
    <EditEmployeeBank @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useEmployeeBankStore } from 'src/stores/employee-bank-store';
import type { EmployeeBank } from 'src/components/models';
import AddEmployeeBank from './AddEmployeeBank.vue';
import EditEmployeeBank from './EditEmployeeBank.vue';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeBankStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'bank', label: 'Bank', field: 'bank', align: 'left' },
  { name: 'accountNumber', label: 'Account number', field: 'accountNumber', align: 'left' },
  { name: 'isPrimary', label: 'Primary', field: 'isPrimary', align: 'center' },
  { name: 'notes', label: 'Notes', field: 'notes', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeBank) {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Delete this bank account?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        await refresh();
        $q.notify({ color: 'positive', position: 'top', message: 'Bank account deleted.' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

watch(() => props.employeeId, refresh, { immediate: true });
</script>
