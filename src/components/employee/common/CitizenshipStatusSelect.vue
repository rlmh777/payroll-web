<template>
  <q-select
    v-model="selectedCitizenshipStatusId"
    :options="citizenshipStatusOptions"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    :readonly="readonly"
    label="Citizenship Status"
    :loading="employeeStore.isLoadingCitizenshipStatuses"
  >
    <template v-if="employeeStore.isLoadingCitizenshipStatuses" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { CitizenshipStatus } from '../../models';

interface Props {
  value?: string | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
});

const emit = defineEmits<{
  'update:citizenshipStatus': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const citizenshipStatusOptions = computed((): CitizenshipStatus[] => {
  return employeeStore.citizenshipStatuses;
});

const selectedCitizenshipStatusId = computed({
  get: (): string | null => {
    return props.value || null;
  },
  set: (value: string | null) => {
    emit('update:citizenshipStatus', value);
  },
});

// Fetch citizenship statuses on mount if not already loaded
onMounted(async () => {
    await employeeStore.fetchCitizenshipStatuses();
});
</script>

<style scoped>
</style>

