<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <q-card class="job-title-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Job Title</div>
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
import { useJobTitleStore } from '@core/stores/job-title-store';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [jobTitleId: number];
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
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function resetForm() {
  form.value = {
    name: '',
    payScale: '',
    notes: '',
    jobDescriptionFile: null,
  };
}

function onClose() {
  isOpen.value = false;
  resetForm();
}

async function onSubmit() {
  if (!form.value.name.trim()) return;

  saving.value = true;
  try {
    const created = await store.createJobTitle(
      {
        name: form.value.name.trim(),
        payScale: form.value.payScale.trim() || null,
        notes: form.value.notes.trim() || null,
      },
      form.value.jobDescriptionFile,
    );

    if (created) {
      $q.notify({ type: 'positive', message: 'Job title created.' });
      emit('saved', created.id);
      onClose();
      return;
    }

    $q.notify({ type: 'negative', message: store.error || 'Failed to create job title.' });
  } finally {
    saving.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) resetForm();
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
