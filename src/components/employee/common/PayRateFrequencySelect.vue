<template>
  <div>
    <q-select
      v-model="selectedFrequencyId"
      :options="frequencyOptions"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      :clearable="clearable"
      :label="label"
      :loading="employeeStore.isLoadingPayrateFrequencies"
      @filter="filterFrequencies"
    >
      <template v-if="employeeStore.isLoadingPayrateFrequencies" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name || scope.opt.id }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { PayrateFrequency } from '../../models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeFrequency?: string | null;
  disable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeFrequency: null,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Pay Rate Frequency',
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();

const frequencyOptions = computed((): PayrateFrequency[] => {
  return [...employeeStore.payrateFrequencies];
});

const filterFrequencies = (val: string, update: (callback: () => void) => void) => {
  // For now, just show all frequencies since there's no search endpoint
  update(() => {
    // Keep current options
  });
};

const selectedFrequencyId = computed({
  get: (): number | null => {
    return props.modelValue || null;
  },
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

// Fetch payrate frequencies on mount if not already loaded
onMounted(async () => {
  if (employeeStore.payrateFrequencies.length === 0) {
    await employeeStore.fetchPayrateFrequencies();
  }
});
</script>

<style scoped>
</style>

