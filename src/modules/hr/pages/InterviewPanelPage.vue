<template>
  <q-page class="vacancies-page">
    <div class="vacancies-toolbar row items-center q-gutter-sm q-pa-md">
      <div>
        <div class="text-h6">Interview panel</div>
        <div class="text-caption text-grey-7">
          Vacancies you were invited to score. Open a candidate to record scores and comments.
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
            · {{ assignment.applications.length }} candidate{{ assignment.applications.length === 1 ? '' : 's' }}
          </div>
        </q-card-section>
        <q-separator />
        <q-list>
          <q-item
            v-for="application in assignment.applications"
            :key="String(application.id)"
            clickable
            v-ripple
            @click="openScore(assignment, application)"
          >
            <q-item-section>
              <q-item-label>{{ application.applicant?.name }}</q-item-label>
              <q-item-label caption>{{ application.applicant?.email }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="application.my_score?.is_submitted ? 'positive' : 'grey'">
                {{
                  application.my_score?.is_submitted
                    ? `${application.my_score.total_score ?? 0}`
                    : 'Not scored'
                }}
              </q-badge>
            </q-item-section>
          </q-item>
          <q-item v-if="!assignment.applications.length">
            <q-item-section class="text-grey-7">No candidates yet.</q-item-section>
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
import type { FormTemplate } from '@hr/stores/form-template-store';
import type { Vacancy, VacancyApplication } from '@hr/stores/vacancy-store';

const store = useVacancyPanelStore();
const $q = useQuasar();
const scoreOpen = ref(false);
const scoringVacancy = ref<Vacancy | null>(null);
const scoringApplication = ref<VacancyApplication | null>(null);
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

async function openScore(assignment: PanelAssignment, application: VacancyApplication) {
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
