<template>
  <div>
    <q-select
      v-model="selectedId"
      :options="selectOptions"
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
      <template #selected>
        <DocumentTagChip
          v-if="selectedTag"
          :label="selectedLabel"
          :color="selectedTag.color ?? null"
        />
      </template>

      <template #option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openCreateDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add new tag</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-else v-bind="scope.itemProps">
          <q-item-section avatar>
            <q-badge :style="chipStyle(scope.opt.color)" class="tag-dot" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt)"
            >
              <q-tooltip>Edit tag</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <DocumentTagFormDialog
      v-model="showFormDialog"
      :tag-id="editingTagId"
      compact
      @saved="onTagSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DocumentTagFormDialog from '@core/settings/document-tag/DocumentTagFormDialog.vue';
import DocumentTagChip from '@core/settings/document-tag/DocumentTagChip.vue';
import {
  buildDocumentTagPath,
  resolveDocumentTag,
  resolveDocumentTagColor,
  useDocumentTagStore,
  type DocumentTag,
} from 'src/stores/document-tag-store';

interface TagSelectOption {
  id: string;
  label: string;
  color?: string | null;
}

const props = withDefaults(defineProps<{
  modelValue?: string | null;
  label?: string;
  disable?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Tag',
  disable: false,
  showEdit: true,
});

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();

const store = useDocumentTagStore();
const filterText = ref('');
const showFormDialog = ref(false);
const editingTagId = ref<string | null>(null);

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: string | null) => {
    if (value === 'add-new') {
      openCreateDialog();
      return;
    }
    emit('update:modelValue', value);
  },
});

const selectedTag = computed(() => resolveDocumentTag(store.tagOptions, props.modelValue));

const selectedLabel = computed(() => {
  if (!selectedTag.value) {
    return '';
  }
  return buildDocumentTagPath(store.tagOptions, selectedTag.value.id) || selectedTag.value.name;
});

const tagOptions = computed<TagSelectOption[]>(() => {
  const search = filterText.value.trim().toLowerCase();
  return store.tagOptions
    .filter((tag) => !search || formatLabel(tag).toLowerCase().includes(search))
    .map((tag) => ({
      id: tag.id,
      label: formatLabel(tag),
      color: tag.color ?? null,
    }));
});

const selectOptions = computed(() => {
  const options: Array<TagSelectOption | { id: string; label: string }> = [...tagOptions.value];
  if (!props.disable) {
    options.unshift({ id: 'add-new', label: 'Add new tag' });
  }
  return options;
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

function openCreateDialog() {
  editingTagId.value = null;
  showFormDialog.value = true;
}

function openEditDialog(option: TagSelectOption) {
  editingTagId.value = option.id;
  showFormDialog.value = true;
}

function onTagSaved(tag: DocumentTag) {
  emit('update:modelValue', tag.id);
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
