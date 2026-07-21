<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <q-card class="pool-type-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit pool type' : 'Add pool type' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.name"
            label="Display name *"
            outlined
            dense
            :disable="saving"
            :rules="[(val) => !!String(val ?? '').trim() || 'Name is required']"
            hint="Shown on payroll and employee screens (e.g. Tips, Shares, Service charge)"
          />
          <q-input
            v-model="form.code"
            label="Code *"
            outlined
            dense
            :disable="saving || isEdit"
            :rules="[(val) => !!String(val ?? '').trim() || 'Code is required']"
            hint="Stable internal key"
          />
          <q-select
            v-model="form.calculation_mode"
            :options="modeOptions"
            emit-value
            map-options
            label="Calculation mode *"
            outlined
            dense
            :disable="saving"
          />
          <q-select
            v-model="form.payroll_earning_code_id"
            :options="earningCodeOptions"
            emit-value
            map-options
            clearable
            label="Payroll earning code"
            outlined
            dense
            :disable="saving"
            hint="Optional posting code when this pool is paid"
          />
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-toggle v-model="form.is_active" label="Active" :disable="saving" />
            </div>
            <div class="col-6">
              <q-toggle
                v-model="form.requires_hours_eligibility"
                label="Require hours eligibility"
                :disable="saving"
              />
            </div>
            <div class="col-6">
              <q-toggle v-model="form.is_taxable" label="Taxable" :disable="saving" />
            </div>
            <div class="col-6">
              <q-toggle v-model="form.is_ss_subject" label="SS subject" :disable="saving" />
            </div>
          </div>
          <q-input
            v-model.number="form.sort_order"
            type="number"
            label="Sort order"
            outlined
            dense
            :disable="saving"
          />
          <q-input
            v-model="form.notes"
            type="textarea"
            label="Notes"
            outlined
            dense
            autogrow
            :disable="saving"
          />
          <div class="row q-gutter-sm justify-end">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="onClose" />
            <q-btn type="submit" color="primary" label="Save" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  usePoolDistributionTypeStore,
  POOL_CALCULATION_MODE_OPTIONS,
  type PoolCalculationMode,
  type PoolDistributionType,
} from '@payroll/stores/pool-distribution-type-store';
import { usePayrollEarningCodeStore } from '@payroll/stores/payroll-earning-code-store';

const props = defineProps<{
  modelValue: boolean;
  record?: PoolDistributionType | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = usePoolDistributionTypeStore();
const earningCodeStore = usePayrollEarningCodeStore();
const saving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEdit = computed(() => Boolean(props.record?.id));
const modeOptions = [...POOL_CALCULATION_MODE_OPTIONS];

const form = reactive({
  code: '',
  name: '',
  calculation_mode: 'weighted_points' as PoolCalculationMode,
  is_active: true,
  requires_hours_eligibility: true,
  payroll_earning_code_id: null as number | null,
  is_taxable: true,
  is_ss_subject: true,
  sort_order: 0,
  notes: '',
});

const earningCodeOptions = computed(() =>
  (earningCodeStore.earningCodes ?? []).map((code) => ({
    label: `${code.code} — ${code.name}`,
    value: code.id,
  })),
);

function resetForm() {
  form.code = props.record?.code ?? '';
  form.name = props.record?.name ?? '';
  form.calculation_mode = props.record?.calculation_mode ?? 'weighted_points';
  form.is_active = props.record?.is_active ?? true;
  form.requires_hours_eligibility = props.record?.requires_hours_eligibility ?? true;
  form.payroll_earning_code_id = props.record?.payroll_earning_code_id ?? null;
  form.is_taxable = props.record?.is_taxable ?? true;
  form.is_ss_subject = props.record?.is_ss_subject ?? true;
  form.sort_order = props.record?.sort_order ?? 0;
  form.notes = props.record?.notes ?? '';
}

function onClose() {
  isOpen.value = false;
}

async function onSubmit() {
  saving.value = true;
  try {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      calculation_mode: form.calculation_mode,
      is_active: form.is_active,
      requires_hours_eligibility: form.requires_hours_eligibility,
      payroll_earning_code_id: form.payroll_earning_code_id,
      is_taxable: form.is_taxable,
      is_ss_subject: form.is_ss_subject,
      sort_order: Number(form.sort_order) || 0,
      notes: form.notes || null,
    };

    if (isEdit.value && props.record) {
      await store.updateType(props.record.id, payload);
    } else {
      await store.createType(payload);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Pool type saved.' });
    emit('saved');
    onClose();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}

watch(() => props.modelValue, (open) => {
  if (open) resetForm();
});

onMounted(async () => {
  if (!earningCodeStore.earningCodes?.length) {
    await earningCodeStore.fetchEarningCodes();
  }
});
</script>

<style scoped>
.pool-type-dialog-card {
  width: min(480px, 100vw);
  max-height: 100vh;
  overflow: auto;
}
</style>
