<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit pool type' : 'Add pool type' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form id="pool-type-form" @submit.prevent="onSubmit">
          <AppDialogForm>
            <div class="col-12">
              <q-input
                v-model="form.name"
                label="Display name *"
                outlined
                dense
                :disable="saving"
                :rules="[(val) => !!String(val ?? '').trim() || 'Name is required']"
                hint="Shown on payroll and employee screens (e.g. Tips, Shares, Service charge)"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.code"
                label="Code *"
                outlined
                dense
                :disable="saving || isEdit"
                :rules="[(val) => !!String(val ?? '').trim() || 'Code is required']"
                hint="Stable internal key"
              />
            </div>
            <div class="col-12">
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
            </div>
            <div class="col-12">
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
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.is_active" label="Active" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle
                v-model="form.requires_hours_eligibility"
                label="Require hours eligibility"
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.is_taxable" label="Taxable" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.is_ss_subject" label="SS subject" :disable="saving" />
            </div>
            <div v-if="form.calculation_mode === 'department_equal_share'" class="col-12">
              <div class="text-subtitle2">Department percentages</div>
              <div class="text-caption text-grey-7 q-mb-sm">
                Sub-departments inherit the parent split unless they have their own row. Configured percentages must add to 100%.
              </div>
              <div class="row items-center q-col-gutter-sm q-mb-sm" v-for="(row, index) in departmentShares" :key="index">
                <div class="col">
                  <q-select
                    v-model="row.department_id"
                    :options="departmentOptions"
                    emit-value
                    map-options
                    dense
                    outlined
                    label="Department"
                  />
                </div>
                <div class="col-4">
                  <q-input
                    v-model.number="row.percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    dense
                    outlined
                    suffix="%"
                    label="Share"
                  />
                </div>
                <div class="col-auto">
                  <q-btn flat round dense icon="delete" color="negative" @click="departmentShares.splice(index, 1)" />
                </div>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-btn dense outline icon="add" label="Add department" @click="addDepartmentShare" />
                <div class="text-caption" :class="percentTotal === 100 ? 'text-positive' : 'text-negative'">
                  Total {{ percentTotal.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.sort_order"
                type="number"
                label="Sort order"
                outlined
                dense
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.notes"
                type="textarea"
                label="Notes"
                outlined
                dense
                autogrow
                :disable="saving"
              />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="onClose" />
        <q-btn type="submit" form="pool-type-form" color="primary" label="Save" :loading="saving" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  usePoolDistributionTypeStore,
  POOL_CALCULATION_MODE_OPTIONS,
  type PoolCalculationMode,
  type PoolDistributionType,
} from '@payroll/stores/pool-distribution-type-store';
import { usePayrollEarningCodeStore } from '@payroll/stores/payroll-earning-code-store';
import { useDepartmentStore } from '@hr/stores/department-store';

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
const departmentStore = useDepartmentStore();
const saving = ref(false);
const departmentShares = ref<Array<{ department_id: number | null; percent: number }>>([]);

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

const departmentOptions = computed(() =>
  (departmentStore.departmentOptions.length ? departmentStore.departmentOptions : departmentStore.departments).map((department) => ({
    label: department.parent?.name ? `${department.parent.name} / ${department.name}` : department.name,
    value: department.id,
  })),
);

const percentTotal = computed(() =>
  Math.round(departmentShares.value.reduce((sum, row) => sum + (Number(row.percent) || 0), 0) * 100) / 100,
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
  const shares = props.record?.departmentShares ?? props.record?.department_shares ?? [];
  departmentShares.value = shares.map((share) => ({
    department_id: Number(share.department_id ?? share.departmentId ?? 0) || null,
    percent: Number(share.percent ?? 0),
  }));
}

function addDepartmentShare() {
  departmentShares.value.push({ department_id: null, percent: 0 });
}

function onClose() {
  isOpen.value = false;
}

async function onSubmit() {
  saving.value = true;
  try {
    if (form.calculation_mode === 'department_equal_share' && percentTotal.value !== 100) {
      $q.notify({
        color: 'negative',
        position: 'top',
        message: 'Department tip percentages must add up to 100%.',
      });
      saving.value = false;
      return;
    }

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
      department_shares: form.calculation_mode === 'department_equal_share'
        ? departmentShares.value
          .filter((row) => row.department_id && Number(row.percent) > 0)
          .map((row) => ({
            department_id: Number(row.department_id),
            percent: Number(row.percent),
          }))
        : [],
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
  if (!departmentStore.departmentOptions.length && !departmentStore.departments.length) {
    await departmentStore.fetchDepartmentOptions();
  }
});
</script>
