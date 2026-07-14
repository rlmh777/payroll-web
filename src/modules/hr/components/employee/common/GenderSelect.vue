<template>
  <q-select
    v-model="selectedGenderId"
    :options="genderOptions"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    outlined
    dense
    :readonly="readonly"
    :disable="disable"
    :clearable="clearable"
    :rules="rules"
    label="Gender"
    :loading="employeeStore.isLoadingGenders"
  >
    <template v-if="employeeStore.isLoadingGenders" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import type { Gender } from '@core/types/models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  disable?: boolean;
  clearable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  clearable: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();

const genderOptions = computed((): Gender[] => {
  return employeeStore.genders;
});

const selectedGenderId = computed({
  get: (): number | null => {
    return props.modelValue || null;
  },
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

onMounted(async () => {
  if (employeeStore.genders.length === 0) {
    await employeeStore.fetchGenders();
  }
});
</script>
