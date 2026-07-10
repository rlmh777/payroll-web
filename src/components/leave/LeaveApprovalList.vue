<template>
  <q-card class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1">Leave approvals</div>
      <div class="row items-center q-gutter-sm">
        <q-btn dense outline color="primary" label="Refresh" @click="emit('refresh')" />
        <q-badge v-if="rows.length" color="primary" :label="rows.length" />
      </div>
    </div>

    <q-table :rows="rows" :columns="columns" row-key="id" flat bordered>
      <template #body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="leaveStatusColor(props.row.status)"
            :label="formatLeaveStatus(props.row.status)"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense flat color="primary" icon="check" @click="emit('approve', props.row)" />
          <q-btn dense flat color="negative" icon="close" @click="emit('reject', props.row)" />
        </q-td>
      </template>
      <template #no-data>
        <div class="text-grey-6 q-pa-md">No leave approvals pending.</div>
      </template>
    </q-table>
  </q-card>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { formatLeaveStatus, leaveStatusColor } from 'src/utils/leave-status';

type LeaveApprovalRow = {
  id: string;
  employee: string;
  date: string;
  description: string;
  type: string;
  status?: string | null;
};

defineProps({
  rows: {
    type: Array as PropType<LeaveApprovalRow[]>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'approve', row: LeaveApprovalRow): void;
  (event: 'reject', row: LeaveApprovalRow): void;
  (event: 'refresh'): void;
}>();

const columns = [
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' as const },
  { name: 'date', label: 'Date', field: 'date', align: 'left' as const },
  { name: 'description', label: 'Description', field: 'description', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];
</script>
