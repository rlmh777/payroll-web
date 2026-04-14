<template>
  <q-card class="q-pa-md">
    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered>
      <template #no-data>
        <div class="text-grey-6 q-pa-md">No department assignments yet.</div>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

type WorkShiftRow = {
  id: string;
  shift: string;
  departments: string;
  effective: string;
};

defineProps({
  rows: {
    type: Array as PropType<WorkShiftRow[]>,
    required: true,
  },
});

const columns = [
  { name: 'shift', label: 'Work timesheet', field: 'shift', align: 'left' as const },
  { name: 'departments', label: 'Departments', field: 'departments', align: 'left' as const },
  { name: 'effective', label: 'Effective date', field: 'effective', align: 'left' as const },
];
</script>
