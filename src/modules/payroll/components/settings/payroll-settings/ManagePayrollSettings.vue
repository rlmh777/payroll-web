<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="payroll-settings-card">
      <q-card-section>
        <div class="text-h6">Payroll settings</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Company-wide payroll calculation defaults and timesheet auto-lock policy.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model.number="form.incomeTaxRatePercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            suffix="%"
            label="Income tax rate"
            hint="Applied to annual taxable income after personal relief."
            outlined
            :disable="store.isLoading || store.isSaving"
            :rules="[
              (value) => value != null && value !== '' || 'Income tax rate is required',
              (value) => Number(value) >= 0 || 'Minimum is 0%',
              (value) => Number(value) <= 100 || 'Maximum is 100%',
            ]"
          />

          <q-input
            v-model.number="form.secondReliefAmount"
            type="number"
            min="0"
            step="0.01"
            prefix="$"
            label="Second relief"
            hint="Subtracted from annual income tax after the rate is applied."
            outlined
            :disable="store.isLoading || store.isSaving"
            :rules="[
              (value) => value != null && value !== '' || 'Second relief is required',
              (value) => Number(value) >= 0 || 'Minimum is 0',
            ]"
          />

          <q-separator />

          <div class="text-subtitle1 text-weight-bold">Timesheet auto-lock</div>
          <div class="text-body2 text-grey-7">
            Posted payroll runs automatically lock their period timesheets after the configured delay.
            Temporary unlocks and manual overrides are managed on
            <router-link to="/payroll/overview" class="text-primary text-weight-medium">Payroll Overview</router-link>.
          </div>

          <q-toggle
            v-model="form.timesheetAutoLockEnabled"
            label="Enable automatic timesheet lock after payroll"
            :disable="store.isLoading || store.isSaving"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.timesheetAutoLockTime"
                type="time"
                label="Lock time"
                hint="App timezone. Default is 5:00 PM."
                outlined
                :disable="store.isLoading || store.isSaving || !form.timesheetAutoLockEnabled"
                :rules="[(value) => Boolean(value) || 'Lock time is required']"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.timesheetAutoLockDaysAfterPayDate"
                type="number"
                min="0"
                max="30"
                step="1"
                label="Days after pay date"
                hint="1 means lock on the day after pay date at the lock time."
                outlined
                :disable="store.isLoading || store.isSaving || !form.timesheetAutoLockEnabled"
                :rules="[
                  (value) => value != null && value !== '' || 'Days after pay date is required',
                  (value) => Number(value) >= 0 || 'Minimum is 0',
                  (value) => Number(value) <= 30 || 'Maximum is 30',
                ]"
              />
            </div>
          </div>

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
import { usePayrollSettingStore } from '@payroll/stores/payroll-setting-store';

const $q = useQuasar();
const store = usePayrollSettingStore();
const { settings } = storeToRefs(store);

const form = reactive({
  incomeTaxRatePercent: 25,
  secondReliefAmount: 100,
  timesheetAutoLockEnabled: true,
  timesheetAutoLockTime: '17:00',
  timesheetAutoLockDaysAfterPayDate: 1,
});

function syncFormFromStore() {
  if (!settings.value) {
    return;
  }

  form.incomeTaxRatePercent = settings.value.incomeTaxRatePercent;
  form.secondReliefAmount = settings.value.secondReliefAmount;
  form.timesheetAutoLockEnabled = settings.value.timesheetAutoLockEnabled;
  form.timesheetAutoLockTime = settings.value.timesheetAutoLockTime;
  form.timesheetAutoLockDaysAfterPayDate = settings.value.timesheetAutoLockDaysAfterPayDate;
}

function resetForm() {
  syncFormFromStore();
}

async function save() {
  try {
    await store.updateSettings({
      incomeTaxRate: Number((Number(form.incomeTaxRatePercent) / 100).toFixed(4)),
      secondReliefAmount: Number(form.secondReliefAmount),
      timesheetAutoLockEnabled: form.timesheetAutoLockEnabled,
      timesheetAutoLockTime: form.timesheetAutoLockTime,
      timesheetAutoLockDaysAfterPayDate: Number(form.timesheetAutoLockDaysAfterPayDate),
    });

    $q.notify({
      type: 'positive',
      message: 'Payroll settings saved.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save payroll settings.',
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
.payroll-settings-card {
  max-width: 720px;
}
</style>
