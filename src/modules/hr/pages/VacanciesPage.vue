<template>
  <q-page class="vacancies-page">
    <div class="vacancies-toolbar row items-center q-gutter-sm q-pa-md">
      <div>
        <div class="text-h6">Vacancies</div>
        <div class="text-caption text-grey-7">
          Vacancy pipeline for jobs. Candidates use a separate pipeline.
          Public jobs appear on
          <router-link to="/careers">/careers</router-link>
          when advertised publicly and in a published stage.
        </div>
      </div>
      <q-space />
      <q-btn
        flat
        color="primary"
        icon="badge"
        label="Candidates"
        :to="MODULE_ROUTES.candidates"
      />
      <q-btn
        v-if="canEdit"
        flat
        color="primary"
        icon="tune"
        label="Stages"
        :to="hrSettingsPath('vacancy-stages')"
      />
      <q-btn
        v-if="canEdit"
        color="primary"
        icon="add"
        label="New vacancy"
        @click="openCreate"
      />
    </div>

    <div class="q-px-md">
      <RecruitmentFilters
        v-model="filters"
        include-advertising
        :loading="store.isLoadingBoard"
        @search="loadBoard"
        @reset="loadBoard"
      />
    </div>

    <div v-if="store.isLoadingBoard && !store.stages.length" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else class="kanban-board q-px-md q-pb-md">
      <section
        v-for="stage in store.stages"
        :key="stage.id"
        class="kanban-column"
        :class="{ 'kanban-column--over': overStageId === stage.id }"
        :style="{ '--stage-color': stage.color }"
        :aria-label="`${stage.name} stage`"
        @dragover.prevent="onColumnDragOver(stage.id)"
        @drop.prevent="onDrop(stage.id, (stage.vacancies ?? []).length)"
      >
        <header class="kanban-column__header">
          <div class="kanban-column__title">{{ stage.name }}</div>
          <q-badge outline :style="{ color: stage.color, borderColor: stage.color }">
            {{ (stage.vacancies ?? []).length }}
          </q-badge>
        </header>

        <div class="kanban-column__cards">
          <article
            v-for="(card, index) in stage.vacancies ?? []"
            :key="card.id"
            class="vacancy-card"
            :class="{ 'vacancy-card--dragging': draggingId === card.id }"
            role="button"
            :aria-label="card.title"
            :draggable="canEdit"
            @dragstart="onDragStart(card, stage.id, $event)"
            @dragend="onDragEnd"
            @dragover.prevent.stop="onCardDragOver(stage.id)"
            @drop.prevent.stop="onDrop(stage.id, index)"
            @click="openEdit(card)"
          >
            <div class="vacancy-card__title">{{ card.title }}</div>
            <div class="text-caption text-grey-8">
              {{ card.job_title?.name || 'No job title' }}
            </div>
            <div class="text-caption text-grey-7">
              {{ card.worksite?.name || 'No location' }}
              <span v-if="card.department"> · {{ card.department.name }}</span>
            </div>
            <div class="row q-gutter-xs q-mt-sm">
              <q-badge color="grey-7">{{ card.positions }} open</q-badge>
              <q-badge
                color="deep-purple"
                :outline="!(card.applications_count)"
                class="applications-badge"
                @click.stop="openApplications(card)"
              >
                {{ card.applications_count ?? 0 }} application{{ (card.applications_count ?? 0) === 1 ? '' : 's' }}
              </q-badge>
              <q-badge v-if="card.advertise_internal" color="primary" outline>Internal</q-badge>
              <q-badge v-if="card.advertise_public" color="positive" outline>Public</q-badge>
            </div>
          </article>
        </div>
      </section>
    </div>

    <VacancyFormDialog v-model="formOpen" :vacancy="editing" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { MODULE_ROUTES, hrSettingsPath } from '@core/config/module-routes';
import { useVacancyStore, type Vacancy } from '@hr/stores/vacancy-store';
import RecruitmentFilters, {
  type RecruitmentFiltersValue,
} from '@hr/components/vacancies/RecruitmentFilters.vue';
import VacancyFormDialog from '@hr/components/vacancies/VacancyFormDialog.vue';

const store = useVacancyStore();
const { can } = usePermissions();
const $q = useQuasar();
const router = useRouter();

const canEdit = computed(() => can('vacancies-crud'));
const formOpen = ref(false);
const editing = ref<Vacancy | null>(null);
const draggingId = ref<string | null>(null);
const draggingFromStageId = ref<number | null>(null);
const overStageId = ref<number | null>(null);
const skipClick = ref(false);

const filters = reactive<RecruitmentFiltersValue>({
  search: '',
  vacancy_id: null,
  job_title_id: null,
  department_id: null,
  worksite_id: null,
  hiring_manager_id: null,
  advertising: null,
  source: null,
});

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

async function loadBoard() {
  try {
    await store.fetchBoard({ ...filters });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load vacancies.',
    });
  }
}

function openApplications(vacancy: Vacancy) {
  if (skipClick.value || draggingId.value) {
    return;
  }
  void router.push({
    path: MODULE_ROUTES.candidates,
    query: { vacancy_id: vacancy.id },
  });
}

function openEdit(vacancy: Vacancy) {
  if (skipClick.value || draggingId.value) {
    return;
  }
  editing.value = vacancy;
  formOpen.value = true;
}

function onDragStart(card: Vacancy, stageId: number, event: DragEvent) {
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
  const vacancyId = draggingId.value;
  const fromStageId = draggingFromStageId.value;
  onDragEnd();
  if (!vacancyId || fromStageId == null || !canEdit.value) {
    return;
  }

  store.applyLocalMove(vacancyId, fromStageId, stageId, index);
  try {
    const destination = store.stages.find((stage) => stage.id === stageId);
    await store.moveVacancy(
      vacancyId,
      stageId,
      (destination?.vacancies ?? []).map((card) => card.id),
    );
  } catch (error) {
    await store.fetchBoard();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not move vacancy.',
    });
  }
}

onMounted(async () => {
  await loadBoard();
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
  flex: 0 0 280px;
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

.applications-badge {
  cursor: pointer;
}
</style>
