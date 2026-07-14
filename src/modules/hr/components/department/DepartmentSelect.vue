<template>
  <ParentDepartmentSelect
    v-model="selectedId"
    :label="props.label"
    :disable="props.disable"
    :clearable="props.clearable"
    show-add-new
    show-edit
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  clearable?: boolean;
}>(), {
  modelValue: null,
  label: 'Department',
  disable: false,
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value) => emit('update:modelValue', value),
});
</script>
