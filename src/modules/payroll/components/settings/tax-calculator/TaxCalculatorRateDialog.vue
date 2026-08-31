<template>
  <q-dialog v-model="isOpen" position="right">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit tax rate' : 'New tax rate' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form id="tax-calculator-rate-form" @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-select
                v-model="form.category"
                :options="categoryOptions"
                emit-value
                map-options
                label="Category *"
                dense
                outlined
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.code" label="Code *" dense outlined hint="Example: BUSINESS_INCOME" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.name" label="Name *" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.rateDisplay"
                type="number"
                step="0.01"
                :suffix="isMultiplier ? '×' : '%'"
                :label="isMultiplier ? 'Multiplier *' : 'Rate % *'"
                dense
                outlined
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.iris_line" label="IRIS line" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="form.sort_order" type="number" label="Sort order" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.applies_to_accounts" label="Assignable on accounts" :disable="saving" />
            </div>
            <div class="col-12">
              <q-toggle v-model="form.is_active" label="Active" :disable="saving" />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
        <q-btn
          type="submit"
          form="tax-calculator-rate-form"
          color="primary"
          :loading="saving"
          :label="isEdit ? 'Save' : 'Create'"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useTaxCalculatorStore } from '@payroll/stores/tax-calculator-store';

const $q = useQuasar();
const store = useTaxCalculatorStore();
const saving = ref(false);

const categoryOptions = [
  { label: 'Business tax', value: 'business_tax' },
  { label: 'GST', value: 'gst' },
  { label: 'BTB', value: 'btb' },
  { label: 'Adjustment', value: 'adjustment' },
];

const form = reactive({
  id: '',
  category: 'business_tax',
  code: '',
  name: '',
  rateDisplay: 0,
  iris_line: '',
  applies_to_accounts: true,
  sort_order: 0,
  is_active: true,
});

const isEdit = computed(() => !!store.rateToEdit);
const isMultiplier = computed(() => form.code.toUpperCase() === 'GST_INPUT_RECOVERY_MULTIPLIER');
const isOpen = computed({
  get: () => store.isCreateRateOpen || !!store.rateToEdit,
  set: (value) => {
    if (!value) close();
  },
});

watch(
  () => store.rateToEdit,
  (rate) => {
    if (!rate) return;
    form.id = rate.id;
    form.category = rate.category;
    form.code = rate.code;
    form.name = rate.name;
    form.rateDisplay = rate.code === 'GST_INPUT_RECOVERY_MULTIPLIER' ? rate.rate : rate.rate * 100;
    form.iris_line = rate.iris_line ?? '';
    form.applies_to_accounts = rate.applies_to_accounts;
    form.sort_order = rate.sort_order;
    form.is_active = rate.is_active;
  },
);

function reset() {
  form.id = '';
  form.category = 'business_tax';
  form.code = '';
  form.name = '';
  form.rateDisplay = 0;
  form.iris_line = '';
  form.applies_to_accounts = true;
  form.sort_order = 0;
  form.is_active = true;
}

function close() {
  store.isCreateRateOpen = false;
  store.setRateToEdit(null);
  reset();
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    $q.notify({ color: 'negative', message: 'Code and name are required.', position: 'top' });
    return;
  }

  const rate = isMultiplier.value ? Number(form.rateDisplay) : Number(form.rateDisplay) / 100;
  const payload = {
    category: form.category,
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    rate,
    iris_line: form.iris_line.trim() || null,
    applies_to_accounts: form.applies_to_accounts,
    sort_order: form.sort_order,
    is_active: form.is_active,
  };

  saving.value = true;
  try {
    if (isEdit.value) {
      await store.updateRate(form.id, payload);
    } else {
      await store.createRate(payload);
    }
    $q.notify({ color: 'positive', message: 'Tax rate saved.', position: 'top' });
    close();
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error instanceof Error ? error.message : 'Save failed.',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
}
</script>
