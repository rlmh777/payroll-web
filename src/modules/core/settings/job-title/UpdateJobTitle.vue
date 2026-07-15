<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <q-card class="job-title-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Job Title</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.name"
            label="Job title *"
            outlined
            dense
            :disable="saving"
            :rules="[(val) => !!String(val ?? '').trim() || 'Job title is required']"
          />
          <q-input
            v-model="form.payScale"
            label="Pay scale"
            outlined
            dense
            hint="e.g. Grade A, Scale 5, $15–20/hr"
            :disable="saving"
          />

          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
            <q-editor
              v-model="form.notes"
              min-height="140px"
              :disable="saving"
              :toolbar="editorToolbar"
            />
          </div>

          <q-file
            v-model="form.jobDescriptionFile"
            label="Job description (PDF)"
            accept=".pdf,application/pdf"
            outlined
            dense
            clearable
            :disable="saving"
          >
            <template #prepend>
              <q-icon name="picture_as_pdf" />
            </template>
          </q-file>

          <div v-if="existingDescriptionUrl && !form.jobDescriptionFile" class="row items-center q-gutter-sm">
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="open_in_new"
              label="View current PDF"
              type="a"
              :href="existingDescriptionUrl"
              target="_blank"
              rel="noopener noreferrer"
            />
            <q-btn
              flat
              dense
              no-caps
              color="negative"
              icon="delete"
              label="Remove PDF"
              :disable="saving"
              @click="form.removeJobDescription = true"
            />
          </div>
          <div v-if="form.removeJobDescription && !form.jobDescriptionFile" class="text-caption text-negative">
            Current PDF will be removed on save.
          </div>

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="onClose" />
            <q-btn type="submit" color="primary" label="Save" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useJobTitleStore, type JobTitle } from '@core/stores/job-title-store';

const props = defineProps<{
  modelValue: boolean;
  jobTitle: JobTitle | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [jobTitle: JobTitle];
}>();

const $q = useQuasar();
const store = useJobTitleStore();
const saving = ref(false);
const editorToolbar = [
  ['left', 'center', 'right', 'justify'],
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered'],
  ['link'],
  ['undo', 'redo'],
  ['removeFormat'],
];
const form = ref({
  name: '',
  payScale: '',
  notes: '',
  jobDescriptionFile: null as File | null,
  removeJobDescription: false,
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const existingDescriptionUrl = computed(() => {
  if (form.value.removeJobDescription) return null;
  return props.jobTitle?.jobDescriptionUrl ?? null;
});

function applyJobTitle(jobTitle: JobTitle | null) {
  form.value = {
    name: jobTitle?.name ?? '',
    payScale: jobTitle?.payScale ?? '',
    notes: jobTitle?.notes ?? '',
    jobDescriptionFile: null,
    removeJobDescription: false,
  };
}

function onClose() {
  isOpen.value = false;
  store.setJobTitleToEdit(null);
}

async function onSubmit() {
  if (!props.jobTitle?.id || !form.value.name.trim()) return;

  saving.value = true;
  try {
    const updated = await store.updateJobTitle(
      props.jobTitle.id,
      {
        name: form.value.name.trim(),
        payScale: form.value.payScale.trim() || null,
        notes: form.value.notes.trim() || null,
        removeJobDescription: form.value.removeJobDescription && !form.value.jobDescriptionFile,
      },
      form.value.jobDescriptionFile,
    );

    if (updated) {
      $q.notify({ type: 'positive', message: 'Job title updated.' });
      emit('updated', updated);
      onClose();
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update job title.',
    });
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.jobTitle,
  (jobTitle) => {
    if (props.modelValue) applyJobTitle(jobTitle);
  },
);

watch(isOpen, (open) => {
  if (open) applyJobTitle(props.jobTitle);
});
</script>

<style scoped>
.job-title-dialog-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.job-title-dialog-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
