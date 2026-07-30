<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add certification" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No certifications"
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <CertificationFormDialog
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
import CertificationFormDialog from './CertificationFormDialog.vue';
import {
  useEmployeeCertificationStore,
  type EmployeeCertification,
} from 'src/stores/employee-certification-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeCertificationStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const selectedRecord = ref<EmployeeCertification | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Certification', field: 'name', align: 'left' },
  { name: 'issuingOrganization', label: 'Issuer', field: (r) => r.issuingOrganization ?? '—', align: 'left' },
  { name: 'credentialId', label: 'Credential ID', field: (r) => r.credentialId ?? '—', align: 'left' },
  { name: 'issuedOn', label: 'Issued', field: (r) => r.issuedOn ?? '—', align: 'left' },
  { name: 'expiresOn', label: 'Expires', field: (r) => r.expiresOn ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function openCreate() {
  selectedRecord.value = null;
  dialogOpen.value = true;
}

function openEdit(record: EmployeeCertification) {
  selectedRecord.value = record;
  dialogOpen.value = true;
}

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeCertification) {
  $q.dialog({
    title: 'Confirm delete',
    message: 'Delete this certification?',
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
