<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">Contract expiry reminders</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        Supervisors, HR, and general managers are emailed using the
        <strong>Contract expiring</strong> template when an employment contract’s end date
        is approaching. The default windows are 3 months, 1 month, 1 week, and 1 day.
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-inner-loading :showing="store.isLoading">
        <q-spinner color="primary" size="32px" />
      </q-inner-loading>

      <q-toggle
        v-model="form.enabled"
        label="Send contract expiry reminders"
        :disable="store.isLoading || store.isSaving"
      />

      <div class="q-mt-md">
        <div class="text-caption text-grey-7 q-mb-xs">Reminder schedule</div>
        <div class="row q-gutter-xs q-mb-sm">
          <q-chip
            v-for="(offset, index) in form.offsets"
            :key="`${offset.value}-${offset.unit}-${index}`"
            removable
            color="primary"
            text-color="white"
            :disable="store.isLoading || store.isSaving"
            @remove="removeOffset(index)"
          >
            {{ offsetLabel(offset) }}
          </q-chip>
        </div>
        <div class="row items-end q-col-gutter-sm">
          <div class="col-5 col-sm-3">
            <q-input
              v-model.number="draft.value"
              type="number"
              min="1"
              max="36"
              dense
              outlined
              label="Amount"
              :disable="store.isLoading || store.isSaving"
            />
          </div>
          <div class="col-5 col-sm-4">
            <q-select
              v-model="draft.unit"
              :options="unitOptions"
              emit-value
              map-options
              dense
              outlined
              label="Before expiry"
              :disable="store.isLoading || store.isSaving"
            />
          </div>
          <div class="col-auto">
            <q-btn
              outline
              color="primary"
              label="Add"
              :disable="store.isLoading || store.isSaving"
              @click="addOffset"
            />
          </div>
        </div>
      </div>

      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          color="primary"
          label="Save schedule"
          :loading="store.isSaving"
          :disable="store.isLoading || form.offsets.length === 0"
          @click="save"
        />
        <q-btn
          flat
          label="Reset to default"
          :disable="store.isLoading || store.isSaving"
          @click="resetDefaults"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useHrSettingStore,
  type ContractExpiryOffset,
  type ReminderUnit,
} from '@hr/stores/hr-setting-store';

const $q = useQuasar();
const store = useHrSettingStore();
const { settings } = storeToRefs(store);

const unitOptions = [
  { label: 'Days', value: 'days' as ReminderUnit },
  { label: 'Weeks', value: 'weeks' as ReminderUnit },
  { label: 'Months', value: 'months' as ReminderUnit },
];

const form = reactive({
  enabled: true,
  offsets: [] as ContractExpiryOffset[],
});

const draft = reactive({
  value: 1,
  unit: 'weeks' as ReminderUnit,
});

function offsetLabel(offset: ContractExpiryOffset): string {
  const singular = offset.unit === 'months' ? 'month' : offset.unit === 'weeks' ? 'week' : 'day';
  return offset.value === 1 ? `1 ${singular}` : `${offset.value} ${offset.unit}`;
}

function syncFromStore() {
  if (!settings.value) {
    return;
  }
  form.enabled = settings.value.contractExpiryEnabled;
  form.offsets = settings.value.contractExpiryOffsets.map((item) => ({ ...item }));
}

function addOffset() {
  const value = Number(draft.value);
  if (!Number.isInteger(value) || value < 1 || value > 36) {
    $q.notify({ type: 'negative', message: 'Enter a whole number from 1 to 36.' });
    return;
  }
  if (form.offsets.some((item) => item.value === value && item.unit === draft.unit)) {
    $q.notify({ type: 'warning', message: 'That reminder window is already on the list.' });
    return;
  }
  form.offsets.push({ value, unit: draft.unit });
}

function removeOffset(index: number) {
  form.offsets.splice(index, 1);
}

function resetDefaults() {
  form.enabled = true;
  form.offsets = [
    { value: 3, unit: 'months' },
    { value: 1, unit: 'months' },
    { value: 1, unit: 'weeks' },
    { value: 1, unit: 'days' },
  ];
}

async function save() {
  if (form.offsets.length === 0) {
    $q.notify({ type: 'negative', message: 'Add at least one reminder window.' });
    return;
  }
  try {
    await store.saveSettings({
      contractExpiryEnabled: form.enabled,
      contractExpiryOffsets: form.offsets,
    });
    $q.notify({ type: 'positive', message: 'Contract expiry reminder schedule saved.' });
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
