<template>
  <q-select
    v-model="selectedLocalityId"
    :options="localityOptions"
    option-value="id"
    option-label="name"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    :readonly="readonly"
    label="Locality"
    :loading="employeeStore.isLoadingLocalities"
    @filter="filterLocalities"
  >
    <template v-if="employeeStore.isLoadingLocalities" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Locality } from '../../models';

interface Props {
  value?: string | null;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
});

const emit = defineEmits<{
  'update:locality': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const localityOptions = computed((): Locality[] => {
  return employeeStore.localities;
});

const filterLocalities = (val: string, update: (callback: () => void) => void) => {
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
    void employeeStore.fetchLocalities(val || '');
  }, 300);
};

const selectedLocalityId = computed({
  get: (): string | null => {
    return props.value || null;
  },
  set: (value: string | null) => {
    emit('update:locality', value);
  },
});

// Fetch localities on mount if not already loaded
onMounted(async () => {
  await employeeStore.fetchLocalities('');
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

