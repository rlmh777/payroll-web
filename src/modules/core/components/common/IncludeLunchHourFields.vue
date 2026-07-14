<template>
  <div class="include-lunch-hour-fields">
    <q-toggle
      :model-value="includeLunchHour"
      :label="toggleLabel"
      :hint="toggleHint"
      :disable="resolvedDisable"
      @update:model-value="emit('update:includeLunchHour', Boolean($event))"
    />

    <q-input
      v-if="includeLunchHour"
      :model-value="resolvedLunchHourHours"
      type="number"
      step="0.25"
      min="0"
      max="8"
      :label="hoursLabel"
      :hint="hoursHint"
      outlined
      dense
      :disable="resolvedDisable"
      class="q-mt-sm"
      @update:model-value="emit('update:lunchHourHours', parseHours($event))"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    includeLunchHour: boolean;
    lunchHourHours?: number | null | undefined;
    disable?: boolean | undefined;
    toggleLabel?: string | undefined;
    toggleHint?: string | undefined;
    hoursLabel?: string | undefined;
    hoursHint?: string | undefined;
  }>(),
  {
    lunchHourHours: 1,
    disable: false,
    toggleLabel: 'Include lunch hour',
    toggleHint: 'When enabled, lunch time is deducted from payable hours.',
    hoursLabel: 'Lunch hours',
    hoursHint: 'Hours to subtract from worked time (default 1).',
  },
);

const emit = defineEmits<{
  (event: 'update:includeLunchHour', value: boolean): void;
  (event: 'update:lunchHourHours', value: number): void;
}>();

const resolvedLunchHourHours = computed(() => props.lunchHourHours ?? 1);
const resolvedDisable = computed(() => props.disable ?? false);

function parseHours(value: string | number | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}
</script>
