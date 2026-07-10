<template>
  <q-select
    v-model="selectedId"
    :options="options"
    option-value="id"
    option-label="name"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="300"
    outlined
    dense
    :label="label"
    :disable="disable"
    :loading="store.isLoadingDegrees"
    @filter="filterOptions"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDegreeStore } from 'src/stores/degree-store';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
}>(), {
  modelValue: null,
  label: 'Degree',
  disable: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

const store = useDegreeStore();
const lastSearch = ref('');

const options = computed(() =>
  store.degrees.map((degree) => ({
    id: Number(degree.id),
    name: degree.name,
  })),
);

const selectedId = computed({
  get: () => props.modelValue,
  set: (value: number | null) => emit('update:modelValue', value),
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => undefined);
  const search = val || '';
  if (search === lastSearch.value) return;
  lastSearch.value = search;
  store.search = search;
  void store.fetchDegrees(1, 50);
}

onMounted(() => {
  if (!store.degrees.length) {
    void store.fetchDegrees(1, 50);
  }
});
</script>
