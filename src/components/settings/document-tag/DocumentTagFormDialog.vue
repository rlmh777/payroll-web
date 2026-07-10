<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit document tag' : 'Add document tag' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="close" />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input v-model="form.name" label="Name *" outlined dense :disable="saving" />
          <ParentDocumentTagSelect
            v-model="form.parentId"
            label="Parent tag"
            :exclude-tag-id="tagId ?? null"
            :disable="saving"
            show-colors
          />
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Color</div>
            <div class="row items-center q-gutter-sm">
              <q-color v-model="form.color" format-model="hex" :disable="saving" class="tag-color-picker" />
              <DocumentTagChip :label="form.name || 'Preview'" :color="form.color" />
            </div>
          </div>
          <q-input
            v-model="form.description"
            type="textarea"
            label="Description"
            outlined
            dense
            :disable="saving"
          />
          <template v-if="!compact">
            <q-input
              v-model.number="form.sortOrder"
              type="number"
              min="0"
              label="Sort order"
              outlined
              dense
              :disable="saving"
            />
            <q-toggle v-model="form.isActive" label="Active" :disable="saving" />
          </template>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import ParentDocumentTagSelect from './ParentDocumentTagSelect.vue';
import DocumentTagChip from './DocumentTagChip.vue';
import {
  DEFAULT_DOCUMENT_TAG_COLOR,
  useDocumentTagStore,
  type DocumentTag,
} from 'src/stores/document-tag-store';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  tagId?: string | null;
  initialParentId?: string | null;
  compact?: boolean;
}>(), {
  tagId: null,
  initialParentId: null,
  compact: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [tag: DocumentTag];
}>();

const $q = useQuasar();
const store = useDocumentTagStore();
const saving = ref(false);

const isEdit = computed(() => Boolean(props.tagId));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  name: '',
  parentId: null as string | null,
  description: '',
  color: DEFAULT_DOCUMENT_TAG_COLOR,
  sortOrder: 0,
  isActive: true,
});

function resetForm() {
  form.name = '';
  form.parentId = props.initialParentId ?? null;
  form.description = '';
  form.color = DEFAULT_DOCUMENT_TAG_COLOR;
  form.sortOrder = 0;
  form.isActive = true;
}

function loadTag(tag: DocumentTag) {
  form.name = tag.name;
  form.parentId = tag.parentId ?? null;
  form.description = tag.description ?? '';
  form.color = tag.color ?? DEFAULT_DOCUMENT_TAG_COLOR;
  form.sortOrder = tag.sortOrder ?? 0;
  form.isActive = tag.isActive ?? true;
}

watch(
  () => [props.modelValue, props.tagId] as const,
  async ([isOpen, tagId]) => {
    if (!isOpen) {
      return;
    }

    if (store.tagOptions.length === 0) {
      await store.fetchTagOptions();
    }

    if (tagId) {
      const existing = store.tagOptions.find((tag) => tag.id === tagId)
        ?? store.tags.find((tag) => tag.id === tagId);
      if (existing) {
        loadTag(existing);
        return;
      }
    }

    resetForm();
  },
  { immediate: true },
);

function onDialogUpdate(value: boolean) {
  open.value = value;
}

function close() {
  open.value = false;
}

async function save() {
  if (!form.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Name is required.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      parentId: form.parentId || null,
      description: form.description || null,
      color: form.color || DEFAULT_DOCUMENT_TAG_COLOR,
      sortOrder: form.sortOrder ?? 0,
      isActive: form.isActive,
    };

    const tag = isEdit.value && props.tagId
      ? await store.updateTag(props.tagId, payload)
      : await store.createTag(payload);

    $q.notify({ color: 'positive', position: 'top', message: 'Document tag saved.' });
    emit('saved', tag);
    close();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.drawer-card {
  width: 32vw;
  max-width: 440px;
  height: 100vh;
}

.tag-color-picker {
  max-width: 220px;
}
</style>
