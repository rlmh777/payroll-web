<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add Contract" dense @click="store.openCreateDialog()" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No employment contracts"
    >
      <template #body-cell-isActive="props">
        <q-td :props="props">
          <q-icon
            :name="props.row.isActive ? 'check_circle' : 'cancel'"
            :color="props.row.isActive ? 'positive' : 'grey'"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="props.row.isActive"
            flat
            round
            dense
            icon="edit"
            color="primary"
            size="sm"
            @click="store.setRecordToEdit(props.row)"
          />
          <q-btn
            v-if="!props.row.isActive"
            flat
            round
            dense
            icon="delete"
            color="negative"
            size="sm"
            @click="onDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <AddEmploymentDetail :employee-id="employeeId" @saved="refresh" />
    <EditEmploymentDetail @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useEmploymentDetailStore,
  type EmploymentDetail,
} from 'src/stores/employment-detail-store';
import AddEmploymentDetail from './AddEmploymentDetail.vue';
import EditEmploymentDetail from './EditEmploymentDetail.vue';

const props = defineProps<{ employeeId: string }>();

const store = useEmploymentDetailStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'startDate', label: 'Start', field: 'startDate', align: 'left' },
  { name: 'endDate', label: 'End', field: (r) => r.endDate ?? '—', align: 'left' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'department', label: 'Department', field: (r) => r.department?.name ?? '—', align: 'left' },
  { name: 'worksite', label: 'Work site', field: (r) => r.worksite?.name ?? '—', align: 'left' },
  {
    name: 'payPeriodGroup',
    label: 'Pay period group',
    field: (r) => r.defaultPayPeriodGroup?.name ?? '—',
    align: 'left',
  },
  { name: 'contractType', label: 'Contract', field: (r) => r.contractType?.name ?? '—', align: 'left' },
  { name: 'jobTitle', label: 'Job title', field: (r) => r.jobTitle?.name ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmploymentDetail) {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Delete this historical employment contract?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Contract deleted.' });
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
