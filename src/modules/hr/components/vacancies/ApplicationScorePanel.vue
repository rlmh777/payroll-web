<template>
  <div class="q-mt-lg">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2">Compiled score sheets</div>
      <q-space />
      <q-badge v-if="summary.count" color="deep-purple">
        {{ summary.count }} submitted
        <span v-if="summary.total != null"> · total {{ summary.total }}</span>
        <span v-if="summary.average != null"> · avg {{ summary.average }}</span>
      </q-badge>
    </div>

    <div v-if="fieldTotals.length" class="q-mb-sm">
      <div v-for="(field, fieldIndex) in fieldTotals" :key="fieldIndex" class="text-caption">
        {{ field.label }}: total {{ field.total }}
        <span v-if="field.average != null"> · avg {{ field.average }}</span>
        <span v-if="field.max != null"> / {{ field.max }}</span>
      </div>
    </div>

    <div v-if="!scores.length" class="text-grey-7">No submitted score sheets yet.</div>
    <q-list v-else bordered separator class="rounded-borders">
      <q-expansion-item
        v-for="(score, index) in scores"
        :key="index"
        :label="score.scorer?.name || 'Panel member'"
        :caption="`${score.total_score ?? '—'} / ${score.max_score ?? '—'}`"
      >
        <q-card flat>
          <q-card-section>
            <div class="text-caption text-grey-7">{{ score.scorer?.email }}</div>
            <div v-if="score.comments" class="q-mt-sm">{{ score.comments }}</div>
            <FormRenderer
              v-if="score.schema"
              class="q-mt-sm"
              disable
              :schema="score.schema"
              :answers="score.answers || {}"
            />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import type { FormResponse } from '@hr/stores/form-template-store';
import { useVacancyPanelStore, type ScoreFieldTotal } from '@hr/stores/vacancy-panel-store';

const props = defineProps<{
  vacancyId: string;
  applicationId: string;
}>();

const $q = useQuasar();
const panelStore = useVacancyPanelStore();
const scores = ref<FormResponse[]>([]);
const fieldTotals = ref<ScoreFieldTotal[]>([]);
const summary = ref(panelStore.scoreSummary);

onMounted(() => {
  void panelStore.fetchScores(props.vacancyId, props.applicationId)
    .then(() => {
      scores.value = panelStore.scores;
      fieldTotals.value = panelStore.fieldTotals;
      summary.value = panelStore.scoreSummary;
    })
    .catch((error: unknown) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Could not load scores.',
      });
    });
});
</script>
