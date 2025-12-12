<template>
  <q-select
    v-model="selectedDuration"
    :options="availableOptions"
    option-value="value"
    option-label="label"
    emit-value
    map-options
    outlined
    dense
    label="Duration *"
    :rules="[(val: string | null | undefined) => !!val || 'Duration is required']"
    :disable="disable"
    @update:model-value="onDurationChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  disable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  startDate: null,
  endDate: null,
  disable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const allOptions = [
  { value: 'Full Day', label: 'Full Day' },
  { value: 'All Days', label: 'All Days' },
  { value: 'Morning', label: 'Morning' },
  { value: 'Afternoon', label: 'Afternoon' },
  { value: 'Custom', label: 'Custom' },
];

const availableOptions = computed(() => {
  if (!props.startDate || !props.endDate) {
    return allOptions;
  }

  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  const isSingleDay = start.toDateString() === end.toDateString();

  if (isSingleDay) {
    // Single day: show Full Day, Morning, Afternoon, Custom (exclude All Days)
    return allOptions.filter(opt => opt.value !== 'All Days');
  } else {
    // Multiple days: show All Days, Morning, Afternoon, Custom (exclude Full Day)
    return allOptions.filter(opt => opt.value !== 'Full Day');
  }
});

const selectedDuration = computed({
  get: (): string | null => {
    return props.modelValue;
  },
  set: (value: string | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const onDurationChange = (value: string | null) => {
  emit('change', value);
};
</script>

<style scoped>
</style>

