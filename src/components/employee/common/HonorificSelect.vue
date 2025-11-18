<template>
  <q-select
    v-model="selectedHonorificId"
    :options="honorificOptions"
    option-value="id"
    option-label="name"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    :readonly="readonly"
    label="Honorific"
    :loading="employeeStore.isLoadingHonorifics"
    @filter="filterHonorifics"
  >
    <template v-if="employeeStore.isLoadingHonorifics" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Honorific } from '../../models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeHonorific?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeHonorific: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const honorificOptions = computed((): Honorific[] => {
  return employeeStore.honorifics;
});

const filterHonorifics = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // Call update immediately to show that we're handling the filter
  // This is required for Quasar to know the filter is being processed
  update(() => {
    // For now, keep current options while we fetch new ones
    // The options will update reactively when the API call completes
  });

  // Debounce API calls - wait 300ms after user stops typing
  filterTimeout.value = setTimeout(() => {
    // Call async function without awaiting - the callback must be synchronous
    void employeeStore.fetchHonorifics(val || '');
  }, 300);
};

const selectedHonorificId = computed({
  get: (): number | null => {
    return props.modelValue || null;
  },
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

// Fetch honorifics on mount if not already loaded
onBeforeMount(async () => {
  await employeeStore.fetchHonorifics(props?.employeeHonorific || '');
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped>
</style>

