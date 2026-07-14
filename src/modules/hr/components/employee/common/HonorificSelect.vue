<template>
  <q-select
    v-model="selectedHonorificId"
    :options="options"
    option-value="id"
    :option-label="honorificLabel"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    input-debounce="300"
    :readonly="readonly"
    label="Honorific"
    :loading="isInitialLoading"
    @filter="filterHonorifics"
    @filter-abort="onFilterAbort"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '@/stores/employee-store';
import type { Honorific } from '@core/types/models';

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
const options = ref<Honorific[]>([]);
const cachedHonorifics = ref<Honorific[]>([]);
const isInitialLoading = ref(false);
const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const filterGeneration = ref(0);

const honorificLabel = (honorific: Honorific): string => honorific.name || '';

function withSelected(items: Honorific[]): Honorific[] {
  const list = [...items];
  const selectedHonorific = employeeStore.selectedEmployee?.honorific;

  if (
    props.modelValue != null &&
    selectedHonorific &&
    String(selectedHonorific.id) === String(props.modelValue) &&
    !list.some((honorific) => String(honorific.id) === String(props.modelValue))
  ) {
    list.unshift(selectedHonorific);
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

const filterHonorifics = (
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
      options.value = withSelected(cachedHonorifics.value);
    });
    return;
  }

  void (async () => {
    const results = await employeeStore.fetchHonorifics(search, { silent: true });
    if (generation !== filterGeneration.value) {
      return;
    }
    update(() => {
      options.value = withSelected(results ?? []);
    });
  })();
};

const selectedHonorificId = computed({
  get: (): number | null => props.modelValue || null,
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

onMounted(async () => {
  isInitialLoading.value = true;
  try {
    if (employeeStore.honorifics.length === 0) {
      await employeeStore.fetchHonorifics('');
    }
    cachedHonorifics.value = [...employeeStore.honorifics];
    options.value = withSelected(cachedHonorifics.value);
  } finally {
    isInitialLoading.value = false;
  }
});

onUnmounted(() => {
  onFilterAbort();
});
</script>
