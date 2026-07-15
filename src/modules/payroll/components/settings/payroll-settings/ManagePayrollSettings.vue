<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="payroll-settings-card">
      <q-card-section>
        <div class="text-h6">Payroll settings</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Company-wide payroll calculation defaults.
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

          <q-banner rounded class="bg-blue-1 text-grey-9">
            <template #avatar>
              <q-icon name="lock" color="primary" />
            </template>
            Timesheet date locks are managed on the
            <router-link to="/payroll" class="text-primary text-weight-medium">Payroll</router-link>
            page.
          </q-banner>

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
import { usePayrollSettingStore } from 'src/stores/payroll-setting-store';

const $q = useQuasar();
const store = usePayrollSettingStore();
const { settings } = storeToRefs(store);

const form = reactive({
  incomeTaxRatePercent: 25,
  secondReliefAmount: 100,
});

function syncFormFromStore() {
  if (!settings.value) {
    return;
  }

  form.incomeTaxRatePercent = settings.value.incomeTaxRatePercent;
  form.secondReliefAmount = settings.value.secondReliefAmount;
}

function resetForm() {
  syncFormFromStore();
}

async function save() {
  try {
    await store.updateSettings({
      incomeTaxRate: Number((Number(form.incomeTaxRatePercent) / 100).toFixed(4)),
      secondReliefAmount: Number(form.secondReliefAmount),
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
