<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      placeholder="Search countries..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn label="New Country" color="primary" icon="add" dense @click="emit('openNew')" />
    <q-space />
  </q-card-section>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null | number): void;
  (e: 'search'): void;
  (e: 'openNew'): void;
}>();

// 👉 Watch for input changes & auto trigger search
watch(
  () => props.modelValue,
  () => {
    emit('search');
  },
);
</script>
