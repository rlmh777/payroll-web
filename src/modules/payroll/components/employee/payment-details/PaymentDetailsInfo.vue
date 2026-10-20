<template>
  <div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <PaymentMethodSelect
          v-model="paymentMethodId"
          label="Payment method"
          :disable="readonly"
          :rules="[(val: number | string | null | undefined) => (val != null && val !== '') || 'Payment method is required']"
        />
      </div>
    </div>

    <q-banner
      v-if="selectedPaymentMethod && !requiresBankAccount"
      class="bg-blue-1 text-blue-10 q-mb-md"
      rounded
      dense
    >
      <template #avatar>
        <q-icon name="info" color="primary" />
      </template>
      {{ selectedPaymentMethod.name }} does not require a bank account.
    </q-banner>

    <manage-employee-banks
      v-if="requiresBankAccount"
      :employee-id="props.employeeId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeStore } from '@hr/stores/employee-store';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
import PaymentMethodSelect from '@hr/components/employee/common/PaymentMethodSelect.vue';
import ManageEmployeeBanks from './ManageEmployeeBanks.vue';
import type { PaymentMethod } from '@core/types/models';

const props = defineProps<{ employeeId: string }>();

const employeeStore = useEmployeeStore();
const { isTabEditable, canWriteField } = useEmployeeFormAccess();

const readonly = computed(
  () => !isTabEditable('payment_details') || !canWriteField('paymentMethodId', false),
);

const paymentMethodId = computed({
  get: () => employeeStore.selectedEmployee?.paymentMethodId || null,
  set: (value: number | string | null) => {
    if (employeeStore.selectedEmployee && canWriteField('paymentMethodId', false)) {
      employeeStore.selectedEmployee.paymentMethodId = value != null && value !== ''
        ? String(value)
        : '';
    }
  },
});

const selectedPaymentMethod = computed((): PaymentMethod | null => {
  const id = paymentMethodId.value;
  if (id == null || id === '') {
    return null;
  }
  return employeeStore.paymentMethods.find((method) => String(method.id) === String(id)) ?? null;
});

const requiresBankAccount = computed(() => {
  const method = selectedPaymentMethod.value;
  if (!method) {
    return true;
  }
  if (typeof method.requiresBankAccount === 'boolean') {
    return method.requiresBankAccount;
  }
  const name = (method.name || '').toLowerCase();
  return !(name.includes('cash') || name.includes('cheque') || name.includes('check'));
});

onMounted(async () => {
  if (employeeStore.paymentMethods.length === 0) {
    await employeeStore.fetchPaymentMethods();
  }
});
</script>
