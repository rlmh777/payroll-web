<template>
  <q-dialog :model-value="props.modelValue" @update:model-value="emit('update:modelValue', Boolean($event))">
    <q-card class="approval-dialog">
      <q-card-section class="row items-start no-wrap q-gutter-md">
        <q-avatar :color="`${actionColor}-1`" :text-color="actionColor" :icon="actionIcon" size="42px" />
        <div>
          <div class="text-h6">{{ actionLabel }} timesheet</div>
          <div class="text-body2 text-grey-7">
            {{ props.target?.employeeName || 'Unknown employee' }} · {{ props.target?.date }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ formatHours(props.target?.regularHours) }} regular hrs ·
            {{ formatHours(props.target?.overtimeHours) }} overtime hrs
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-input
          :model-value="props.remarks"
          type="textarea"
          outlined
          autogrow
          label="Review notes"
          hint="Optional for approval; recommended when rejecting a timesheet."
          @update:model-value="emit('update:remarks', String($event ?? ''))"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="emit('update:modelValue', false)" />
        <q-btn
          unelevated
          :color="actionColor"
          :icon="actionIcon"
          :label="`${actionLabel} timesheet`"
          :loading="props.isUpdatingApproval"
          @click="emit('submit')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetApprovalAction } from './types';
import type { TimesheetRow } from '@payroll/stores/attendance-store';

const props = defineProps<{
  modelValue: boolean;
  target: TimesheetRow | null;
  action: TimesheetApprovalAction;
  remarks: string;
  isUpdatingApproval: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'update:remarks', value: string): void;
  (event: 'submit'): void;
}>();

const actionColor = computed(() => (props.action === 'APPROVED' ? 'positive' : 'negative'));
const actionLabel = computed(() => (props.action === 'APPROVED' ? 'Approve' : 'Reject'));
const actionIcon = computed(() => (props.action === 'APPROVED' ? 'check_circle' : 'cancel'));

function formatHours(value?: number | null) {
  return Number(value || 0).toFixed(2);
}
</script>

<style scoped>
.approval-dialog {
  width: min(520px, calc(100vw - 32px));
  border-radius: 14px;
}
</style>
