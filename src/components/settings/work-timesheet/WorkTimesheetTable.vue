<template>
  <q-card class="q-pa-md">
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            icon="edit"
            color="primary"
            size="sm"
            @click="$emit('edit', props.row)"
          >
            <q-tooltip>Edit Working Hours Timesheet</q-tooltip>
          </q-btn>
        </q-td>
      </template>

      <template #no-data>
        <div class="text-grey-6 q-pa-md">No work timesheets defined.</div>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

type WorkTimesheetRow = {
  id: string;
  name: string;
  start: string;
  end: string;
  breakMinutes: number;
  days: string[];
};

defineProps({
  rows: {
    type: Array as PropType<WorkTimesheetRow[]>,
    required: true,
  },
});

defineEmits<{
  (event: 'edit', row: WorkTimesheetRow): void;
}>();

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const },
  { name: 'start', label: 'Start', field: 'start', align: 'left' as const },
  { name: 'end', label: 'End', field: 'end', align: 'left' as const },
  {
    name: 'days',
    label: 'Days',
    field: (row: WorkTimesheetRow) => row.days.join(', '),
    align: 'left' as const,
  },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];
</script>
