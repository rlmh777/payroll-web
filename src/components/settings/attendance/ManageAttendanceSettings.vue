<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="attendance-settings-card">
      <q-card-section>
        <div class="text-h6">Attendance settings</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Company-wide rules applied when clock punches are rounded into timesheet hours.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model.number="form.clockRoundOffMinutes"
            type="number"
            min="1"
            max="120"
            step="1"
            label="Clock round-off interval (minutes)"
            hint="Clock-in and clock-out round up to this interval. Example at 30 min: 7:51 in → 8:00, 4:52 out → 5:00."
            outlined
            :disable="store.isLoading || store.isSaving"
            :rules="[
              (value) => value != null && value !== '' || 'Round-off interval is required',
              (value) => Number(value) >= 1 || 'Minimum is 1 minute',
              (value) => Number(value) <= 120 || 'Maximum is 120 minutes',
            ]"
          />

          <q-select
            v-model="form.scheduleComparisonSource"
            :options="scheduleComparisonOptions"
            emit-value
            map-options
            label="Timesheet schedule comparison"
            hint="Controls which punch times are compared against the scheduled shift on /timesheet."
            outlined
            :disable="store.isLoading || store.isSaving"
          />

          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              label="Save"
              type="submit"
              :loading="store.isSaving"
              :disable="store.isLoading"
            />
            <q-btn
              flat
              label="Reset"
              :disable="store.isLoading || store.isSaving || !store.settings"
              @click="resetForm"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useAttendanceSettingStore,
  type ScheduleComparisonSource,
} from 'src/stores/attendance-setting-store';

const $q = useQuasar();
const store = useAttendanceSettingStore();
const { settings } = storeToRefs(store);

const scheduleComparisonOptions = [
  {
    label: 'Rounded in / rounded out',
    value: 'ROUNDED' as ScheduleComparisonSource,
  },
  {
    label: 'Raw clock in / clock out',
    value: 'CLOCK' as ScheduleComparisonSource,
  },
];

const form = reactive({
  clockRoundOffMinutes: 30,
  scheduleComparisonSource: 'ROUNDED' as ScheduleComparisonSource,
});

function syncFormFromStore() {
  if (!settings.value) {
    return;
  }

  form.clockRoundOffMinutes = settings.value.clockRoundOffMinutes;
  form.scheduleComparisonSource = settings.value.scheduleComparisonSource;
}

function resetForm() {
  syncFormFromStore();
}

async function save() {
  try {
    await store.updateSettings({
      clockRoundOffMinutes: Number(form.clockRoundOffMinutes),
      scheduleComparisonSource: form.scheduleComparisonSource,
    });

    $q.notify({
      type: 'positive',
      message: 'Attendance settings saved.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save attendance settings.',
    });
  }
}

watch(settings, syncFormFromStore, { immediate: true });

onMounted(async () => {
  const loaded = await store.fetchSettings();

  if (!loaded && store.error) {
    $q.notify({
      type: 'negative',
      message: store.error,
    });
  }
});
</script>

<style scoped>
.attendance-settings-card {
  max-width: 640px;
}
</style>
