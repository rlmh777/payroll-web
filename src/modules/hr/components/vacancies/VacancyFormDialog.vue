<template>
  <q-dialog
    :model-value="modelValue"
    position="right"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ vacancy ? 'Edit vacancy' : 'Add vacancy' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-input
                v-model="form.title"
                outlined
                dense
                label="Vacancy"
                :disable="store.isSaving"
                :rules="[(value) => !!value?.trim() || 'Vacancy name is required']"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.job_title_id"
                outlined
                dense
                emit-value
                map-options
                clearable
                use-input
                input-debounce="200"
                label="Job title"
                :options="jobTitleOptions"
                :loading="jobTitleStore.isLoadingJobTitles"
                :disable="store.isSaving"
                @filter="filterJobTitles"
                @update:model-value="onJobTitleChange"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.worksite_id"
                outlined
                dense
                emit-value
                map-options
                clearable
                label="Location"
                :options="worksiteOptions"
                :loading="worksiteStore.isLoadingWorksites"
                :disable="store.isSaving"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.department_id"
                outlined
                dense
                emit-value
                map-options
                clearable
                label="Department"
                :options="departmentOptions"
                :loading="departmentStore.isLoading"
                :disable="store.isSaving"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.hiring_manager_id"
                outlined
                dense
                emit-value
                map-options
                clearable
                use-input
                input-debounce="200"
                label="Hiring manager"
                :options="hiringManagerOptions"
                :loading="loadingManagers"
                :disable="store.isSaving"
                @filter="filterManagers"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model.number="form.positions"
                outlined
                dense
                type="number"
                min="1"
                label="Number of positions"
                :disable="store.isSaving"
              />
            </div>
            <div class="col-12">
              <q-toggle v-model="form.require_resume" label="Resume required" :disable="store.isSaving" />
            </div>
            <div class="col-12">
              <q-toggle v-model="form.advertise_internal" label="Advertise internally" :disable="store.isSaving" />
            </div>
            <div class="col-12">
              <q-toggle v-model="form.advertise_public" label="Advertise publicly" :disable="store.isSaving" />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.vacancy_stage_id"
                outlined
                dense
                emit-value
                map-options
                label="Vacancy stage"
                :options="stageOptions"
                :disable="store.isSaving"
              />
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">Job description</div>
              <q-editor
                v-model="form.description"
                min-height="160px"
                :disable="store.isSaving"
                :toolbar="editorToolbar"
              />
              <div class="text-caption text-grey-7 q-mt-xs">
                Filled from the selected job title. You can edit it for this vacancy.
              </div>
            </div>
            <div v-if="visibleAttachments.length" class="col-12">
              <div class="text-caption text-grey-7 q-mb-xs">Current attachments</div>
              <div class="q-gutter-xs">
                <q-chip
                  v-for="file in visibleAttachments"
                  :key="file.id"
                  dense
                  removable
                  :disable="store.isSaving"
                  @remove="removeExistingAttachment(file.id)"
                >
                  <a
                    v-if="file.file_url"
                    class="text-primary"
                    :href="file.file_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                  >
                    {{ file.file_name }}
                  </a>
                  <span v-else>{{ file.file_name }}</span>
                </q-chip>
              </div>
            </div>
            <div class="col-12">
              <q-file
                v-model="attachmentFiles"
                label="Attachments"
                outlined
                dense
                multiple
                clearable
                use-chips
                counter
                max-files="10"
                :accept="attachmentAccept"
                :disable="store.isSaving"
                hint="PDF, Word, or documents. Up to 10 files, 10 MB each."
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
            <div v-if="jobDescriptionUrl" class="col-12 text-caption">
              <a :href="jobDescriptionUrl" target="_blank" rel="noopener">View job title description file</a>
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn v-close-popup flat label="Cancel" color="grey" :disable="store.isSaving" />
        <q-btn color="primary" :loading="store.isSaving" :label="vacancy ? 'Save' : 'Create'" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar, type QSelectProps } from 'quasar';
import { useDepartmentStore } from '@hr/stores/department-store';
import { useWorksiteStore } from '@hr/stores/worksite-store';
import { useJobTitleStore } from '@core/stores/job-title-store';
import { useVacancyStore, type Vacancy, type VacancyPayload } from '@hr/stores/vacancy-store';
import { useAuthStore } from '@core/stores/auth';
import {
  VACANCY_ATTACHMENT_ACCEPT,
  VACANCY_EDITOR_TOOLBAR,
} from './vacancy-attachments';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import type { Employee } from '@core/types/models';

const props = defineProps<{
  modelValue: boolean;
  vacancy?: Vacancy | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

const $q = useQuasar();
const store = useVacancyStore();
const jobTitleStore = useJobTitleStore();
const worksiteStore = useWorksiteStore();
const departmentStore = useDepartmentStore();
const authStore = useAuthStore();

const managers = ref<Employee[]>([]);
const loadingManagers = ref(false);
const jobTitleOptions = ref<QSelectProps['options']>([]);
const hiringManagerOptions = ref<QSelectProps['options']>([]);
const attachmentFiles = ref<File[] | File | null>(null);
const removedAttachmentIds = ref<string[]>([]);
const editorToolbar = VACANCY_EDITOR_TOOLBAR;
const attachmentAccept = VACANCY_ATTACHMENT_ACCEPT;

const form = reactive({
  title: '',
  job_title_id: null as number | null,
  worksite_id: null as number | null,
  department_id: null as number | null,
  hiring_manager_id: null as string | null,
  positions: 1,
  require_resume: true,
  advertise_internal: true,
  advertise_public: false,
  vacancy_stage_id: null as number | null,
  description: '',
});

const worksiteOptions = computed(() =>
  worksiteStore.worksites.map((item) => ({ label: item.name, value: item.id })),
);
const departmentOptions = computed(() =>
  departmentStore.departments.map((item) => ({ label: item.name, value: item.id })),
);
const stageOptions = computed(() =>
  store.stages.map((item) => ({ label: item.name, value: item.id })),
);

const selectedJobTitle = computed(() =>
  jobTitleStore.jobTitles.find((item) => item.id === form.job_title_id) ?? null,
);
const jobDescriptionUrl = computed(() => selectedJobTitle.value?.jobDescriptionUrl ?? null);
const visibleAttachments = computed(() =>
  (props.vacancy?.attachments ?? []).filter((file) => !removedAttachmentIds.value.includes(file.id)),
);

function selectedAttachmentFiles(): File[] {
  const value = attachmentFiles.value;
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function removeExistingAttachment(id: string) {
  if (!removedAttachmentIds.value.includes(id)) {
    removedAttachmentIds.value = [...removedAttachmentIds.value, id];
  }
}

function employeeLabel(employee: Employee): string {
  const name = `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim();
  return employee.code ? `${name} (${employee.code})` : name || employee.id;
}

function resetForm() {
  form.title = props.vacancy?.title ?? '';
  form.job_title_id = props.vacancy?.job_title_id ?? null;
  form.worksite_id = props.vacancy?.worksite_id ?? null;
  form.department_id = props.vacancy?.department_id ?? null;
  form.hiring_manager_id = props.vacancy?.hiring_manager_id ?? null;
  form.positions = props.vacancy?.positions ?? 1;
  form.require_resume = props.vacancy?.require_resume ?? true;
  form.advertise_internal = props.vacancy?.advertise_internal ?? true;
  form.advertise_public = props.vacancy?.advertise_public ?? false;
  form.vacancy_stage_id = props.vacancy?.vacancy_stage_id ?? store.defaultStage?.id ?? null;
  form.description = props.vacancy?.description ?? '';
  attachmentFiles.value = null;
  removedAttachmentIds.value = [];
}

function onJobTitleChange(jobTitleId: number | null) {
  const jobTitle = jobTitleStore.jobTitles.find((item) => item.id === jobTitleId);
  if (jobTitle?.name && !form.title.trim()) {
    form.title = jobTitle.name;
  }
  if (jobTitle?.notes) {
    form.description = jobTitle.notes;
  }
}

function filterJobTitles(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    jobTitleOptions.value = jobTitleStore.jobTitles
      .filter((item) => !needle || item.name.toLowerCase().includes(needle))
      .map((item) => ({ label: item.name, value: item.id }));
  });
}

function filterManagers(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    hiringManagerOptions.value = managers.value
      .filter((item) => {
        const label = employeeLabel(item).toLowerCase();
        return !needle || label.includes(needle);
      })
      .map((item) => ({ label: employeeLabel(item), value: item.id }));
  });
}

async function fetchManagers() {
  loadingManagers.value = true;
  try {
    const response = await fetch(`${API_URL}/employees?per_page=200&sort_by=lastName`, {
      headers: {
        Accept: 'application/json',
        Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
      },
    });
    if (!response.ok) {
      return;
    }
    const body = await response.json();
    managers.value = Array.isArray(body.data) ? body.data : [];
    hiringManagerOptions.value = managers.value.map((item) => ({
      label: employeeLabel(item),
      value: item.id,
    }));
  } finally {
    loadingManagers.value = false;
  }
}

async function save() {
  const payload: VacancyPayload = {
    title: form.title.trim(),
    job_title_id: form.job_title_id,
    worksite_id: form.worksite_id,
    department_id: form.department_id,
    hiring_manager_id: form.hiring_manager_id,
    positions: Number(form.positions) || 1,
    require_resume: form.require_resume,
    advertise_internal: form.advertise_internal,
    advertise_public: form.advertise_public,
    vacancy_stage_id: form.vacancy_stage_id,
    description: form.description,
    remove_attachment_ids: removedAttachmentIds.value,
  };
  const files = selectedAttachmentFiles();

  try {
    if (props.vacancy) {
      await store.updateVacancy(props.vacancy.id, payload, files);
      $q.notify({ type: 'positive', message: 'Vacancy updated.' });
    } else {
      await store.createVacancy(payload, files);
      $q.notify({ type: 'positive', message: 'Vacancy created.' });
    }
    emit('update:modelValue', false);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save vacancy.',
    });
  }
}

watch(
  () => [props.modelValue, props.vacancy?.id],
  () => {
    if (props.modelValue) {
      resetForm();
      jobTitleOptions.value = jobTitleStore.jobTitles.map((item) => ({
        label: item.name,
        value: item.id,
      }));
    }
  },
);

onMounted(async () => {
  await Promise.all([
    jobTitleStore.fetchJobTitles(1, 200),
    worksiteStore.fetchWorksites(1, 200),
    departmentStore.fetchDepartments({ page: 1, perPage: 200 }),
    fetchManagers(),
    store.stages.length ? Promise.resolve() : store.fetchBoard(),
  ]);
  jobTitleOptions.value = jobTitleStore.jobTitles.map((item) => ({
    label: item.name,
    value: item.id,
  }));
  resetForm();
});
</script>
