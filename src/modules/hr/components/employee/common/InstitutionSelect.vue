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
    input-debounce="0"
    outlined
    dense
    :label="label"
    :disable="disable"
    :loading="store.isLoadingInstitutions"
    @filter="filterOptions"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useInstitutionStore } from 'src/stores/institution-store';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
}>(), {
  modelValue: null,
  label: 'Institution',
  disable: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

const store = useInstitutionStore();
const filterText = ref('');

const selectedId = computed({
  get: () => props.modelValue,
  set: (value: number | null) => emit('update:modelValue', value),
});

const options = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  const source = store.institutions.map((item) => ({
    id: Number(item.id),
    name: item.name,
  }));
  if (!needle) {
    return source;
  }
  return source.filter((item) => (item.name || '').toLowerCase().includes(needle));
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    filterText.value = val || '';
  });
}

onMounted(async () => {
  if (!store.institutions.length) {
    await store.fetchInstitutions(1, 100);
  }
});
</script>
