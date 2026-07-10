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
const lastSearch = ref('');

const options = computed(() => store.relationships);

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
  void store.fetchRelationships(1, 50);
}

onMounted(() => {
  if (!store.relationships.length) {
    void store.fetchRelationships(1, 50);
  }
});
</script>
