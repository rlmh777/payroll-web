<template>
  <q-page class="q-pa-md appraisal-review">
    <div v-if="store.isLoading && !appraisal" class="q-pa-xl text-center">
      <q-spinner color="primary" size="40px" />
    </div>
    <div v-else-if="error" class="q-pa-xl text-center text-grey-8">{{ error }}</div>
    <div v-else-if="appraisal" class="appraisal-review__layout">
      <q-card flat bordered>
        <q-card-section class="row items-start">
          <div class="col">
            <div class="text-h6">{{ appraisal.employee?.name }}</div>
            <div class="text-caption text-grey-7">
              {{ appraisal.period_label }}
              <span v-if="appraisal.employee?.code"> · {{ appraisal.employee.code }}</span>
            </div>
          </div>
          <q-badge :color="statusColor(appraisal.status)">{{ appraisal.status }}</q-badge>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="steps.length" class="q-gutter-sm">
          <q-chip
            v-for="step in steps"
            :key="String(step.id ?? step.key ?? step.label)"
            :color="step.key === currentStepKey ? 'primary' : 'grey-3'"
            :text-color="step.key === currentStepKey ? 'white' : 'grey-8'"
            dense
          >
            {{ step.label }}
          </q-chip>
        </q-card-section>
      </q-card>

      <q-card v-if="schema" flat bordered>
        <q-card-section>
          <div class="text-subtitle1">{{ appraisal.form_template?.name || 'Appraisal form' }}</div>
        </q-card-section>
        <q-card-section>
          <FormRenderer :schema="schema" :answers="answers" :disable="!appraisal.can_edit_form" @update:answers="answers = $event" />
        </q-card-section>
      </q-card>

      <q-card v-if="appraisal.can_act" flat bordered>
        <q-card-section>
          <div class="text-subtitle1">{{ appraisal.pipeline?.currentStep?.label || 'Action' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <template v-if="appraisal.is_hr_step">
            <div class="text-body2">HR must approve or decline this appraisal and record contract / increment recommendations for accounts.</div>
            <q-toggle v-model="hr.renew" label="Recommend renewing the contract" />
            <q-toggle v-model="hr.increment" label="Approve an increment" />
            <div v-if="hr.increment" class="row q-col-gutter-sm">
              <div class="col-5">
                <q-select v-model="hr.incrementType" :options="incrementTypes" emit-value map-options outlined dense label="Increment type" />
              </div>
              <div class="col-7">
                <q-input v-model.number="hr.incrementValue" type="number" min="0" outlined dense :label="hr.incrementType === 'percent' ? 'Percent' : 'Amount'" />
              </div>
            </div>
          </template>
          <q-input
            v-if="appraisal.is_accounts_step"
            v-model="accountsNotes"
            type="textarea"
            autogrow
            outlined
            dense
            label="Accounts notes"
          />
          <q-input v-model="note" type="textarea" autogrow outlined dense label="Note" />
          <div class="row q-gutter-sm">
            <q-btn
              v-if="appraisal.can_edit_form"
              outline
              color="primary"
              label="Save form"
              :loading="store.isSaving"
              @click="void saveForm(false)"
            />
            <q-btn color="primary" label="Approve" :loading="store.isSaving" @click="void act('approve')" />
            <q-btn outline color="negative" label="Reject" :loading="store.isSaving" @click="void act('reject')" />
            <q-btn flat label="Return" :loading="store.isSaving" @click="void act('return')" />
          </div>
        </q-card-section>
      </q-card>

      <q-card v-else-if="hasHrDecision" flat bordered>
        <q-card-section>
          <div class="text-subtitle1">HR recommendation</div>
          <div class="text-body2 q-mt-sm">{{ hrSummary }}</div>
          <div v-if="appraisal.hr_notes" class="text-body2 q-mt-sm">{{ appraisal.hr_notes }}</div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import { useAppraisalStore, type AppraisalActionPayload } from '@hr/stores/appraisal-store';
import type { FormSchema } from '@hr/stores/form-template-store';

const route = useRoute();
const store = useAppraisalStore();
const $q = useQuasar();
const error = ref<string | null>(null);
const answers = ref<Record<string, unknown>>({});
const note = ref('');
const accountsNotes = ref('');
const hr = reactive({
  renew: true,
  increment: false,
  incrementType: 'percent' as 'percent' | 'amount',
  incrementValue: 0,
});
const incrementTypes = [
  { label: 'Percent', value: 'percent' },
  { label: 'Amount', value: 'amount' },
];

const appraisal = computed(() => store.current);
const schema = computed<FormSchema | null>(() => {
  return appraisal.value?.form_response?.schema ?? appraisal.value?.form_template?.schema ?? null;
});
const steps = computed(() => appraisal.value?.pipeline?.template?.steps ?? []);
const currentStepKey = computed(() => appraisal.value?.pipeline?.currentStep?.key);
const hasHrDecision = computed(() => appraisal.value?.hr_renew_contract != null || appraisal.value?.hr_increment_approved != null);
const hrSummary = computed(() => {
  if (!appraisal.value) return '';
  const parts: string[] = [];
  if (appraisal.value.hr_renew_contract != null) {
    parts.push(appraisal.value.hr_renew_contract ? 'Renew contract' : 'Do not renew contract');
  }
  if (appraisal.value.hr_increment_approved) {
    const value = appraisal.value.hr_increment_value ?? '';
    const suffix = appraisal.value.hr_increment_type === 'percent' ? '%' : '';
    parts.push(`Increment approved${value !== '' ? `: ${value}${suffix}` : ''}`);
  } else if (appraisal.value.hr_increment_approved === false) {
    parts.push('No increment');
  }
  return parts.join(' · ');
});

function statusColor(status: string) {
  if (status === 'approved') return 'positive';
  if (status === 'rejected') return 'negative';
  if (status === 'cancelled') return 'grey';
  return 'primary';
}

function syncFromAppraisal() {
  const current = store.current;
  answers.value = { ...(current?.form_response?.answers ?? {}) };
  accountsNotes.value = current?.accounts_notes ?? '';
  hr.renew = current?.hr_renew_contract !== false;
  hr.increment = Boolean(current?.hr_increment_approved);
  hr.incrementType = current?.hr_increment_type === 'amount' ? 'amount' : 'percent';
  hr.incrementValue = current?.hr_increment_value ?? 0;
}

async function load() {
  error.value = null;
  try {
    await store.fetchOne(String(route.params.id));
    syncFromAppraisal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'This appraisal is not available.';
  }
}

async function saveForm(submit: boolean) {
  if (!appraisal.value) return;
  try {
    await store.saveForm(appraisal.value.id, answers.value, submit);
    $q.notify({ type: 'positive', message: submit ? 'Form submitted.' : 'Form saved.' });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Could not save the form.',
    });
  }
}

async function act(action: 'approve' | 'reject' | 'return') {
  if (!appraisal.value) return;
  try {
    const payload: AppraisalActionPayload = {
      action,
      note: note.value || null,
      answers: answers.value,
      submit_form: action === 'approve',
    };
    if (appraisal.value.is_hr_step) {
      payload.hr_renew_contract = hr.renew;
      payload.hr_increment_approved = hr.increment;
      payload.hr_notes = note.value || null;
      if (hr.increment) {
        payload.hr_increment_type = hr.incrementType;
        payload.hr_increment_value = hr.incrementValue;
      }
    }
    if (appraisal.value.is_accounts_step) {
      payload.accounts_notes = accountsNotes.value || null;
    }
    await store.act(appraisal.value.id, payload);
    syncFromAppraisal();
    $q.notify({ type: 'positive', message: 'Appraisal updated.' });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Could not update the appraisal.',
    });
  }
}

watch(() => route.params.id, () => {
  void load();
});

onMounted(() => {
  void load();
});
</script>

<style scoped>
.appraisal-review__layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 880px;
}
</style>
