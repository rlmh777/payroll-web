<template>
  <q-select
    v-model="selectedCitizenshipStatusId"
    :options="options"
    option-value="id"
    option-label="name"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    input-debounce="0"
    :readonly="readonly"
    label="Citizenship Status"
    :loading="employeeStore.isLoadingCitizenshipStatuses"
    @filter="filterCitizenshipStatuses"
  >
    <template v-if="employeeStore.isLoadingCitizenshipStatuses" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import type { CitizenshipStatus } from '@core/types/models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeCitizenshipStatus?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeCitizenshipStatus: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();
const filterText = ref('');

const options = computed((): CitizenshipStatus[] => {
  const needle = filterText.value.trim().toLowerCase();
  const source = employeeStore.citizenshipStatuses;
  if (!needle) {
    return [...source];
  }
  return source.filter((status) => (status.name || '').toLowerCase().includes(needle));
});

const filterCitizenshipStatuses = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    filterText.value = val || '';
  });
};

const selectedCitizenshipStatusId = computed({
  get: (): number | null => props.modelValue || null,
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

onMounted(async () => {
  if (employeeStore.citizenshipStatuses.length === 0) {
    await employeeStore.fetchCitizenshipStatuses();
  }
});
</script>
