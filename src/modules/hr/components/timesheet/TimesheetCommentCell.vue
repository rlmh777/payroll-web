<template>
  <div class="row items-center justify-center">
    <q-icon
      :name="hasComment ? 'chat_bubble' : 'chat_bubble_outline'"
      :color="hasComment ? 'primary' : 'grey-5'"
      size="20px"
    >
      <TimesheetTooltip>{{ tooltipText }}</TimesheetTooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetRow } from '@payroll/stores/attendance-store';
import { timesheetRowMetadataTooltip } from '@hr/utils/timesheet-tooltip-utils';
import TimesheetTooltip from './TimesheetTooltip.vue';

const props = defineProps<{
  row: Pick<TimesheetRow, 'comment' | 'updatedByName' | 'updatedAt'>;
}>();

const hasComment = computed(() => Boolean((props.row.comment || '').trim()));
const tooltipText = computed(() => timesheetRowMetadataTooltip(props.row) || 'No comment');
</script>
