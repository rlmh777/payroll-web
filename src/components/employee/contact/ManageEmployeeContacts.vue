<template>
  <div>
    <div class="text-body2 text-grey-7 q-mb-md">
      Emergency contacts, dependents, and professional references for this employee.
    </div>

    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add contact" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No contacts"
    >
      <template #body-cell-isDependent="props">
        <q-td :props="props">
          <q-icon :name="props.row.isDependent ? 'check_circle' : 'remove'" :color="props.row.isDependent ? 'positive' : 'grey'" />
        </q-td>
      </template>
      <template #body-cell-isProfessionalReference="props">
        <q-td :props="props">
          <q-icon
            :name="props.row.isProfessionalReference ? 'check_circle' : 'remove'"
            :color="props.row.isProfessionalReference ? 'positive' : 'grey'"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <ContactFormDialog
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
import ContactFormDialog from './ContactFormDialog.vue';
import {
  useEmployeeContactStore,
  type EmployeeContactRecord,
} from 'src/stores/employee-contact-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeContactStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const selectedRecord = ref<EmployeeContactRecord | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: (r) => `${r.firstName} ${r.lastName}`.trim(), align: 'left' },
  { name: 'relationship', label: 'Relationship', field: (r) => r.relationship?.name ?? '—', align: 'left' },
  { name: 'phoneNumber1', label: 'Phone', field: 'phoneNumber1', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'isDependent', label: 'Dependent', field: 'isDependent', align: 'center' },
  { name: 'isProfessionalReference', label: 'Reference', field: 'isProfessionalReference', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function openCreate() {
  selectedRecord.value = null;
  dialogOpen.value = true;
}

function openEdit(record: EmployeeContactRecord) {
  selectedRecord.value = record;
  dialogOpen.value = true;
}

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeContactRecord) {
  $q.dialog({
    title: 'Confirm delete',
    message: 'Delete this contact?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Contact deleted.' });
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
