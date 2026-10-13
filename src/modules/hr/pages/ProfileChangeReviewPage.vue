<template>
  <q-page class="q-pa-md">
    <div v-if="store.isLoading && !row" class="q-pa-xl text-center">
      <q-spinner color="primary" size="40px" />
    </div>
    <div v-else-if="error" class="q-pa-xl text-center text-grey-8">{{ error }}</div>
    <div v-else-if="row" class="column q-gutter-md">
      <q-card flat bordered>
        <q-card-section class="row items-start">
          <div class="col">
            <div class="text-h6">{{ row.employee?.name }}</div>
            <div class="text-caption text-grey-7">
              Profile contact update
              <span v-if="row.employee?.code"> · {{ row.employee.code }}</span>
            </div>
          </div>
          <q-badge :color="statusColor(row.status)">{{ row.status }}</q-badge>
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

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1">Requested changes</div>
          <div class="text-caption text-grey-7">The employee record is not updated until this request is fully approved.</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-markup-table flat dense bordered>
            <thead>
              <tr>
                <th class="text-left">Field</th>
                <th class="text-left">Current</th>
                <th class="text-left">Requested</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="change in row.changes || []" :key="change.field">
                <td>{{ change.label }}</td>
                <td>{{ displayValue(change.currentLabel ?? change.current) }}</td>
                <td>{{ displayValue(change.proposedLabel ?? change.proposed) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>

      <q-card v-if="row.can_act || row.can_cancel" flat bordered>
        <q-card-section>
          <div class="text-subtitle1">{{ row.pipeline?.currentStep?.label || 'Action' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="note" type="textarea" autogrow outlined dense label="Note" />
          <div class="row q-gutter-sm">
            <q-btn v-if="row.can_act" color="primary" label="Approve" :loading="store.isSaving" @click="void act('approve')" />
            <q-btn v-if="row.can_act" outline color="negative" label="Reject" :loading="store.isSaving" @click="void act('reject')" />
            <q-btn v-if="row.can_act" flat label="Return" :loading="store.isSaving" @click="void act('return')" />
            <q-btn v-if="row.can_cancel" flat color="grey-8" label="Cancel" :loading="store.isSaving" @click="void act('cancel')" />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useProfileChangeStore } from '@hr/stores/profile-change-store';

const route = useRoute();
const store = useProfileChangeStore();
const $q = useQuasar();
const error = ref<string | null>(null);
const note = ref('');

const row = computed(() => store.current);
const steps = computed(() => row.value?.pipeline?.template?.steps ?? []);
const currentStepKey = computed(() => row.value?.pipeline?.currentStep?.key);

function statusColor(status: string) {
  if (status === 'approved') return 'positive';
  if (status === 'rejected') return 'negative';
  if (status === 'cancelled') return 'grey';
  return 'primary';
}

function displayValue(value: string | number | boolean | null | undefined) {
  if (value == null || value === '') return '—';
  return String(value);
}

async function act(action: 'approve' | 'reject' | 'return' | 'cancel') {
  if (!row.value) return;
  try {
    await store.act(row.value.id, action, note.value);
    $q.notify({ type: 'positive', message: 'Profile change updated.' });
  } catch (err) {
    $q.notify({ type: 'negative', message: err instanceof Error ? err.message : 'Action failed.' });
  }
}

onMounted(async () => {
  error.value = null;
  try {
    await store.fetchOne(String(route.params.id));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load this request.';
  }
});
</script>
