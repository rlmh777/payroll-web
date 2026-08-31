<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit document' : 'Add document' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <DocumentTagSelect v-model="form.documentTagId" :disable="saving" />
            </div>
            <div class="col-12">
              <q-file
                v-model="form.documentFile"
                :label="isEdit ? 'Document file' : 'Document file *'"
                hint="PDF, Word, Excel, images, or text. Max 20 MB."
                :accept="EMPLOYEE_DOCUMENT_ACCEPT"
                dense
                outlined
                clearable
                :disable="saving"
                @update:model-value="onFileSelected"
              >
                <template #prepend>
                  <q-icon name="upload_file" />
                </template>
              </q-file>
            </div>
            <div
              v-if="existingFileName && !form.documentFile"
              class="col-12 text-caption text-grey-7"
            >
              Current file:
              <a
                v-if="existingFileUrl"
                :href="existingFileUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ existingFileName }}
              </a>
              <span v-else>{{ existingFileName }}</span>
            </div>
            <div class="col-12">
              <q-input v-model="form.name" label="Name *" dense outlined :disable="saving" @update:model-value="onNameInput" />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.description"
                type="textarea"
                label="Description"
                dense
                outlined
                :disable="saving"
              />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
        <q-btn color="primary" :loading="saving" label="Save" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import DocumentTagSelect from './DocumentTagSelect.vue';
import {
  EMPLOYEE_DOCUMENT_ACCEPT,
  employeeDocumentDisplayName,
  nameFromUploadedFile,
  resolveEmployeeDocumentFileUrl,
} from './employee-document-form';
import {
  useEmployeeDocumentStore,
  type EmployeeDocument,
} from 'src/stores/employee-document-store';

const props = defineProps<{
  employeeId: string;
  modelValue: boolean;
  record?: EmployeeDocument | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useEmployeeDocumentStore();
const saving = ref(false);
const nameTouched = ref(false);

const isEdit = computed(() => Boolean(props.record?.id));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  documentTagId: null as string | null,
  documentFile: null as File | null,
  name: '',
  description: '',
});

const existingFileName = computed(() => employeeDocumentDisplayName(
  props.record?.fileName,
  props.record?.filePath,
));

const existingFileUrl = computed(() => resolveEmployeeDocumentFileUrl(
  props.record?.fileUrl,
  props.record?.filePath,
));

watch(
  () => props.record,
  (record) => {
    form.documentTagId = record?.documentTagId ?? null;
    form.documentFile = null;
    form.name = record?.name ?? '';
    form.description = record?.description ?? '';
    nameTouched.value = Boolean(record?.name);
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && !props.record) {
      form.documentFile = null;
      form.documentTagId = null;
      form.name = '';
      form.description = '';
      nameTouched.value = false;
    }
  },
);

function onNameInput(value: string | number | null) {
  nameTouched.value = Boolean(String(value ?? '').trim());
}

function onFileSelected(file: File | null) {
  if (!file || nameTouched.value || form.name.trim()) {
    return;
  }

  form.name = nameFromUploadedFile(file);
}

function onDialogUpdate(value: boolean) {
  open.value = value;
}

function close() {
  open.value = false;
}

async function save() {
  if (!form.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Document name is required.' });
    return;
  }

  if (!isEdit.value && !form.documentFile) {
    $q.notify({ color: 'negative', position: 'top', message: 'Please choose a file to upload.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      documentTagId: form.documentTagId || null,
      name: form.name.trim(),
      description: form.description || null,
    };

    if (isEdit.value && props.record) {
      await store.updateRecord(props.record.id, payload, form.documentFile);
    } else {
      await store.createRecord(payload, form.documentFile);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Document saved.' });
    emit('saved');
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
