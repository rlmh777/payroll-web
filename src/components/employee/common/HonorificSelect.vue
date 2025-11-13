<template>
  <q-select
    v-model="selectedHonorificId"
    :options="honorificOptions"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    :readonly="readonly"
    label="Honorific"
    :loading="employeeStore.isLoadingHonorifics"
  >
    <template v-if="employeeStore.isLoadingHonorifics" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Honorific } from '../../models';

interface Props {
  value?: string | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
});

const emit = defineEmits<{
  'update:honorific': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const honorificOptions = computed((): Honorific[] => {
  return employeeStore.honorifics;
});

const selectedHonorificId = computed({
  get: (): string | null => {
    return props.value || null;
  },
  set: (value: string | null) => {
    emit('update:honorific', value);
  },
});

// Fetch honorifics on mount if not already loaded
onMounted(async () => {
    await employeeStore.fetchHonorifics();
});
</script>

<style scoped>
</style>

