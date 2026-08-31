<template>
  <q-page class="q-pa-md">
    <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md">
        <div class="text-h4 text-weight-bold">{{ title || 'Payroll' }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Review timesheet lock status and open a temporary unlock window when corrections are urgently needed.
        </div>
      </div>
    </div>

    <q-card flat bordered class="payroll-lock-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-icon name="lock_clock" color="primary" size="22px" />
          <div class="text-h6">Automatic lock status</div>
        </div>
        <div class="text-body2 text-grey-7">
          Posted payroll timesheets lock automatically at
          <strong>{{ autoLockSummary.timeLabel }}</strong>
          on
          <strong>{{ autoLockSummary.daysLabel }}</strong>
          after each pay date.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-4">
            <div class="status-tile">
              <div class="text-caption text-grey-7">Auto-lock</div>
              <div class="text-subtitle1 text-weight-bold">
                {{ settings?.timesheetAutoLockEnabled ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="status-tile">
              <div class="text-caption text-grey-7">Current lock cutoff</div>
              <div class="text-subtitle1 text-weight-bold">
                {{ settings?.timesheetLockBeforeDate || 'Not set' }}
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="status-tile">
              <div class="text-caption text-grey-7">Temporary unlock</div>
              <div class="text-subtitle1 text-weight-bold">
                {{ unlockStatusLabel }}
              </div>
            </div>
          </div>
        </div>

        <q-banner
          v-if="settings?.timesheetUnlockActive"
          rounded
          class="bg-green-1 text-green-10 q-mb-md"
        >
          <template #avatar>
            <q-icon name="lock_open" color="positive" />
          </template>
          Work dates from <strong>{{ settings.timesheetUnlockStartDate }}</strong> through
          <strong>{{ settings.timesheetUnlockEndDate }}</strong> are temporarily editable.
        </q-banner>

        <q-banner
          v-if="settings?.timesheetLockBeforeDate"
          rounded
          class="bg-amber-1 text-grey-9 q-mb-md"
        >
          <template #avatar>
            <q-icon name="info" color="amber-9" />
          </template>
          Timesheets dated before <strong>{{ settings.timesheetLockBeforeDate }}</strong> are locked.
          Records on or after that date remain editable unless approved or paid.
        </q-banner>

        <div v-if="pendingLocks.length" class="q-mb-md">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">Upcoming automatic locks</div>
          <q-markup-table flat bordered separator="horizontal" class="pending-lock-table">
            <thead>
              <tr>
                <th class="text-left">Payroll</th>
                <th class="text-left">Period</th>
                <th class="text-left">Pay date</th>
                <th class="text-left">Locks at</th>
                <th class="text-left">Will lock before</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lock in pendingLocks" :key="lock.payrollRunId">
                <td>{{ lock.payrollNumber }}</td>
                <td>{{ formatPeriod(lock) }}</td>
                <td>{{ lock.payDate || '—' }}</td>
                <td>
                  <span :class="{ 'text-warning text-weight-medium': lock.isOverdue }">
                    {{ formatLockDueAt(lock.lockDueAt) }}
                  </span>
                </td>
                <td>{{ lock.proposedLockBeforeDate }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>

        <q-banner v-else rounded class="bg-grey-2 text-grey-8">
          <template #avatar>
            <q-icon name="task_alt" />
          </template>
          No posted payroll runs are waiting for an automatic timesheet lock.
        </q-banner>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="payroll-lock-card q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-icon name="lock_open" color="primary" size="22px" />
          <div class="text-h6">Temporary unlock window</div>
        </div>
        <div class="text-body2 text-grey-7">
          Use this for extreme cases. Work dates inside the window stay editable even if they would
          otherwise be locked.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-6 col-md-4">
            <DateField
              v-model="unlockStartDate"
              label="Unlock from"
              clearable
              :disable="store.isLoading || store.isSaving"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-4">
            <DateField
              v-model="unlockEndDate"
              label="Unlock through"
              clearable
              :disable="store.isLoading || store.isSaving"
            />
          </div>
          <div class="col-12 col-sm-auto">
            <div class="row q-gutter-sm">
              <q-btn
                color="primary"
                icon="save"
                label="Save unlock window"
                :loading="store.isSaving"
                :disable="store.isLoading"
                @click="saveUnlockWindow"
              />
              <q-btn
                flat
                icon="lock"
                label="Clear unlock"
                :disable="store.isLoading || store.isSaving || !hasUnlockWindow"
                @click="clearUnlockWindow"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="payroll-lock-card">
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-xs">
          <q-icon name="build" color="primary" size="22px" />
          <div class="text-h6">Manual lock override</div>
        </div>
        <div class="text-body2 text-grey-7">
          Advanced only. Normally the cutoff advances automatically after payroll. Change this only
          when you need to force a lock earlier or delay one manually.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
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
                label="Clear lock date"
                :disable="store.isLoading || store.isSaving || !lockBeforeDate"
                @click="clearLockDate"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import type { PendingTimesheetLock } from '@payroll/stores/payroll-setting-store';
import { usePayrollSettingStore } from '@payroll/stores/payroll-setting-store';

defineProps<{
  title?: string;
}>();

const $q = useQuasar();
const store = usePayrollSettingStore();
const { settings } = storeToRefs(store);

const lockBeforeDate = ref<string | null>(null);
const unlockStartDate = ref<string | null>(null);
const unlockEndDate = ref<string | null>(null);

watch(
  settings,
  (value) => {
    lockBeforeDate.value = value?.timesheetLockBeforeDate ?? null;
    unlockStartDate.value = value?.timesheetUnlockStartDate ?? null;
    unlockEndDate.value = value?.timesheetUnlockEndDate ?? null;
  },
  { immediate: true },
);

const pendingLocks = computed(() => settings.value?.pendingTimesheetLocks ?? []);

const hasUnlockWindow = computed(
  () => Boolean(unlockStartDate.value || unlockEndDate.value),
);

const unlockStatusLabel = computed(() => {
  if (!settings.value?.timesheetUnlockStartDate || !settings.value?.timesheetUnlockEndDate) {
    return 'Not set';
  }

  if (settings.value.timesheetUnlockActive) {
    return 'Active';
  }

  return `${settings.value.timesheetUnlockStartDate} – ${settings.value.timesheetUnlockEndDate}`;
});

const autoLockSummary = computed(() => {
  const days = settings.value?.timesheetAutoLockDaysAfterPayDate ?? 1;
  const time = settings.value?.timesheetAutoLockTime ?? '17:00';

  return {
    timeLabel: formatTimeLabel(time),
    daysLabel: days === 1 ? 'the day after pay date' : `${days} days after pay date`,
  };
});

function formatTimeLabel(value: string) {
  const [hourPart, minutePart = '00'] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour)) {
    return value;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatPeriod(lock: PendingTimesheetLock) {
  if (lock.periodStart && lock.periodEnd) {
    return `${lock.periodStart} – ${lock.periodEnd}`;
  }

  return lock.periodEnd || lock.periodStart || '—';
}

function formatLockDueAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function saveUnlockWindow() {
  if (unlockStartDate.value && unlockEndDate.value && unlockEndDate.value < unlockStartDate.value) {
    $q.notify({
      type: 'negative',
      message: 'Unlock end date must be on or after the start date.',
    });
    return;
  }

  try {
    await store.updateSettings({
      timesheetUnlockStartDate: unlockStartDate.value?.trim() || null,
      timesheetUnlockEndDate: unlockEndDate.value?.trim() || null,
    });
    $q.notify({
      type: 'positive',
      message: unlockStartDate.value && unlockEndDate.value
        ? `Temporary unlock saved for ${unlockStartDate.value} through ${unlockEndDate.value}.`
        : 'Temporary unlock window cleared.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save unlock window.',
    });
  }
}

async function clearUnlockWindow() {
  unlockStartDate.value = null;
  unlockEndDate.value = null;
  await saveUnlockWindow();
}

async function saveLockDate() {
  try {
    await store.updateSettings({
      timesheetLockBeforeDate: lockBeforeDate.value?.trim() || null,
    });
    $q.notify({
      type: 'positive',
      message: lockBeforeDate.value
        ? `Timesheets before ${lockBeforeDate.value} are now locked.`
        : 'Manual lock date cleared.',
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
  max-width: 960px;
}

.status-tile {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f4f7fb;
}

.pending-lock-table th {
  font-size: 12px;
  text-transform: uppercase;
  color: #52606d;
}
</style>
