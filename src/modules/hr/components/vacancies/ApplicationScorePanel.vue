<template>
  <div class="q-mt-lg">
    <div class="row items-center q-mb-sm">
      <div class="text-subtitle2">Score sheet</div>
      <q-space />
      <q-badge v-if="summary.count" color="deep-purple">
        {{ summary.count }} score{{ summary.count === 1 ? '' : 's' }}
        <span v-if="summary.average != null"> · avg {{ summary.average }}</span>
      </q-badge>
    </div>

    <div v-if="!template" class="text-grey-7">No score sheet is assigned to this vacancy.</div>

    <template v-else>
      <q-list v-if="scores.length" bordered separator class="rounded-borders q-mb-md">
        <q-item v-for="(score, index) in scores" :key="score.id ?? score.user_id ?? String(index)">
          <q-item-section>
            <q-item-label>{{ score.scorer?.name || 'Panel member' }}</q-item-label>
            <q-item-label caption>{{ score.scorer?.email }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="text-weight-medium">{{ score.total_score ?? '—' }} / {{ score.max_score ?? '—' }}</div>
            <div class="text-caption text-grey-7">{{ score.is_submitted ? 'Submitted' : 'Draft' }}</div>
          </q-item-section>
        </q-item>
      </q-list>

      <FormRenderer :schema="template.schema" v-model:answers="answers" />
      <q-input
        v-model="comments"
        class="q-mt-md"
        outlined
        dense
        type="textarea"
        autogrow
        label="Overall comments"
      />
      <div class="q-mt-md">
        <q-btn color="primary" :loading="panelStore.isSaving" label="Save score" @click="save" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import { useAuthStore } from '@core/stores/auth';
import { useFormTemplateStore, type FormTemplate } from '@hr/stores/form-template-store';
import { useVacancyPanelStore } from '@hr/stores/vacancy-panel-store';

const props = defineProps<{
  vacancyId: string;
  applicationId: string;
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const panelStore = useVacancyPanelStore();
const formStore = useFormTemplateStore();
const template = ref<FormTemplate | null>(null);
const answers = ref<Record<string, unknown>>({});
const comments = ref('');
const scores = ref(panelStore.scores);
const summary = ref(panelStore.scoreSummary);

onMounted(async () => {
  try {
    const loaded = await panelStore.fetchScores(props.vacancyId, props.applicationId);
    template.value = loaded;
    scores.value = panelStore.scores;
    summary.value = panelStore.scoreSummary;
    const mine = panelStore.scores.find((item) => String(item.user_id) === String(authStore.user?.id));
    if (mine?.answers) {
      answers.value = { ...mine.answers };
      comments.value = mine.comments ?? '';
    }
    if (!template.value) {
      await formStore.fetchTemplates({ purpose: 'score_sheet', activeOnly: true });
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load scores.',
    });
  }
});

async function save() {
  try {
    await panelStore.saveHrScore(props.vacancyId, props.applicationId, {
      answers: answers.value,
      comments: comments.value,
      submit: true,
    });
    const loaded = await panelStore.fetchScores(props.vacancyId, props.applicationId);
    template.value = loaded;
    scores.value = panelStore.scores;
    summary.value = panelStore.scoreSummary;
    $q.notify({ type: 'positive', message: 'Score saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save score.',
    });
  }
}
</script>
