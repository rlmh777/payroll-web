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
    :loading="store.isLoadingRelationships"
    @filter="filterOptions"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRelationshipStore } from 'src/stores/relationship-store';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
}>(), {
  modelValue: null,
  label: 'Relationship',
  disable: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

const store = useRelationshipStore();
const filterText = ref('');

const selectedId = computed({
  get: () => props.modelValue,
  set: (value: number | null) => emit('update:modelValue', value),
});

const options = computed(() => {
  const needle = filterText.value.trim().toLowerCase();
  const source = store.relationships;
  if (!needle) {
    return [...source];
  }
  return source.filter((item) => (item.name || '').toLowerCase().includes(needle));
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    filterText.value = val || '';
  });
}

onMounted(async () => {
  if (!store.relationships.length) {
    await store.fetchRelationships(1, 100);
  }
});
</script>
