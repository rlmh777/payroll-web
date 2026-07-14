<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn
        color="primary"
        icon="add"
        label="Add Incident"
        dense
        @click="store.openCreateDialog()"
      />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No incidents recorded"
    >
      <template #body-cell-severity="props">
        <q-td :props="props">
          <q-badge
            :color="incidentSeverityColor(props.row.severity)"
            :label="formatIncidentSeverity(props.row.severity)"
          />
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="incidentStatusColor(props.row.status)"
            :label="formatIncidentStatus(props.row.status)"
          />
        </q-td>
      </template>

      <template #body-cell-attachments="props">
        <q-td :props="props">
          <div v-if="props.row.attachments?.length" class="text-caption q-gutter-xs">
            <a
              v-for="file in props.row.attachments"
              :key="file.id"
              class="text-primary"
              :href="file.fileUrl || '#'"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ file.fileName }}
            </a>
          </div>
          <span v-else class="text-grey-5">—</span>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="primary"
            size="sm"
            @click="store.setRecordToEdit(props.row)"
          />
          <q-btn
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

    <EmployeeIncidentFormDialog
      mode="create"
      :employee-id="employeeId"
      @saved="refresh"
    />
    <EmployeeIncidentFormDialog
      mode="edit"
      :employee-id="employeeId"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import type { EmployeeIncident } from '@core/types/models';
import EmployeeIncidentFormDialog from './EmployeeIncidentFormDialog.vue';
import {
  formatIncidentAction,
  formatIncidentSeverity,
  formatIncidentStatus,
  formatIncidentType,
  incidentSeverityColor,
  incidentStatusColor,
  useEmployeeIncidentStore,
} from '@hr/stores/employee-incident-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeIncidentStore();
const $q = useQuasar();

const columns: QTableProps['columns'] = [
  { name: 'incidentDate', label: 'Date', field: 'incidentDate', align: 'left', sortable: true },
  {
    name: 'incidentType',
    label: 'Type',
    field: (row: EmployeeIncident) => formatIncidentType(row.incidentType),
    align: 'left',
  },
  { name: 'title', label: 'Title', field: 'title', align: 'left' },
  { name: 'severity', label: 'Severity', field: 'severity', align: 'left' },
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  {
    name: 'actionTaken',
    label: 'Action',
    field: (row: EmployeeIncident) => formatIncidentAction(row.actionTaken),
    align: 'left',
  },
  { name: 'attachments', label: 'Files', field: 'attachments', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeIncident) {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete incident "${row.title}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Incident deleted.' });
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
