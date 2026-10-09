<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-subtitle2 q-mb-md">Filters</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-input
            v-model="draft.search"
            outlined
            dense
            clearable
            label="Search"
            @keyup.enter="apply"
          />
        </div>
        <div v-if="includeVacancy" class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.vacancy_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            use-input
            input-debounce="200"
            label="Vacancy"
            :options="vacancyOptions"
            @filter="filterVacancies"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.job_title_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            use-input
            input-debounce="200"
            label="Job title"
            :options="jobTitleOptions"
            @filter="filterJobTitles"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.department_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Department"
            :options="departmentOptions"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.worksite_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Location"
            :options="worksiteOptions"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.hiring_manager_id"
            outlined
            dense
            emit-value
            map-options
            clearable
            use-input
            input-debounce="200"
            label="Hiring manager"
            :options="managerOptions"
            :loading="loadingManagers"
            @filter="filterManagers"
          />
        </div>
        <div v-if="includeAdvertising" class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.advertising"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Advertising"
            :options="advertisingOptions"
          />
        </div>
        <div v-if="includePublishedRange" class="col-12 col-sm-6 col-md-3">
          <DateField
            v-model="draft.published_from"
            label="Published from"
            clearable
          />
        </div>
        <div v-if="includePublishedRange" class="col-12 col-sm-6 col-md-3">
          <DateField
            v-model="draft.published_to"
            label="Published to"
            clearable
          />
        </div>
        <div v-if="includeSource" class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="draft.source"
            outlined
            dense
            emit-value
            map-options
            clearable
            label="Source"
            :options="sourceOptions"
          />
        </div>
      </div>
      <div class="row q-gutter-sm q-mt-md">
        <q-btn color="primary" icon="search" label="Search" :loading="loading" @click="apply" />
        <q-btn flat color="primary" icon="restart_alt" label="Reset" :disable="loading" @click="reset" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { QSelectProps } from 'quasar';
import { useAuthStore } from '@core/stores/auth';
import { useJobTitleStore } from '@core/stores/job-title-store';
import { useDepartmentStore } from '@hr/stores/department-store';
import { useWorksiteStore } from '@hr/stores/worksite-store';
import { useVacancyStore, type Vacancy } from '@hr/stores/vacancy-store';
import DateField from '@core/components/common/DateField.vue';
import type { Employee } from '@core/types/models';

export interface RecruitmentFiltersValue {
  search: string;
  vacancy_id: string | null;
  job_title_id: number | null;
  department_id: number | null;
  worksite_id: number | null;
  hiring_manager_id: string | null;
  advertising: 'internal' | 'public' | null;
  source: string | null;
  published_from: string | null;
  published_to: string | null;
}

const emptyFilters = (): RecruitmentFiltersValue => ({
  search: '',
  vacancy_id: null,
  job_title_id: null,
  department_id: null,
  worksite_id: null,
  hiring_manager_id: null,
  advertising: null,
  source: null,
  published_from: null,
  published_to: null,
});

const props = withDefaults(defineProps<{
  modelValue: RecruitmentFiltersValue;
  includeVacancy?: boolean;
  includeSource?: boolean;
  includeAdvertising?: boolean;
  includePublishedRange?: boolean;
  loading?: boolean;
  vacancies?: Vacancy[];
}>(), {
  includeVacancy: false,
  includeSource: false,
  includeAdvertising: false,
  includePublishedRange: false,
  loading: false,
  vacancies: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: RecruitmentFiltersValue];
  search: [value: RecruitmentFiltersValue];
  reset: [value: RecruitmentFiltersValue];
}>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const authStore = useAuthStore();
const jobTitleStore = useJobTitleStore();
const departmentStore = useDepartmentStore();
const worksiteStore = useWorksiteStore();
const vacancyStore = useVacancyStore();

const draft = reactive<RecruitmentFiltersValue>(emptyFilters());
const managers = ref<Employee[]>([]);
const loadingManagers = ref(false);
const jobTitleOptions = ref<QSelectProps['options']>([]);
const vacancyOptions = ref<QSelectProps['options']>([]);
const managerOptions = ref<QSelectProps['options']>([]);

const advertisingOptions = [
  { label: 'Internal', value: 'internal' },
  { label: 'Public', value: 'public' },
];
const sourceOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Internal', value: 'internal' },
  { label: 'Manual', value: 'manual' },
];

const departmentOptions = computed(() =>
  departmentStore.departments.map((item) => ({ label: item.name, value: item.id })),
);
const worksiteOptions = computed(() =>
  worksiteStore.worksites.map((item) => ({ label: item.name, value: item.id })),
);

function copyFrom(value: RecruitmentFiltersValue) {
  draft.search = value.search ?? '';
  draft.vacancy_id = value.vacancy_id;
  draft.job_title_id = value.job_title_id;
  draft.department_id = value.department_id;
  draft.worksite_id = value.worksite_id;
  draft.hiring_manager_id = value.hiring_manager_id;
  draft.advertising = value.advertising;
  draft.source = value.source;
  draft.published_from = value.published_from;
  draft.published_to = value.published_to;
}

function snapshot(): RecruitmentFiltersValue {
  return {
    search: draft.search.trim(),
    vacancy_id: draft.vacancy_id,
    job_title_id: draft.job_title_id,
    department_id: draft.department_id,
    worksite_id: draft.worksite_id,
    hiring_manager_id: draft.hiring_manager_id,
    advertising: draft.advertising,
    source: draft.source,
    published_from: draft.published_from,
    published_to: draft.published_to,
  };
}

function apply() {
  const value = snapshot();
  emit('update:modelValue', value);
  emit('search', value);
}

function reset() {
  copyFrom(emptyFilters());
  const value = snapshot();
  emit('update:modelValue', value);
  emit('reset', value);
}

function employeeLabel(employee: Employee): string {
  const name = `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim();
  return employee.code ? `${name} (${employee.code})` : name || employee.id;
}

function filterJobTitles(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    jobTitleOptions.value = jobTitleStore.jobTitles
      .filter((item) => !needle || item.name.toLowerCase().includes(needle))
      .map((item) => ({ label: item.name, value: item.id }));
  });
}

function filterVacancies(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    const rows = props.vacancies.length ? props.vacancies : vacancyStore.vacancyOptions;
    vacancyOptions.value = rows
      .filter((item) => !needle || item.title.toLowerCase().includes(needle))
      .map((item) => ({ label: item.title, value: item.id }));
  });
}

function filterManagers(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    managerOptions.value = managers.value
      .filter((item) => {
        const label = employeeLabel(item).toLowerCase();
        return !needle || label.includes(needle);
      })
      .map((item) => ({ label: employeeLabel(item), value: item.id }));
  });
}

watch(
  () => props.modelValue,
  (value) => copyFrom(value),
  { immediate: true, deep: true },
);

watch(
  () => props.vacancies,
  (rows) => {
    vacancyOptions.value = rows.map((item) => ({ label: item.title, value: item.id }));
  },
  { immediate: true },
);

onMounted(async () => {
  await Promise.all([
    jobTitleStore.fetchJobTitles(1, 200),
    worksiteStore.fetchWorksites(1, 200),
    departmentStore.fetchDepartments({ page: 1, perPage: 200 }),
  ]);
  jobTitleOptions.value = jobTitleStore.jobTitles.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  loadingManagers.value = true;
  try {
    const response = await fetch(`${API_URL}/employees?per_page=200&sort_by=lastName`, {
      headers: {
        Accept: 'application/json',
        Authorization: authStore.token ? `Bearer ${authStore.token}` : '',
      },
    });
    if (response.ok) {
      const body = await response.json();
      managers.value = Array.isArray(body.data) ? body.data : [];
      managerOptions.value = managers.value.map((item) => ({
        label: employeeLabel(item),
        value: item.id,
      }));
    }
  } finally {
    loadingManagers.value = false;
  }
});
</script>
