<template>
  <q-select
    v-model="selectedId"
    :options="options"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    outlined
    dense
    :label="label"
    :disable="disable"
    :clearable="clearable"
    :rules="rules"
    :loading="employeeStore.isLoadingPaymentMethods"
    @filter="filterOptions"
  >
    <template v-if="employeeStore.isLoadingPaymentMethods" #prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import type { PaymentMethod } from '@core/types/models';

const props = withDefaults(defineProps<{
  modelValue?: number | string | null;
  label?: string;
  disable?: boolean;
  clearable?: boolean;
  rules?: Array<(val: number | string | null | undefined) => boolean | string>;
}>(), {
  modelValue: null,
  label: 'Payment method',
  disable: false,
  clearable: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null];
}>();

const employeeStore = useEmployeeStore();
const filterText = ref('');

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: number | string | null) => {
    emit('update:modelValue', value);
  },
});

const options = computed((): PaymentMethod[] => {
  const needle = filterText.value.trim().toLowerCase();
  const source = employeeStore.paymentMethods;
  if (!needle) {
    return [...source];
  }
  return source.filter((item) => (item.name || '').toLowerCase().includes(needle));
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    filterText.value = val || '';
  });
}

onMounted(async () => {
  if (employeeStore.paymentMethods.length === 0) {
    await employeeStore.fetchPaymentMethods();
  }
});
</script>
