<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add education" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No education records"
    >
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <QualificationFormDialog
      v-model="dialogOpen"
      :employee-id="employeeId"
      :record="selectedRecord"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import QualificationFormDialog from './QualificationFormDialog.vue';
import {
  useEmployeeQualificationStore,
  type EmployeeQualification,
} from 'src/stores/employee-qualification-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeQualificationStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const selectedRecord = ref<EmployeeQualification | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'institution', label: 'Institution', field: (r) => r.institution?.name ?? '—', align: 'left' },
  { name: 'degree', label: 'Degree', field: (r) => r.degree?.name ?? '—', align: 'left' },
  { name: 'from', label: 'From', field: 'from', align: 'left' },
  { name: 'to', label: 'To', field: (r) => r.to ?? '—', align: 'left' },
  { name: 'note', label: 'Notes', field: (r) => r.note ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function openCreate() {
  selectedRecord.value = null;
  dialogOpen.value = true;
}

function openEdit(record: EmployeeQualification) {
  selectedRecord.value = record;
  dialogOpen.value = true;
}

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeQualification) {
  $q.dialog({
    title: 'Confirm delete',
    message: 'Delete this education record?',
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
