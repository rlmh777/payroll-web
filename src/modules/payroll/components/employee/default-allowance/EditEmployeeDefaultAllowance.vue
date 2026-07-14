<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-employee-default-allowance-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Employee Default Allowance</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <AllowanceSelect
            v-model="form.allowanceId"
            :rules="[(val: string | null | undefined) => !!val || 'Allowance is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <PayRateFrequencySelect
            v-model="form.frequencyId"
            :rules="[(val: number | null | undefined) => !!val || 'Frequency is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
          />

          <AccountSelect
            v-model="form.accountId"
            :rules="[(val: string | null | undefined) => !!val || 'Account is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
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
            :disable="employeeDefaultAllowanceStore.isLoading"
          />

          <q-input
            v-model="form.note"
            label="Note"
            type="textarea"
            outlined
            rows="3"
            maxlength="1024"
            counter
            :disable="employeeDefaultAllowanceStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="employeeDefaultAllowanceStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="employeeDefaultAllowanceStore.isLoading"
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
import { useEmployeeDefaultAllowanceStore } from '@/stores/employee-default-allowance-store';
import { useEmployeeStore } from '@/stores/employee-store';
import AllowanceSelect from '@payroll/components/shared/allowance/AllowanceSelect.vue';
import PayRateFrequencySelect from '@hr/components/employee/common/PayRateFrequencySelect.vue';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import type { EmployeeDefaultAllowance } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  employeeDefaultAllowance: EmployeeDefaultAllowance | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  employeeDefaultAllowance: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [employeeDefaultAllowanceId: string];
}>();

const employeeDefaultAllowanceStore = useEmployeeDefaultAllowanceStore();
const employeeStore = useEmployeeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  allowanceId: null as string | null,
  frequencyId: null as number | null,
  accountId: null as string | null,
  amount: null as number | null,
  note: '',
});

const onSubmit = async () => {
  if (!form.value.allowanceId || !form.value.frequencyId || !form.value.accountId || 
      form.value.amount === null || form.value.amount === undefined || !form.value.note || 
      !props.employeeDefaultAllowance) {
    return;
  }

  try {
    const updatedEmployeeDefaultAllowance = await employeeDefaultAllowanceStore.updateEmployeeDefaultAllowance(
      props.employeeDefaultAllowance.id,
      undefined, // employeeId - not updating
      form.value.allowanceId,
      form.value.frequencyId,
      form.value.accountId,
      form.value.note,
      form.value.amount
    );

    if (updatedEmployeeDefaultAllowance) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee default allowance updated successfully!',
      });
      emit('updated', updatedEmployeeDefaultAllowance.id);
      onClose();
    } else if (employeeDefaultAllowanceStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: employeeDefaultAllowanceStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update employee default allowance';
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

// Track initial allowance ID to detect changes
const initialAllowanceId = ref<string | null>(null);

// Watch for allowance selection to auto-populate amount
watch(() => form.value.allowanceId, (newAllowanceId) => {
  if (newAllowanceId && employeeStore.allowances.length > 0) {
    const selectedAllowance = employeeStore.allowances.find(a => a.id === newAllowanceId);
    if (selectedAllowance && selectedAllowance.defaultAmount !== null && selectedAllowance.defaultAmount !== undefined) {
      // Only auto-populate if the allowance has changed from the initial value
      // This allows the user to change the allowance and get the new default amount
      if (newAllowanceId !== initialAllowanceId.value) {
        form.value.amount = selectedAllowance.defaultAmount;
      }
    }
  }
});

// Load employee default allowance data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.employeeDefaultAllowance) {
    // Populate form with existing data
    form.value = {
      allowanceId: props.employeeDefaultAllowance.allowanceId || null,
      frequencyId: props.employeeDefaultAllowance.frequencyId || null,
      accountId: props.employeeDefaultAllowance.accountId || null,
      amount: props.employeeDefaultAllowance.amount !== null && props.employeeDefaultAllowance.amount !== undefined ? props.employeeDefaultAllowance.amount : null,
      note: props.employeeDefaultAllowance.note || '',
    };
    // Store initial allowance ID to detect changes
    initialAllowanceId.value = props.employeeDefaultAllowance.allowanceId || null;
    // Fetch required data if not already loaded
    if (employeeStore.allowances.length === 0) {
      await employeeStore.fetchAllowances();
    }
    if (employeeStore.accounts.length === 0) {
      await employeeStore.fetchAccounts();
    }
    if (employeeStore.payrateFrequencies.length === 0) {
      await employeeStore.fetchPayrateFrequencies();
    }
  }
});
</script>

<style scoped>
.edit-employee-default-allowance-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-employee-default-allowance-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

