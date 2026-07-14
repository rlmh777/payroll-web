<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add Benefit Status" dense @click="store.openCreateDialog()" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No SS benefit status records"
    >
      <template #body-cell-is_receiving_benefit="props">
        <q-td :props="props">
          <q-icon :name="props.row.is_receiving_benefit ? 'check_circle' : 'cancel'" :color="props.row.is_receiving_benefit ? 'positive' : 'grey'" />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="store.setRecordToEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <AddEmployeeSsBenefit :employee-id="employeeId" @saved="refresh" />
    <EditEmployeeSsBenefit @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useEmployeeSsBenefitStore, type EmployeeSsBenefitStatus } from '@payroll/stores/employee-ss-benefit-store';
import AddEmployeeSsBenefit from './AddEmployeeSsBenefit.vue';
import EditEmployeeSsBenefit from './EditEmployeeSsBenefit.vue';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeSsBenefitStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'effective_from', label: 'From', field: 'effective_from', align: 'left' },
  { name: 'effective_to', label: 'To', field: (r) => r.effective_to ?? '—', align: 'left' },
  { name: 'is_receiving_benefit', label: 'Receiving Benefit', field: 'is_receiving_benefit', align: 'center' },
  { name: 'benefit_type', label: 'Type', field: (r) => r.benefit_type?.name ?? '—', align: 'left' },
  { name: 'verified_at', label: 'Verified', field: (r) => r.verified_at ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeSsBenefitStatus) {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Delete this benefit status record?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Record deleted.' });
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
