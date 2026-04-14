<template>
  <q-card class="q-pa-md">
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered>
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
  days: string[];
};

defineProps({
  rows: {
    type: Array as PropType<WorkTimesheetRow[]>,
    required: true,
  },
});

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
];
</script>
