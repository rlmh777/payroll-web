<template>
  <div class="row items-center justify-center">
    <q-icon
      v-if="hasExceptions"
      :name="exceptionIcon"
      :color="exceptionColor"
      size="20px"
    >
      <TimesheetTooltip>{{ tooltipText }}</TimesheetTooltip>
    </q-icon>
    <q-icon
      v-else
      name="check_circle"
      color="positive"
      size="20px"
    >
      <TimesheetTooltip>{{ clearTooltipText }}</TimesheetTooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetRow } from '@payroll/stores/attendance-store';
import { timesheetExceptionSummary, timesheetExceptions } from '@hr/utils/timesheet-exception-utils';
import { timesheetPrimaryWithCommentTooltip } from '@hr/utils/timesheet-tooltip-utils';
import TimesheetTooltip from './TimesheetTooltip.vue';

const props = defineProps<{
  row: Pick<TimesheetRow, 'exceptions' | 'remarks' | 'comment'>;
}>();

const exceptions = computed(() => timesheetExceptions(props.row));
const hasExceptions = computed(() => exceptions.value.length > 0);
const hasErrors = computed(() => exceptions.value.some((exception) => exception.severity === 'error'));
const exceptionIcon = computed(() => (hasErrors.value ? 'error_outline' : 'warning_amber'));
const exceptionColor = computed(() => (hasErrors.value ? 'negative' : 'warning'));
const tooltipText = computed(() => timesheetPrimaryWithCommentTooltip(
  props.row,
  timesheetExceptionSummary(props.row),
));
const clearTooltipText = computed(() => timesheetPrimaryWithCommentTooltip(
  props.row,
  'No attendance exceptions',
));
</script>
