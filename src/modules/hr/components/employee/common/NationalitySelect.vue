<template>
  <q-select
    v-model="selectedNationalityId"
    :options="options"
    option-value="id"
    :option-label="nationalityLabel"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    input-debounce="300"
    :readonly="readonly"
    label="Nationality"
    :loading="isInitialLoading"
    @filter="filterNationalities"
    @filter-abort="onFilterAbort"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import type { Country } from '@core/types/models';

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
const options = ref<Country[]>([]);
const cachedNationalities = ref<Country[]>([]);
const isInitialLoading = ref(false);
const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const filterGeneration = ref(0);

const nationalityLabel = (country: Country): string =>
  country.nationalityName || country.name || '';

function withSelected(items: Country[]): Country[] {
  const list = [...items];
  const selectedNationality = employeeStore.selectedEmployee?.nationality;

  if (
    props.modelValue &&
    selectedNationality?.id === props.modelValue &&
    !list.some((country) => country.id === props.modelValue)
  ) {
    list.unshift(selectedNationality);
  }

  return list;
}

function onFilterAbort() {
  filterGeneration.value += 1;
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
    filterTimeout.value = null;
  }
}

const filterNationalities = (
  val: string,
  update: (callback: () => void) => void,
) => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
    filterTimeout.value = null;
  }

  const search = (val || '').trim();
  const generation = ++filterGeneration.value;

  if (!search) {
    update(() => {
      options.value = withSelected(cachedNationalities.value);
    });
    return;
  }

  void (async () => {
    const results = await employeeStore.fetchNationalities(search, { silent: true });
    if (generation !== filterGeneration.value) {
      return;
    }
    update(() => {
      options.value = withSelected(results ?? []);
    });
  })();
};

const selectedNationalityId = computed({
  get: (): string | null => props.modelValue || null,
  set: (value: string | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

onMounted(async () => {
  isInitialLoading.value = true;
  try {
    if (employeeStore.nationalities.length === 0) {
      await employeeStore.fetchNationalities('');
    }
    cachedNationalities.value = [...employeeStore.nationalities];
    options.value = withSelected(cachedNationalities.value);
  } finally {
    isInitialLoading.value = false;
  }
});

onUnmounted(() => {
  onFilterAbort();
});
</script>
