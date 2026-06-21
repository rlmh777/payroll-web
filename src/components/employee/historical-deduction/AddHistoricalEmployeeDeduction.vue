<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <q-card class="add-historical-deduction-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Historical Deduction</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <DeductionTypeSelect
            v-model="form.deductionTypeId"
            :rules="[(val: number | null | undefined) => !!val || 'Deduction type is required']"
            :disable="store.isLoading"
            :showAddNew="true"
          />

          <VendorSelect
            v-model="form.paymentToId"
            :rules="[(val: string | null | undefined) => !!val || 'Vendor is required']"
            :disable="store.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <AccountSelect
            v-model="form.accountId"
            :rules="[(val: string | null | undefined) => !!val || 'Account is required']"
            :disable="store.isLoading"
            :showAddNew="true"
            :showEdit="true"
          />

          <q-input
            v-model="form.payroll_run_id"
            label="Payroll Run ID *"
            outlined
            :rules="[(val: string | null | undefined) => !!val || 'Payroll run is required']"
            :disable="store.isLoading"
          />

          <q-input
            v-model.number="form.amount"
            label="Amount *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Amount is required']"
            :disable="store.isLoading"
          />

          <q-input
            v-model.number="form.carryForwardShortfall"
            label="Carry Forward Shortfall"
            type="number"
            step="0.01"
            min="0"
            outlined
            :disable="store.isLoading"
          />

          <q-input
            v-model.number="form.priority"
            label="Priority"
            type="number"
            min="0"
            step="1"
            outlined
            :disable="store.isLoading"
          />

          <q-input
            v-model="form.note"
            label="Note *"
            type="textarea"
            outlined
            rows="3"
            :rules="[(val: string | null | undefined) => !!val || 'Note is required']"
            :disable="store.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn flat label="Cancel" color="grey" @click="onClose" :disable="store.isLoading" />
            <q-btn type="submit" label="Save" color="primary" :loading="store.isLoading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useHistoricalEmployeeDeductionStore } from '../../../stores/historical-employee-deduction-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import DeductionTypeSelect from '../../deduction-type/DeductionTypeSelect.vue';
import VendorSelect from '../common/VendorSelect.vue';
import AccountSelect from '../common/AccountSelect.vue';

const $q = useQuasar();
const store = useHistoricalEmployeeDeductionStore();
const employeeStore = useEmployeeStore();

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'saved': [id: string] }>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  deductionTypeId: null as number | null,
  paymentToId: null as string | null,
  accountId: null as string | null,
  payroll_run_id: null as string | null,
  amount: null as number | null,
  note: '',
  carryForwardShortfall: 0,
  priority: 0,
});

const onSubmit = async () => {
  if (
    !form.value.deductionTypeId ||
    !form.value.paymentToId ||
    !form.value.accountId ||
    !form.value.payroll_run_id ||
    form.value.amount === null ||
    form.value.amount === undefined ||
    !form.value.note
  ) {
    return;
  }

  if (!employeeStore.selectedEmployee?.id) {
    $q.notify({ color: 'negative', message: 'No employee selected', position: 'top' });
    return;
  }

  const created = await store.createHistoricalEmployeeDeduction(employeeStore.selectedEmployee.id, {
    deductionTypeId: form.value.deductionTypeId,
    paymentToId: form.value.paymentToId,
    accountId: form.value.accountId,
    payroll_run_id: form.value.payroll_run_id,
    amount: form.value.amount,
    note: form.value.note,
    carryForwardShortfall: form.value.carryForwardShortfall,
    priority: form.value.priority,
  });

  if (created) {
    $q.notify({ color: 'positive', message: 'Historical deduction created', position: 'top' });
    emit('saved', created.id);
    onClose();
  } else if (store.error) {
    $q.notify({ color: 'negative', message: store.error, position: 'top' });
  }
};

const onClose = () => {
  form.value = {
    deductionTypeId: null,
    paymentToId: null,
    accountId: null,
    payroll_run_id: null,
    amount: null,
    note: '',
    carryForwardShortfall: 0,
    priority: 0,
  };
  isOpen.value = false;
};

watch(isOpen, (open) => {
  if (open) {
    form.value = {
      deductionTypeId: null,
      paymentToId: null,
      accountId: null,
      payroll_run_id: null,
      amount: null,
      note: '',
      carryForwardShortfall: 0,
      priority: 0,
    };
  }
});
</script>

<style scoped>
.add-historical-deduction-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}
.add-historical-deduction-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
