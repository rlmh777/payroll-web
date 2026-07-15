<template>
  <q-page class="q-pa-md">
    <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md">
        <div class="text-h4 text-weight-bold">{{ title || 'Payroll' }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Lock timesheet work dates so historical records can no longer be edited.
        </div>
      </div>
    </div>

    <q-card flat bordered class="payroll-lock-card">
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-icon name="lock" color="primary" size="22px" />
          <div class="text-h6">Timesheet edit lock</div>
        </div>
        <div class="text-body2 text-grey-7">
          Set one cut-off date. Any timesheet with a work date before that date is locked and cannot be edited.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <DateField
              v-model="lockBeforeDate"
              label="Lock timesheets before"
              clearable
              :disable="store.isLoading || store.isSaving"
            />
          </div>
          <div class="col-12 col-sm-auto">
            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                icon="save"
                label="Save lock date"
                :loading="store.isSaving"
                :disable="store.isLoading"
                @click="saveLockDate"
              />
              <q-btn
                flat
                icon="lock_open"
                label="Clear lock"
                :disable="store.isLoading || store.isSaving || !lockBeforeDate"
                @click="clearLockDate"
              />
            </div>
          </div>
        </div>

        <q-banner
          v-if="lockBeforeDate"
          rounded
          class="bg-amber-1 text-grey-9 q-mt-md"
        >
          <template #avatar>
            <q-icon name="info" color="amber-9" />
          </template>
          Timesheets dated before <strong>{{ lockBeforeDate }}</strong> are locked.
          Records on or after that date remain editable until approved.
        </q-banner>
        <q-banner
          v-else
          rounded
          class="bg-grey-2 text-grey-8 q-mt-md"
        >
          <template #avatar>
            <q-icon name="lock_open" />
          </template>
          No lock date is set. Timesheet edit locks are currently off (approved rows are still read-only).
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { usePayrollSettingStore } from 'src/stores/payroll-setting-store';

defineProps<{
  title?: string;
}>();

const $q = useQuasar();
const store = usePayrollSettingStore();
const { settings } = storeToRefs(store);

const lockBeforeDate = ref<string | null>(null);

watch(
  settings,
  (value) => {
    lockBeforeDate.value = value?.timesheetLockBeforeDate ?? null;
  },
  { immediate: true },
);

async function saveLockDate() {
  try {
    await store.updateSettings({
      timesheetLockBeforeDate: lockBeforeDate.value?.trim() || null,
    });
    $q.notify({
      type: 'positive',
      message: lockBeforeDate.value
        ? `Timesheets before ${lockBeforeDate.value} are now locked.`
        : 'Timesheet lock date cleared.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save timesheet lock date.',
    });
  }
}

async function clearLockDate() {
  lockBeforeDate.value = null;
  await saveLockDate();
}

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
.payroll-lock-card {
  max-width: 760px;
}
</style>
