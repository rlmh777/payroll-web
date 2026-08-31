<template>
  <div class="timesheet-punctuality-cell">
    <q-select
      v-if="!locked"
      :model-value="selectValue"
      :options="TIMESHEET_PUNCTUALITY_OPTIONS"
      emit-value
      map-options
      dense
      outlined
      hide-bottom-space
      :disable="saving"
      @update:model-value="onSelect($event)"
    />
    <q-chip
      v-else-if="displayStatus"
      dense
      square
      outline
      :color="punctualityColor(displayStatus)"
      :label="punctualityLabel(side, displayStatus, isAuto)"
    />
    <span v-else class="text-grey-6">—</span>
    <TimesheetTooltip v-if="tooltipText">{{ tooltipText }}</TimesheetTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimesheetRow } from '@payroll/stores/attendance-store';
import {
  TIMESHEET_PUNCTUALITY_OPTIONS,
  punctualityColor,
  punctualityLabel,
  punctualitySelectValue,
  punctualityTooltip,
  type TimesheetPunctualitySelection,
} from '@hr/utils/timesheet-punctuality-utils';
import TimesheetTooltip from './TimesheetTooltip.vue';

const props = defineProps<{
  row: TimesheetRow;
  side: 'clockIn' | 'clockOut';
  locked?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  save: [selection: TimesheetPunctualitySelection];
}>();

const displayStatus = computed(() =>
  props.side === 'clockIn' ? props.row.clockInPunctuality : props.row.clockOutPunctuality,
);

const isAuto = computed(() =>
  props.side === 'clockIn'
    ? props.row.clockInPunctualityAuto !== false
    : props.row.clockOutPunctualityAuto !== false,
);

const selectValue = computed(() => punctualitySelectValue(displayStatus.value, isAuto.value));

const tooltipText = computed(() => punctualityTooltip(props.side, props.row));

function onSelect(value: TimesheetPunctualitySelection) {
  emit('save', value);
}
</script>

<style scoped>
.timesheet-punctuality-cell {
  min-width: 120px;
}
</style>
