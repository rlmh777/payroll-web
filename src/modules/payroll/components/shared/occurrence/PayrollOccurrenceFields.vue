<template>
  <div class="payroll-occurrence-fields">
    <q-select
      :model-value="occurrence"
      :options="occurrenceOptions"
      option-value="value"
      option-label="label"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :label="label"
      :disable="disable"
      :clearable="clearable"
      :hint="clearable ? undefined : occurrenceHint"
      :rules="clearable ? [] : [(val: string | null | undefined) => !!val || 'Occurrence is required']"
      @filter="filterOccurrences"
      @update:model-value="onOccurrenceChange"
    />

    <q-input
      v-if="occurrence === PAYROLL_OCCURRENCE.nthOfMonth"
      class="q-mt-md"
      :model-value="occurrenceCycleOffset"
      type="number"
      min="1"
      max="5"
      step="1"
      outlined
      label="Which payroll of the month *"
      hint="1 is the first payday in the calendar month (for example the 15th). 2 is the second (the 30th, or the 28th in February)."
      :disable="disable"
      :rules="[requiredPositiveInteger]"
      @update:model-value="emitOffset"
    />

    <q-input
      v-if="occurrence === PAYROLL_OCCURRENCE.cycle"
      class="q-mt-md"
      :model-value="occurrenceCycleLength"
      type="number"
      min="2"
      max="26"
      step="1"
      outlined
      label="Cycle length *"
      hint="Apply on one payday out of every N expected paydays for this pay group, including paydays not generated yet."
      :disable="disable"
      :rules="[requiredCycleLength]"
      @update:model-value="emitLength"
    />

    <q-input
      v-if="occurrence === PAYROLL_OCCURRENCE.cycle"
      class="q-mt-md"
      :model-value="occurrenceCycleOffset"
      type="number"
      min="1"
      :max="occurrenceCycleLength || 26"
      step="1"
      outlined
      label="Which payday in the cycle *"
      hint="1 is the first payday of the cycle, 2 is the second, and so on."
      :disable="disable"
      :rules="[requiredCycleOffset]"
      @update:model-value="emitOffset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  PAYROLL_OCCURRENCE,
  PAYROLL_OCCURRENCE_OPTIONS,
  type PayrollOccurrence,
} from './payroll-occurrence';

interface Props {
  occurrence: PayrollOccurrence | null;
  occurrenceCycleLength?: number | null;
  occurrenceCycleOffset?: number | null;
  disable?: boolean;
  clearable?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  occurrenceCycleLength: null,
  occurrenceCycleOffset: null,
  disable: false,
  clearable: false,
  label: 'Payroll occurrence *',
});

const occurrenceHint = 'First/last of the month and cycle follow this pay group\'s rules (15th/30th, biweekly, or monthly), not only the schedules generated so far. Cycle counts expected paydays from the start of the year or a rules anchor date.';
const occurrenceOptions = ref([...PAYROLL_OCCURRENCE_OPTIONS]);

const filterOccurrences = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase().trim();
    occurrenceOptions.value = needle === ''
      ? [...PAYROLL_OCCURRENCE_OPTIONS]
      : PAYROLL_OCCURRENCE_OPTIONS.filter((option) => option.label.toLowerCase().includes(needle));
  });
};

const emit = defineEmits<{
  'update:occurrence': [value: PayrollOccurrence | null];
  'update:occurrenceCycleLength': [value: number | null];
  'update:occurrenceCycleOffset': [value: number | null];
}>();

const onOccurrenceChange = (value: PayrollOccurrence | null) => {
  emit('update:occurrence', value);
  if (value === PAYROLL_OCCURRENCE.nthOfMonth) {
    emit('update:occurrenceCycleLength', null);
    emit('update:occurrenceCycleOffset', props.occurrenceCycleOffset || 1);
    return;
  }
  if (value === PAYROLL_OCCURRENCE.cycle) {
    emit('update:occurrenceCycleLength', props.occurrenceCycleLength || 2);
    emit('update:occurrenceCycleOffset', props.occurrenceCycleOffset || 1);
    return;
  }
  emit('update:occurrenceCycleLength', null);
  emit('update:occurrenceCycleOffset', null);
};

const emitLength = (value: number | string | null) => {
  emit('update:occurrenceCycleLength', toNullableNumber(value));
};

const emitOffset = (value: number | string | null) => {
  emit('update:occurrenceCycleOffset', toNullableNumber(value));
};

const toNullableNumber = (value: number | string | null): number | null => {
  if (value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const requiredPositiveInteger = (val: number | null | undefined) => (
  val !== null && val !== undefined && val >= 1
) || 'Enter which payroll of the month (1 or 2 for 15th/30th paydays)';

const requiredCycleLength = (val: number | null | undefined) => (
  val !== null && val !== undefined && val >= 2
) || 'Cycle length must be 2 or greater';

const requiredCycleOffset = (val: number | null | undefined) => {
  if (val === null || val === undefined || val < 1) {
    return 'Enter which payday in the cycle';
  }
  if (props.occurrenceCycleLength && val > props.occurrenceCycleLength) {
    return 'Must be between 1 and the cycle length';
  }
  return true;
};
</script>

<style scoped>
.payroll-occurrence-fields :deep(.q-field__messages),
.payroll-occurrence-fields :deep(.q-field__messages > div) {
  line-height: 1.6;
}
</style>
