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

          <AccountSelect
            v-model="form.accountId"
            :rules="[(val: string | null | undefined) => !!val || 'Account is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <q-input
            v-model.number="form.quantity"
            label="Quantity *"
            type="number"
            step="0.0001"
            min="0.0001"
            outlined
            :rules="[(val) => (val !== null && val !== undefined && val > 0) || 'Quantity is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
          />

          <q-input
            v-model.number="form.unitAmount"
            label="Unit amount *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[(val) => (val !== null && val !== undefined && val >= 0) || 'Unit amount is required']"
            :disable="employeeDefaultAllowanceStore.isLoading"
          />

          <q-input
            :model-value="computedAmount"
            label="Amount (total)"
            type="number"
            outlined
            readonly
            hint="Calculated as quantity × unit amount"
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
import { useEmployeeDefaultAllowanceStore } from '@/stores/employee-default-allowance-store';
import { useEmployeeStore } from '@/stores/employee-store';
import AllowanceSelect from '@payroll/components/shared/allowance/AllowanceSelect.vue';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [employeeDefaultAllowanceId: string];
}>();

const employeeDefaultAllowanceStore = useEmployeeDefaultAllowanceStore();
const employeeStore = useEmployeeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  allowanceId: null as string | null,
  accountId: null as string | null,
  quantity: 1 as number | null,
  unitAmount: null as number | null,
  note: '',
});

const computedAmount = computed(() => {
  const quantity = Number(form.value.quantity ?? 0);
  const unitAmount = Number(form.value.unitAmount ?? 0);
  return Math.round(quantity * unitAmount * 100) / 100;
});

const resetForm = () => {
  form.value = {
    allowanceId: null,
    accountId: null,
    quantity: 1,
    unitAmount: null,
    note: '',
  };
};

const onSubmit = async () => {
  if (
    !form.value.allowanceId
    || !form.value.accountId
    || form.value.quantity === null
    || form.value.quantity === undefined
    || form.value.unitAmount === null
    || form.value.unitAmount === undefined
  ) {
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
    const created = await employeeDefaultAllowanceStore.createEmployeeDefaultAllowance(
      employeeStore.selectedEmployee.id,
      form.value.allowanceId,
      form.value.accountId,
      form.value.note,
      form.value.quantity,
      form.value.unitAmount,
    );

    if (created) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee default allowance created successfully!',
      });
      emit('saved', created.id);
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
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to create employee default allowance',
    });
  }
};

const onClose = () => {
  resetForm();
  isOpen.value = false;
};

watch(() => form.value.allowanceId, (newAllowanceId) => {
  if (!newAllowanceId || employeeStore.allowances.length === 0) {
    return;
  }
  const selectedAllowance = employeeStore.allowances.find((a) => a.id === newAllowanceId);
  if (selectedAllowance?.defaultAmount != null) {
    form.value.unitAmount = selectedAllowance.defaultAmount;
  }
});

watch(isOpen, async (newValue) => {
  if (!newValue) {
    return;
  }
  resetForm();
  if (employeeStore.allowances.length === 0) {
    await employeeStore.fetchAllowances();
  }
  if (employeeStore.accounts.length === 0) {
    await employeeStore.fetchAccounts();
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
