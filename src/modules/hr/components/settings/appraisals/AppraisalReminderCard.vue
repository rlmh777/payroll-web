<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">Appraisal reminders</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        Assignees are emailed when an appraisal reaches their step, then reminded on this schedule until they act.
        Configure extra chain-of-command steps (supervisor, department head, skip-level, HR, accounts, or a role) in
        Admin → Pipelines.
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-inner-loading :showing="store.isLoading">
        <q-spinner color="primary" size="32px" />
      </q-inner-loading>

      <q-toggle
        v-model="form.enabled"
        label="Send appraisal action reminders"
        :disable="store.isLoading || store.isSaving"
      />

      <div class="row items-end q-col-gutter-sm q-mt-md">
        <div class="col-5 col-sm-3">
          <q-input
            v-model.number="form.value"
            type="number"
            min="1"
            max="30"
            dense
            outlined
            label="Every"
            :disable="store.isLoading || store.isSaving"
          />
        </div>
        <div class="col-5 col-sm-4">
          <q-select
            v-model="form.unit"
            :options="unitOptions"
            emit-value
            map-options
            dense
            outlined
            label="Interval"
            :disable="store.isLoading || store.isSaving"
          />
        </div>
      </div>

      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          color="primary"
          label="Save reminder schedule"
          :loading="store.isSaving"
          :disable="store.isLoading"
          @click="save"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useHrSettingStore } from '@hr/stores/hr-setting-store';

const $q = useQuasar();
const store = useHrSettingStore();
const { settings } = storeToRefs(store);

const unitOptions = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
];

const form = reactive({
  enabled: true,
  value: 2,
  unit: 'days' as 'days' | 'weeks',
});

function syncFromStore() {
  if (!settings.value) {
    return;
  }
  form.enabled = settings.value.appraisalReminderEnabled;
  form.value = settings.value.appraisalReminderIntervalValue;
  form.unit = settings.value.appraisalReminderIntervalUnit;
}

async function save() {
  const value = Number(form.value);
  if (!Number.isInteger(value) || value < 1 || value > 30) {
    $q.notify({ type: 'negative', message: 'Enter a whole number from 1 to 30.' });
    return;
  }
  try {
    await store.saveSettings({
      appraisalReminderEnabled: form.enabled,
      appraisalReminderIntervalValue: value,
      appraisalReminderIntervalUnit: form.unit,
    });
    $q.notify({ type: 'positive', message: 'Appraisal reminder schedule saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save reminder schedule.',
    });
  }
}

watch(settings, syncFromStore, { immediate: true });

onMounted(() => {
  void store.fetchSettings();
});
</script>
