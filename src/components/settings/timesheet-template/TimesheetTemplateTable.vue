<template>
  <q-card class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      bordered
      :loading="loading"
      no-data-label="No timesheet templates defined."
    >
      <template #body-cell-schedule="props">
        <q-td :props="props">
          <div class="text-body2">{{ props.row.scheduleSummary }}</div>
          <div class="text-caption text-grey-7">{{ props.row.lunchSummary }}</div>
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="emit('edit', props.row)">
            <q-tooltip>Edit timesheet template</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import type { TimesheetTemplate } from 'src/stores/timesheet-template-store';

export interface TimesheetTemplateTableRow {
  id: string;
  name: string;
  scheduleSummary: string;
  lunchSummary: string;
  template: TimesheetTemplate;
}

defineProps<{
  rows: TimesheetTemplateTableRow[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'edit', row: TimesheetTemplateTableRow): void;
}>();

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'schedule', label: 'Schedule', field: 'scheduleSummary', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];
</script>
