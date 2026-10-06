<template>
  <q-page class="vacancies-page">
    <div class="vacancies-toolbar row items-center q-gutter-sm q-pa-md">
      <div>
        <div class="text-h6">Candidates</div>
        <div class="text-caption text-grey-7">
          Candidate pipeline is separate from the vacancy board. Drag applicants between stages.
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="canEdit"
        flat
        color="primary"
        icon="tune"
        label="Stages"
        :to="hrSettingsPath('candidate-stages')"
      />
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="Add application"
        :disable="!addVacancy"
        @click="openAdd"
      />
    </div>

    <div class="q-px-md">
      <RecruitmentFilters
        v-model="filters"
        include-vacancy
        include-source
        :loading="store.isLoadingCandidateBoard"
        :vacancies="store.vacancyOptions"
        @search="loadBoard"
        @reset="loadBoard"
      />
    </div>

    <div v-if="store.isLoadingCandidateBoard && !store.candidateStages.length" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else class="kanban-board q-px-md q-pb-md">
      <section
        v-for="stage in store.candidateStages"
        :key="stage.id"
        class="kanban-column"
        :class="{ 'kanban-column--over': overStageId === stage.id }"
        :style="{ '--stage-color': stage.color }"
        :aria-label="`${stage.name} stage`"
        @dragover.prevent="onColumnDragOver(stage.id)"
        @drop.prevent="onDrop(stage.id, (stage.applications ?? []).length)"
      >
        <header class="kanban-column__header">
          <div class="kanban-column__title">{{ stage.name }}</div>
          <q-badge outline :style="{ color: stage.color, borderColor: stage.color }">
            {{ (stage.applications ?? []).length }}
          </q-badge>
        </header>

        <div class="kanban-column__cards">
          <article
            v-for="(card, index) in stage.applications ?? []"
            :key="card.id"
            class="vacancy-card"
            :class="{ 'vacancy-card--dragging': draggingId === card.id }"
            role="button"
            :aria-label="card.applicant?.name || 'Applicant'"
            :draggable="canEdit"
            @dragstart="onDragStart(card, stage.id, $event)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onCardDragOver(stage.id)"
            @drop.prevent.stop="onDrop(stage.id, index)"
            @click="openDetail(card)"
          >
            <div class="vacancy-card__title">{{ card.applicant?.name || 'Applicant' }}</div>
            <div class="text-caption text-grey-8">{{ card.applicant?.email }}</div>
            <div class="text-caption text-grey-7">
              {{ card.vacancy?.title || card.vacancy_title || 'Vacancy' }}
            </div>
            <div class="row q-gutter-xs q-mt-sm">
              <q-badge color="grey-7" outline>{{ card.source }}</q-badge>
              <q-badge v-if="card.status === 'converted'" color="positive">Hired</q-badge>
            </div>
          </article>
        </div>
      </section>
    </div>

    <VacancyApplicationsDialog
      v-model="dialogOpen"
      :vacancy="dialogVacancy"
      :application="dialogApplication"
      :adding="adding"
      @closed="onDialogClosed"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { hrSettingsPath } from '@core/config/module-routes';
import { useVacancyStore, type Vacancy, type VacancyApplication } from '@hr/stores/vacancy-store';
import RecruitmentFilters, {
  type RecruitmentFiltersValue,
} from '@hr/components/vacancies/RecruitmentFilters.vue';
import VacancyApplicationsDialog from '@hr/components/vacancies/VacancyApplicationsDialog.vue';

const store = useVacancyStore();
const { can } = usePermissions();
const $q = useQuasar();
const route = useRoute();

const canEdit = computed(() => can('vacancies-crud'));
const dialogOpen = ref(false);
const dialogVacancy = ref<Vacancy | null>(null);
const dialogApplication = ref<VacancyApplication | null>(null);
const adding = ref(false);
const draggingId = ref<string | null>(null);
const draggingFromStageId = ref<number | null>(null);
const overStageId = ref<number | null>(null);
const skipClick = ref(false);

const filters = reactive<RecruitmentFiltersValue>({
  search: '',
  vacancy_id: typeof route.query.vacancy_id === 'string' ? route.query.vacancy_id : null,
  job_title_id: null,
  department_id: null,
  worksite_id: null,
  hiring_manager_id: null,
  advertising: null,
  source: null,
});

const addVacancy = computed(() => {
  if (!filters.vacancy_id) {
    return store.vacancyOptions[0] ?? null;
  }
  return store.vacancyOptions.find((item) => item.id === filters.vacancy_id) ?? null;
});

function vacancyStub(application: VacancyApplication): Vacancy {
  return {
    id: application.vacancy_id,
    title: application.vacancy?.title || application.vacancy_title || 'Vacancy',
    job_title_id: null,
    worksite_id: null,
    department_id: null,
    positions: 1,
    require_resume: false,
    advertise_internal: false,
    advertise_public: false,
    vacancy_stage_id: 0,
    sort_order: 0,
  };
}

async function loadBoard() {
  try {
    await store.fetchCandidateBoard({ ...filters });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load candidates.',
    });
  }
}

function openDetail(application: VacancyApplication) {
  if (skipClick.value || draggingId.value) {
    return;
  }
  adding.value = false;
  dialogApplication.value = application;
  dialogVacancy.value = vacancyStub(application);
  dialogOpen.value = true;
}

function openAdd() {
  const vacancy = addVacancy.value;
  if (!vacancy) {
    $q.notify({ type: 'warning', message: 'Select a vacancy to add an application.' });
    return;
  }
  dialogApplication.value = null;
  dialogVacancy.value = vacancy;
  adding.value = true;
  dialogOpen.value = true;
}

function onDialogClosed() {
  adding.value = false;
  dialogApplication.value = null;
  void loadBoard();
}

function onDragStart(card: VacancyApplication, stageId: number, event: DragEvent) {
  skipClick.value = true;
  draggingId.value = card.id;
  draggingFromStageId.value = stageId;
  event.dataTransfer?.setData('text/plain', card.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onColumnDragOver(stageId: number) {
  overStageId.value = stageId;
}

function onCardDragOver(stageId: number) {
  overStageId.value = stageId;
}

function onDragEnd() {
  draggingId.value = null;
  draggingFromStageId.value = null;
  overStageId.value = null;
  window.setTimeout(() => {
    skipClick.value = false;
  }, 80);
}

async function onDrop(stageId: number, index: number) {
  const applicationId = draggingId.value;
  const fromStageId = draggingFromStageId.value;
  onDragEnd();
  if (!applicationId || fromStageId == null || !canEdit.value) {
    return;
  }

  store.applyLocalCandidateMove(applicationId, fromStageId, stageId, index);
  try {
    const destination = store.candidateStages.find((stage) => stage.id === stageId);
    await store.moveApplication(
      applicationId,
      stageId,
      (destination?.applications ?? []).map((card) => card.id),
    );
  } catch (error) {
    await loadBoard();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not move candidate.',
    });
  }
}

watch(
  () => route.query.vacancy_id,
  (value) => {
    filters.vacancy_id = typeof value === 'string' ? value : null;
    void loadBoard();
  },
);

onMounted(async () => {
  try {
    await Promise.all([store.fetchBoard(), loadBoard()]);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load candidates.',
    });
  }
});
</script>

<style scoped>
.vacancies-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  align-items: stretch;
  min-height: 0;
  flex: 1;
}

.kanban-column {
  flex: 0 0 260px;
  background: #f4f6f8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
  border-top: 4px solid var(--stage-color, #64748b);
}

.kanban-column--over {
  outline: 2px dashed var(--stage-color, #64748b);
}

.kanban-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
}

.kanban-column__title {
  font-weight: 600;
}

.kanban-column__cards {
  padding: 0 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.vacancy-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  cursor: grab;
}

.vacancy-card--dragging {
  opacity: 0.45;
}

.vacancy-card__title {
  font-weight: 600;
  line-height: 1.3;
}
</style>
