<template>
  <q-select
    v-model="selectedId"
    :options="options"
    option-value="id"
    option-label="label"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="300"
    outlined
    dense
    clearable
    :label="label"
    :disable="disable"
    :loading="store.isLoadingOptions"
    @filter="filterOptions"
  >
    <template v-if="showColors" #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-badge :style="chipStyle(scope.opt.color)" class="tag-dot" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  buildDocumentTagPath,
  resolveDocumentTagColor,
  useDocumentTagStore,
  type DocumentTag,
} from 'src/stores/document-tag-store';

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label?: string;
  disable?: boolean;
  excludeTagId?: string | null;
  showColors?: boolean;
}>(), {
  modelValue: null,
  label: 'Document tag',
  disable: false,
  excludeTagId: null,
  showColors: false,
});

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();

const store = useDocumentTagStore();
const filterText = ref('');

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: string | null) => emit('update:modelValue', value),
});

const options = computed(() => {
  const search = filterText.value.trim().toLowerCase();
  return store.tagOptions
    .filter((tag) => tag.id !== props.excludeTagId)
    .filter((tag) => !search || formatLabel(tag).toLowerCase().includes(search))
    .map((tag) => ({
      id: tag.id,
      label: formatLabel(tag),
      color: tag.color,
    }));
});

function formatLabel(tag: DocumentTag) {
  return buildDocumentTagPath(store.tagOptions, tag.id) || tag.name;
}

function chipStyle(color?: string | null) {
  const bg = resolveDocumentTagColor(color);
  return {
    backgroundColor: bg,
    color: '#fff',
  };
}

function filterOptions(val: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = val;
  });
}

onMounted(async () => {
  if (store.tagOptions.length === 0) {
    await store.fetchTagOptions();
  }
});
</script>

<style scoped>
.tag-dot {
  min-width: 14px;
  min-height: 14px;
  border-radius: 50%;
  padding: 0;
}
</style>
