<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card class="vacancy-form-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ vacancy ? 'Edit vacancy' : 'New vacancy' }}</div>
        <q-space />
        <q-btn v-close-popup flat round dense icon="close" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="form.title"
            outlined
            dense
            label="Vacancy"
            :rules="[(value) => !!value?.trim() || 'Vacancy name is required']"
          />

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
            @filter="filterJobTitles"
            @update:model-value="onJobTitleChange"
          />

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
          />

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
          />

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
            @filter="filterManagers"
          />

          <q-input
            v-model.number="form.positions"
            outlined
            dense
            type="number"
            min="1"
            label="Number of positions"
          />

          <q-toggle v-model="form.require_resume" label="Resume required" />
          <q-toggle v-model="form.advertise_internal" label="Advertise internally" />
          <q-toggle v-model="form.advertise_public" label="Advertise publicly" />

          <q-select
            v-model="form.vacancy_stage_id"
            outlined
            dense
            emit-value
            map-options
            label="Vacancy stage"
            :options="stageOptions"
          />

          <q-input
            v-model="form.description"
            outlined
            type="textarea"
            autogrow
            label="Job description"
            hint="Filled from the selected job title. You can edit it for this vacancy."
          />

          <div v-if="jobDescriptionUrl" class="text-caption">
            <a :href="jobDescriptionUrl" target="_blank" rel="noopener">View job description file</a>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn v-close-popup flat label="Cancel" />
            <q-btn type="submit" color="primary" :loading="store.isSaving" :label="vacancy ? 'Save' : 'Create'" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
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
  };

  try {
    if (props.vacancy) {
      await store.updateVacancy(props.vacancy.id, payload);
      $q.notify({ type: 'positive', message: 'Vacancy updated.' });
    } else {
      await store.createVacancy(payload);
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

<style scoped>
.vacancy-form-card {
  width: min(640px, 96vw);
}
</style>
