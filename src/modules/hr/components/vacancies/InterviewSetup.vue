<template>
  <div class="q-mt-lg">
    <div class="text-subtitle2">Interview</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Assign a score sheet and panel for the shortlisted candidates. Each member receives a private link and an email code.
      Removing a member invalidates that link. HR decides who is hired by converting an applicant to staff.
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-8">
        <q-select
          v-model="scoreSheetId"
          outlined
          dense
          emit-value
          map-options
          label="Score sheet"
          :options="scoreSheetOptions"
          :loading="formStore.isLoading"
        />
      </div>
      <div class="col-12 col-sm-4">
        <q-btn
          class="full-width"
          color="primary"
          label="Assign score sheet"
          :loading="store.isSaving"
          :disable="!scoreSheetId"
          @click="assignSheet"
        />
      </div>
    </div>

    <q-btn-toggle
      v-model="memberType"
      class="q-mb-sm"
      no-caps
      unelevated
      toggle-color="primary"
      :options="[
        { label: 'Internal', value: 'internal' },
        { label: 'External', value: 'external' },
      ]"
    />

    <AppDialogForm>
      <template v-if="memberType === 'internal'">
        <div class="col-12 col-sm-8">
          <q-select
            v-model="employeeId"
            outlined
            dense
            emit-value
            map-options
            use-input
            input-debounce="250"
            label="Employee"
            :options="employeeOptions"
            @filter="filterEmployees"
          />
        </div>
      </template>
      <template v-else>
        <div class="col-12 col-sm-4">
          <q-input v-model="externalName" outlined dense label="Name" />
        </div>
        <div class="col-12 col-sm-4">
          <q-input v-model="externalEmail" outlined dense type="email" label="Email" />
        </div>
      </template>
      <div class="col-12 col-sm-4">
        <q-btn
          class="full-width"
          color="primary"
          label="Invite"
          :loading="store.isSaving"
          @click="sendInvite"
        />
      </div>
    </AppDialogForm>

    <q-list v-if="activeMembers.length" bordered separator class="q-mt-md rounded-borders">
      <q-item v-for="member in activeMembers" :key="member.id">
        <q-item-section>
          <q-item-label>
            {{ member.name }}
            <q-badge class="q-ml-xs" outline color="grey-8">
              {{ member.member_type === 'internal' ? 'Internal' : 'External' }}
            </q-badge>
            <q-badge v-if="member.status === 'revoked'" class="q-ml-xs" color="negative">Removed</q-badge>
          </q-item-label>
          <q-item-label caption>
            {{ member.email }}
            <span v-if="recommendationName(member)"> · recommends {{ recommendationName(member) }}</span>
          </q-item-label>
        </q-item-section>
        <q-item-section v-if="member.status !== 'revoked'" side>
          <q-btn flat dense no-caps color="primary" label="Resend" @click="resend(member)" />
          <q-btn flat dense no-caps color="negative" label="Remove" @click="revoke(member)" />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-grey-7 q-mt-md">No panel members yet.</div>

    <div class="text-subtitle2 q-mt-lg">Scores and totals</div>
    <div v-if="!candidates.length" class="text-grey-7 q-mt-sm">No shortlisted candidates yet.</div>
    <q-list v-else bordered separator class="q-mt-sm rounded-borders">
      <q-expansion-item
        v-for="candidate in candidates"
        :key="candidate.application.id"
        :default-opened="candidate.application.id === highlightApplicationId"
        :label="candidate.application.applicant?.name || 'Candidate'"
        :caption="candidateCaption(candidate)"
      >
        <q-card flat>
          <q-card-section>
            <div class="row q-gutter-sm q-mb-sm">
              <q-badge color="deep-purple">
                {{ candidate.summary.count }} score{{ candidate.summary.count === 1 ? '' : 's' }}
              </q-badge>
              <q-badge outline color="deep-purple">Total {{ candidate.summary.total }}</q-badge>
              <q-badge v-if="candidate.summary.average != null" outline color="deep-purple">
                Average {{ candidate.summary.average }}
              </q-badge>
              <q-badge outline color="primary">
                {{ candidate.recommendations }} recommendation{{ candidate.recommendations === 1 ? '' : 's' }}
              </q-badge>
            </div>
            <div v-if="candidate.field_totals.length" class="q-mb-md">
              <div v-for="(field, fieldIndex) in candidate.field_totals" :key="fieldIndex" class="text-caption">
                {{ field.label }}: total {{ field.total }}
                <span v-if="field.average != null"> · avg {{ field.average }}</span>
                <span v-if="field.max != null"> / {{ field.max }}</span>
              </div>
            </div>
            <div v-if="!candidate.scores.length" class="text-grey-7">No submitted score sheets yet.</div>
            <q-card
              v-for="(score, scoreIndex) in candidate.scores"
              :key="scoreIndex"
              flat
              bordered
              class="q-mb-sm"
            >
              <q-card-section>
                <div class="text-weight-medium">
                  {{ score.scorer?.name || 'Panel member' }}
                  · {{ score.total_score ?? '—' }} / {{ score.max_score ?? '—' }}
                </div>
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
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QSelectProps } from 'quasar';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import { useFormTemplateStore } from '@hr/stores/form-template-store';
import {
  useVacancyPanelStore,
  type InterviewCandidateSummary,
  type VacancyPanelMember,
} from '@hr/stores/vacancy-panel-store';

const props = defineProps<{
  vacancyId: string;
  highlightApplicationId?: string | null;
}>();

const store = useVacancyPanelStore();
const formStore = useFormTemplateStore();
const $q = useQuasar();

const memberType = ref<'internal' | 'external'>('internal');
const employeeId = ref<string | null>(null);
const externalName = ref('');
const externalEmail = ref('');
const scoreSheetId = ref<string | null>(null);
const employeeOptions = ref<QSelectProps['options']>([]);

const scoreSheetOptions = computed(() =>
  formStore.scoreSheets.map((item) => ({ label: item.name, value: item.id })),
);
const candidates = computed(() => store.interview?.candidates ?? []);
const activeMembers = computed(() => store.members.filter((member) => member.status !== 'revoked'));

function recommendationName(member: VacancyPanelMember) {
  const match = candidates.value.find(
    (candidate) => candidate.application.id === member.recommended_application_id,
  );
  return match?.application.applicant?.name || '';
}

function candidateCaption(candidate: InterviewCandidateSummary) {
  const average = candidate.summary.average != null ? ` · avg ${candidate.summary.average}` : '';
  return `Total ${candidate.summary.total}${average}`;
}

function filterEmployees(value: string, update: (callback: () => void) => void) {
  void store.searchEmployees(value).then((rows) => {
    update(() => {
      employeeOptions.value = rows.map((row) => ({
        label: row.code ? `${row.name} (${row.code})` : row.name,
        value: row.id,
      }));
    });
  }).catch(() => {
    update(() => {
      employeeOptions.value = [];
    });
  });
}

async function assignSheet() {
  if (!scoreSheetId.value) {
    return;
  }
  try {
    await store.assignScoreSheet(props.vacancyId, scoreSheetId.value);
    $q.notify({ type: 'positive', message: 'Score sheet assigned.' });
    await store.fetchInterview(props.vacancyId);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not assign the score sheet.',
    });
  }
}

async function sendInvite() {
  try {
    if (memberType.value === 'internal') {
      if (!employeeId.value) {
        $q.notify({ type: 'negative', message: 'Choose an employee.' });
        return;
      }
      await store.invite(props.vacancyId, {
        member_type: 'internal',
        employee_id: employeeId.value,
      });
      employeeId.value = null;
    } else {
      if (!externalName.value.trim() || !externalEmail.value.trim()) {
        $q.notify({ type: 'negative', message: 'Name and email are required.' });
        return;
      }
      await store.invite(props.vacancyId, {
        member_type: 'external',
        name: externalName.value.trim(),
        email: externalEmail.value.trim(),
      });
      externalName.value = '';
      externalEmail.value = '';
    }
    $q.notify({ type: 'positive', message: 'Invitation sent.' });
    await store.fetchInterview(props.vacancyId);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not invite panel member.',
    });
  }
}

async function resend(member: VacancyPanelMember) {
  try {
    await store.resend(props.vacancyId, member.id);
    $q.notify({ type: 'positive', message: 'Invitation resent. The previous link no longer works.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not resend invitation.',
    });
  }
}

function revoke(member: VacancyPanelMember) {
  $q.dialog({
    title: 'Remove panel member?',
    message: `${member.name} will no longer be able to open the score sheet. Their link stops working.`,
    cancel: true,
    ok: { label: 'Remove', color: 'negative' },
  }).onOk(() => {
    void store.revoke(props.vacancyId, member.id)
      .then(() => store.fetchInterview(props.vacancyId))
      .catch((error: unknown) => {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Could not remove panel member.',
        });
      });
  });
}

onMounted(() => {
  void formStore.fetchTemplates({ purpose: 'score_sheet', activeOnly: true }).catch(() => undefined);
  void store.fetchInterview(props.vacancyId)
    .then((summary) => {
      scoreSheetId.value = summary.form_template?.id ?? null;
    })
    .catch((error: unknown) => {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Could not load the interview.',
      });
    });
});
</script>
