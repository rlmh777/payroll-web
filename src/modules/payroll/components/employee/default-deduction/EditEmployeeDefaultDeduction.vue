<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-employee-default-deduction-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Employee Default Deduction</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <DeductionTypeSelect
            v-model="form.deductionTypeId"
            :rules="[(val: number | null | undefined) => !!val || 'Deduction type is required']"
            :disable="employeeDefaultDeductionStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <BankSelect
            v-model="form.bankId"
            label="Bank"
            clearable
            :disable="employeeDefaultDeductionStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <q-input
            v-model="form.accountNumber"
            label="Account Number"
            outlined
            maxlength="255"
            counter
            clearable
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <PayrollOccurrenceFields
            v-model:occurrence="form.occurrence"
            v-model:occurrence-cycle-length="form.occurrenceCycleLength"
            v-model:occurrence-cycle-offset="form.occurrenceCycleOffset"
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <q-input
            v-model.number="form.amount"
            label="Amount *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[
              val => val !== null && val !== undefined && val >= 0 || 'Amount is required',
              val => val <= 999999999999.99 || 'Amount must be less than 1,000,000,000,000'
            ]"
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <q-input
            v-model="form.note"
            label="Note"
            type="textarea"
            outlined
            rows="3"
            maxlength="255"
            counter
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <q-toggle
            v-model="form.allowPartialDeduction"
            label="Allow Partial Deduction"
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <q-input
            v-model="form.applicationRule"
            class="field-hint-multiline"
            label="Application Rule"
            outlined
            maxlength="255"
            counter
            hint="Examples: Stop when loan is paid off. Skip if net pay would go below $50. Hold while on unpaid leave."
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <q-input
            v-model.number="form.priority"
            label="Priority"
            type="number"
            min="0"
            step="1"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Priority must be 0 or greater']"
            :disable="employeeDefaultDeductionStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="employeeDefaultDeductionStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="employeeDefaultDeductionStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeDefaultDeductionStore } from '@/stores/employee-default-deduction-store';
import { useDeductionTypeStore } from '@/stores/deduction-type-store';
import DeductionTypeSelect from '@payroll/components/shared/deduction-type/DeductionTypeSelect.vue';
import BankSelect from '@payroll/components/shared/bank/BankSelect.vue';
import PayrollOccurrenceFields from '@payroll/components/shared/occurrence/PayrollOccurrenceFields.vue';
import {
  PAYROLL_OCCURRENCE,
  normalizePayrollOccurrenceFields,
  type PayrollOccurrence,
} from '@payroll/components/shared/occurrence/payroll-occurrence';
import type { EmployeeDefaultDeduction } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  employeeDefaultDeduction: EmployeeDefaultDeduction | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  employeeDefaultDeduction: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [employeeDefaultDeductionId: string];
}>();

const employeeDefaultDeductionStore = useEmployeeDefaultDeductionStore();
const deductionTypeStore = useDeductionTypeStore();

// Track initial deduction type ID to detect changes
const initialDeductionTypeId = ref<number | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  deductionTypeId: null as number | null,
  bankId: null as string | null,
  accountNumber: null as string | null,
  occurrence: PAYROLL_OCCURRENCE.everyPayroll as PayrollOccurrence,
  occurrenceCycleLength: null as number | null,
  occurrenceCycleOffset: null as number | null,
  amount: null as number | null,
  note: null as string | null,
  allowPartialDeduction: false,
  applicationRule: null as string | null,
  priority: 0,
});

const onSubmit = async () => {
  if (!form.value.deductionTypeId ||
      !form.value.occurrence ||
      form.value.amount === null || form.value.amount === undefined ||
      !props.employeeDefaultDeduction) {
    return;
  }

  try {
    const occurrence = normalizePayrollOccurrenceFields({
      occurrence: form.value.occurrence,
      occurrenceCycleLength: form.value.occurrenceCycleLength,
      occurrenceCycleOffset: form.value.occurrenceCycleOffset,
    });
    const updatedEmployeeDefaultDeduction = await employeeDefaultDeductionStore.updateEmployeeDefaultDeduction(
      props.employeeDefaultDeduction.id,
      undefined, // employeeId - not updating
      form.value.deductionTypeId,
      form.value.bankId,
      form.value.accountNumber,
      occurrence.occurrence,
      form.value.note,
      form.value.amount,
      {
        allowPartialDeduction: form.value.allowPartialDeduction,
        applicationRule: form.value.applicationRule,
        priority: form.value.priority,
        occurrenceCycleLength: occurrence.occurrenceCycleLength,
        occurrenceCycleOffset: occurrence.occurrenceCycleOffset,
      }
    );

    if (updatedEmployeeDefaultDeduction) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee default deduction updated successfully!',
      });
      emit('updated', updatedEmployeeDefaultDeduction.id);
      onClose();
    } else if (employeeDefaultDeductionStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: employeeDefaultDeductionStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update employee default deduction';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Watch for deduction type selection to auto-populate amount
watch(() => form.value.deductionTypeId, (newDeductionTypeId) => {
  if (newDeductionTypeId && deductionTypeStore.deductionTypes.length > 0) {
    const selectedDeductionType = deductionTypeStore.deductionTypes.find(dt => dt.id === newDeductionTypeId);
    if (selectedDeductionType && selectedDeductionType.defaultAmount !== null && selectedDeductionType.defaultAmount !== undefined) {
      // Only auto-populate if the deduction type has changed from the initial value
      if (newDeductionTypeId !== initialDeductionTypeId.value) {
        form.value.amount = selectedDeductionType.defaultAmount;
      }
    }
  }
});

// Load employee default deduction data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.employeeDefaultDeduction) {
    // Populate form with existing data
    form.value = {
      deductionTypeId: props.employeeDefaultDeduction.deductionTypeId || null,
      bankId: props.employeeDefaultDeduction.bankId || null,
      accountNumber: props.employeeDefaultDeduction.accountNumber || null,
      occurrence: (props.employeeDefaultDeduction.occurrence as PayrollOccurrence)
        || PAYROLL_OCCURRENCE.everyPayroll,
      occurrenceCycleLength: props.employeeDefaultDeduction.occurrenceCycleLength ?? null,
      occurrenceCycleOffset: props.employeeDefaultDeduction.occurrenceCycleOffset ?? null,
      amount: props.employeeDefaultDeduction.amount !== null && props.employeeDefaultDeduction.amount !== undefined ? props.employeeDefaultDeduction.amount : null,
      note: props.employeeDefaultDeduction.note || null,
      allowPartialDeduction: props.employeeDefaultDeduction.allowPartialDeduction ?? false,
      applicationRule: props.employeeDefaultDeduction.applicationRule || null,
      priority: props.employeeDefaultDeduction.priority ?? 0,
    };
    // Store initial deduction type ID to detect changes
    initialDeductionTypeId.value = props.employeeDefaultDeduction.deductionTypeId || null;
    // Fetch required data if not already loaded
    if (deductionTypeStore.deductionTypes.length === 0) {
      await deductionTypeStore.fetchDeductionTypes();
    }
  }
});
</script>

<style scoped>
.edit-employee-default-deduction-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-employee-default-deduction-card :deep(.q-card__section) {
  overflow-y: auto;
}

.field-hint-multiline :deep(.q-field__messages),
.field-hint-multiline :deep(.q-field__messages > div) {
  line-height: 1.6;
}
</style>

