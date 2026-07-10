<template>
  <q-select
    v-model="selectedNationalityId"
    :options="nationalityOptions"
    option-value="id"
    :option-label="nationalityLabel"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    :readonly="readonly"
    label="Nationality"
    :loading="employeeStore.isLoadingNationalities"
    @filter="filterNationalities"
  >
    <template v-if="employeeStore.isLoadingNationalities" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Country } from '../../models';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeNationality?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeNationality: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const nationalityLabel = (country: Country): string =>
  country.nationalityName || country.name || '';

const isCountryInOptions = (countries: Country[], id: string | null): boolean =>
  Boolean(id && countries.some((country) => country.id === id));

const nationalityOptions = computed((): Country[] => {
  const options = [...employeeStore.nationalities];
  const selectedNationality = employeeStore.selectedEmployee?.nationality;

  if (
    props.modelValue &&
    selectedNationality?.id === props.modelValue &&
    !isCountryInOptions(options, props.modelValue)
  ) {
    return [selectedNationality, ...options];
  }

  return options;
});

const filterNationalities = (val: string, update: (callback: () => void) => void) => {
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
    void employeeStore.fetchNationalities(val || '');
  }, 300);
};

const selectedNationalityId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

// Fetch nationalities on mount if not already loaded
onMounted(async () => {
  await employeeStore.fetchNationalities(props?.employeeNationality || '');
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

