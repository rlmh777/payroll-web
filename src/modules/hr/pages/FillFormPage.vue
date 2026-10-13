<template>
  <q-page class="fill-form-page">
    <div v-if="loading" class="q-pa-xl text-center">
      <q-spinner color="primary" size="40px" />
    </div>
    <div v-else-if="error" class="q-pa-xl text-center text-grey-8">{{ error }}</div>
    <div v-else-if="assignment" class="fill-form-canvas">
      <div class="fill-form-title-card">
        <div class="fill-form-title-card__bar" />
        <div class="fill-form-title-card__body">
          <div class="text-h5">{{ assignment.name || assignment.form_template?.name }}</div>
          <div v-if="assignment.form_template?.description" class="text-grey-7 q-mt-sm">
            {{ assignment.form_template.description }}
          </div>
          <div v-if="submitted" class="text-positive q-mt-sm">You already submitted this form.</div>
          <div v-else-if="assignment.is_required" class="text-caption text-grey-7 q-mt-sm">
            This form is required before you continue.
          </div>
        </div>
      </div>
      <div class="fill-form-question">
        <q-form @submit.prevent="submit">
          <FormRenderer
            v-if="assignment.form_template"
            :schema="assignment.form_template.schema"
            :answers="answers"
            :disable="submitted"
            @update:answers="answers = $event"
          />
          <div v-if="!submitted" class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn flat label="Save draft" :loading="saving && !submitting" @click="void save(false)" />
            <q-btn color="primary" type="submit" label="Submit" :loading="submitting" />
          </div>
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import { useFormAssignmentStore, type FormAssignment } from '@hr/stores/form-assignment-store';

const route = useRoute();
const router = useRouter();
const store = useFormAssignmentStore();
const $q = useQuasar();
const assignment = ref<FormAssignment | null>(null);
const answers = ref<Record<string, unknown>>({});
const loading = ref(true);
const saving = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const submitted = ref(false);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const id = String(route.params.id);
    assignment.value = await store.fetchMine(id);
    answers.value = { ...(assignment.value.response?.answers ?? {}) };
    submitted.value = Boolean(assignment.value.response?.is_submitted);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'This form is not available.';
  } finally {
    loading.value = false;
  }
}

async function save(submitForm: boolean) {
  if (!assignment.value) {
    return;
  }
  saving.value = true;
  submitting.value = submitForm;
  try {
    const saved = await store.submitMine(assignment.value.id, {
      answers: answers.value,
      submit: submitForm,
    });
    if (submitForm) {
      submitted.value = true;
      $q.notify({ type: 'positive', message: 'Form submitted.' });
      await store.fetchPending({ force: true });
      const next = store.nextRequired;
      if (next && next.id !== assignment.value.id) {
        await router.replace(`/forms/${next.id}`);
        await load();
        return;
      }
      const redirect = route.query.redirect;
      await router.replace(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/forms');
    } else {
      answers.value = { ...(saved.answers ?? answers.value) };
      $q.notify({ type: 'positive', message: 'Draft saved.' });
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Could not save the form.',
    });
  } finally {
    saving.value = false;
    submitting.value = false;
  }
}

function submit() {
  void save(true);
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.fill-form-page {
  background: #e8eef5;
  min-height: 100%;
}

.fill-form-canvas {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fill-form-title-card,
.fill-form-question {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.fill-form-title-card__bar {
  height: 10px;
  background: var(--q-primary);
}

.fill-form-title-card__body,
.fill-form-question {
  padding: 20px 24px;
}
</style>
