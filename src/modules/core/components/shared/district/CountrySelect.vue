<template>
  <q-select
    v-model="selectedCountryId"
    :options="countryOptions"
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
    label="Country"
    :loading="districtStore.isLoadingCountries"
    @filter="filterCountries"
  >
    <template v-if="districtStore.isLoadingCountries" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDistrictStore } from '@core/stores/district-store';
import type { Country } from '@core/types/models';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeCountry?: string | null;
  initialCountry?: Country | null;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeCountry: null,
  initialCountry: null,
  disable: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  change: [value: string | null];
}>();

const districtStore = useDistrictStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const countryOptions = computed((): Country[] => {
  const countries = districtStore.countries;
  const initial = props.initialCountry;

  if (initial?.id && !countries.some((country) => country.id === initial.id)) {
    return [initial, ...countries];
  }

  return countries;
});

const filterCountries = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all countries without fetching
  if (!val || val.trim() === '') {
    update(() => {
      // Keep current options - no need to refetch
    });
    return;
  }

  // Call update immediately to show we're handling it
  update(() => {
    // Keep current options while fetching
  });

  // Debounce API calls - wait 300ms after user stops typing
  filterTimeout.value = setTimeout(() => {
    void districtStore.fetchCountries(val);
  }, 300);
};

const selectedCountryId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const loadCountries = async () => {
  const search =
    props.initialCountry?.name?.trim()
    || props.employeeCountry?.trim()
    || '';

  await districtStore.fetchCountries(search);
};

watch(
  () => props.initialCountry,
  () => {
    void loadCountries();
  },
);

onMounted(() => {
  void loadCountries();
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped></style>
