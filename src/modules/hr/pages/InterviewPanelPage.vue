<template>
  <q-page class="vacancies-page">
    <div class="vacancies-toolbar row items-center q-gutter-sm q-pa-md">
      <div>
        <div class="text-h6">Interview panel</div>
        <div class="text-caption text-grey-7">
          Score each shortlisted candidate, then recommend the best person for the position.
          A submitted score sheet cannot be opened again. HR makes the final hiring decision.
        </div>
      </div>
    </div>

    <div v-if="store.isLoading && !store.assignments.length" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else class="q-px-md q-pb-md q-gutter-md">
      <q-card v-for="assignment in store.assignments" :key="assignment.panel_member.id ?? assignment.vacancy.id" flat bordered>
        <q-card-section>
          <div class="text-subtitle1">{{ assignment.vacancy.title }}</div>
          <div class="text-caption text-grey-7">
            {{ assignment.form_template?.name || 'No score sheet assigned' }}
            · {{ assignment.applications.length }} shortlisted candidate{{ assignment.applications.length === 1 ? '' : 's' }}
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-select
            :model-value="assignment.panel_member.recommended_application_id || null"
            outlined
            dense
            emit-value
            map-options
            label="Best candidate for this position"
            :options="recommendationOptions(assignment)"
            @update:model-value="saveRecommendation(assignment, $event)"
          />
        </q-card-section>
        <q-list>
          <q-item
            v-for="application in assignment.applications"
            :key="String(application.id)"
            :clickable="!application.my_score?.is_submitted"
            v-ripple="!application.my_score?.is_submitted"
            @click="openScore(assignment, application)"
          >
            <q-item-section>
              <q-item-label>{{ application.applicant?.name }}</q-item-label>
              <q-item-label caption>{{ application.applicant?.email }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="application.my_score?.is_submitted ? 'positive' : 'grey'">
                {{ application.my_score?.is_submitted ? 'Submitted' : 'Not scored' }}
              </q-badge>
            </q-item-section>
          </q-item>
          <q-item v-if="!assignment.applications.length">
            <q-item-section class="text-grey-7">No shortlisted candidates yet.</q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <div v-if="!store.assignments.length" class="text-grey-7 q-pa-md">
        You have not been invited to any interview panels.
      </div>
    </div>

    <q-dialog v-model="scoreOpen">
      <AppDialogCard modal>
        <AppDialogHeader>
          <div>
            <div class="text-h6">{{ scoringApplication?.applicant?.name }}</div>
            <div class="text-caption text-grey-7">{{ scoringVacancy?.title }}</div>
          </div>
        </AppDialogHeader>
        <AppDialogBody>
          <div v-if="!scoreTemplate" class="text-grey-7">This vacancy has no score sheet.</div>
          <template v-else>
            <FormRenderer :schema="scoreTemplate.schema" v-model:answers="answers" />
            <q-input
              v-model="comments"
              class="q-mt-md"
              outlined
              dense
              type="textarea"
              autogrow
              label="Comments"
            />
          </template>
        </AppDialogBody>
        <AppDialogActions>
          <q-btn v-close-popup flat label="Close" />
          <q-btn
            v-if="scoreTemplate"
            color="primary"
            :loading="store.isSaving"
            label="Submit score"
            @click="saveScore"
          />
        </AppDialogActions>
      </AppDialogCard>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import { useVacancyPanelStore, type PanelAssignment } from '@hr/stores/vacancy-panel-store';
import type { FormResponse, FormTemplate } from '@hr/stores/form-template-store';
import type { Vacancy, VacancyApplication } from '@hr/stores/vacancy-store';

type PanelApplication = VacancyApplication & { my_score?: FormResponse | null };

const store = useVacancyPanelStore();
const $q = useQuasar();
const scoreOpen = ref(false);
const scoringVacancy = ref<Vacancy | null>(null);
const scoringApplication = ref<PanelApplication | null>(null);
const scoreTemplate = ref<FormTemplate | null>(null);
const answers = ref<Record<string, unknown>>({});
const comments = ref('');

onMounted(() => {
  void store.fetchAssignments().catch((error: unknown) => {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load panel assignments.',
    });
  });
});

function recommendationOptions(assignment: PanelAssignment) {
  return assignment.applications.map((application) => ({
    label: application.applicant?.name || 'Candidate',
    value: application.id,
  }));
}

async function saveRecommendation(assignment: PanelAssignment, applicationId: string | null) {
  if (!applicationId) {
    return;
  }
  try {
    const member = await store.recommend(assignment.vacancy.id, applicationId);
    const recommendedApplicationId: string | null = member.recommended_application_id ?? null;
    assignment.panel_member.recommended_application_id = recommendedApplicationId;
    $q.notify({ type: 'positive', message: 'Recommendation saved. HR makes the final decision.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save the recommendation.',
    });
  }
}

async function openScore(assignment: PanelAssignment, application: PanelApplication) {
  if (application.my_score?.is_submitted) {
    $q.notify({ type: 'info', message: 'This score sheet has been submitted and can no longer be opened.' });
    return;
  }
  scoringVacancy.value = assignment.vacancy;
  scoringApplication.value = application;
  try {
    const result = await store.fetchMyScore(assignment.vacancy.id, application.id);
    scoreTemplate.value = result.form_template;
    answers.value = { ...(result.data.answers ?? {}) };
    comments.value = result.data.comments ?? '';
    scoreOpen.value = true;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not open score sheet.',
    });
  }
}

async function saveScore() {
  if (!scoringVacancy.value || !scoringApplication.value) {
    return;
  }
  try {
    await store.saveMyScore(scoringVacancy.value.id, scoringApplication.value.id, {
      answers: answers.value,
      comments: comments.value,
      submit: true,
    });
    $q.notify({ type: 'positive', message: 'Score submitted.' });
    scoreOpen.value = false;
    await store.fetchAssignments();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save score.',
    });
  }
}
</script>
