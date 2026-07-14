<template>
  <DateField v-bind="props" @update:model-value="emit('update:modelValue', $event)" />
</template>

<script setup lang="ts">
import DateField, { type DateFieldRule } from '@core/components/common/DateField.vue';

const props = withDefaults(defineProps<{
  modelValue: string | null;
  label: string;
  disable?: boolean;
  clearable?: boolean;
  required?: boolean;
  stackLabel?: boolean;
  rules?: DateFieldRule[];
}>(), {
  disable: false,
  clearable: false,
  required: false,
  stackLabel: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();
</script>
