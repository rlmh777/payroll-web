<template>
  <q-select
    v-model="selectedGenderId"
    :options="genderOptions"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    :readonly="readonly"
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
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Gender } from '../../models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
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

// Fetch genders on mount if not already loaded
onMounted(async () => {
    await employeeStore.fetchGenders();
});
</script>

<style scoped>
</style>

