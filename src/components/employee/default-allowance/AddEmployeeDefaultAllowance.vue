<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-employee-default-allowance-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Employee Default Allowance</div>
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
              label="Save"
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
import { useEmployeeDefaultAllowanceStore } from '../../../stores/employee-default-allowance-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import AllowanceSelect from  '../../allowance/AllowanceSelect.vue';
import PayRateFrequencySelect from '../common/PayRateFrequencySelect.vue';
import AccountSelect from '../common/AccountSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [employeeDefaultAllowanceId: string];
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
      form.value.amount === null || form.value.amount === undefined) {
    return;
  }

  if (!employeeStore.selectedEmployee?.id) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: 'No employee selected',
    });
    return;
  }

  try {
    const newEmployeeDefaultAllowance = await employeeDefaultAllowanceStore.createEmployeeDefaultAllowance(
      employeeStore.selectedEmployee.id,
      form.value.allowanceId,
      form.value.frequencyId,
      form.value.accountId,
      form.value.note,
      form.value.amount
    );

    if (newEmployeeDefaultAllowance) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee default allowance created successfully!',
      });
      emit('saved', newEmployeeDefaultAllowance.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create employee default allowance';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  form.value = {
    allowanceId: null,
    frequencyId: null,
    accountId: null,
    amount: null,
    note: '',
  };
  isOpen.value = false;
};

// Watch for allowance selection to auto-populate amount
watch(() => form.value.allowanceId, (newAllowanceId) => {
  if (newAllowanceId && employeeStore.allowances.length > 0) {
    const selectedAllowance = employeeStore.allowances.find(a => a.id === newAllowanceId);
    if (selectedAllowance && selectedAllowance.defaultAmount !== null && selectedAllowance.defaultAmount !== undefined) {
      form.value.amount = selectedAllowance.defaultAmount;
    }
  }
});

// Fetch data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    // Reset form to ensure clean state
    form.value = {
      allowanceId: null,
      frequencyId: null,
      accountId: null,
      amount: null,
      note: '',
    };
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
.add-employee-default-allowance-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-employee-default-allowance-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

