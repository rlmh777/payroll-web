<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-allowance-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Other Payment</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            :rules="[val => !!val || 'Name is required']"
            :disable="allowanceStore.isLoading"
          />

          <q-input
            v-model.number="form.defaultAmount"
            label="Default Amount *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[
              val => val !== null && val !== undefined && val >= 0 || 'Default amount is required',
              val => val <= 9999999999.99 || 'Amount must be less than 10,000,000,000'
            ]"
            :disable="allowanceStore.isLoading"
          />

          <AccountSelect
            v-model="form.accountId"
            :rules="[(val: string | null | undefined) => !!val || 'Account is required']"
            :disable="allowanceStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
            hint="GL account used when this other payment is processed on payroll."
          />

          <q-select
            v-model="form.payroll_earning_code_id"
            :options="earningCodeOptions"
            emit-value
            map-options
            clearable
            label="Payroll earning code"
            hint="Optional. Use this to report the payment as its own earning type even if it shares a GL account."
            outlined
            :disable="allowanceStore.isLoading"
          />

          <q-checkbox
            v-model="form.isTaxable"
            label="Is Taxable"
            :disable="allowanceStore.isLoading"
          />

          <q-checkbox
            v-model="form.isSocialSecurityDeductable"
            label="Is Social Security Deductable"
            :disable="allowanceStore.isLoading"
          />

          <q-input
            v-model="form.note"
            label="Note"
            type="textarea"
            outlined
            rows="3"
            maxlength="1024"
            counter
            :disable="allowanceStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="allowanceStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="allowanceStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAllowanceStore } from '@payroll/stores/allowance-store';
import { usePayrollEarningCodeStore } from 'src/stores/payroll-earning-code-store';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import type { Allowance } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  allowance: Allowance | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  allowance: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [allowanceId: string];
}>();

const allowanceStore = useAllowanceStore();
const earningCodeStore = usePayrollEarningCodeStore();
const earningCodeOptions = computed(() =>
  earningCodeStore.earningCodes
    .filter((code) => code.is_active)
    .map((code) => ({ label: `${code.code} — ${code.name}`, value: code.id })),
);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  defaultAmount: null as number | null,
  isTaxable: false,
  isSocialSecurityDeductable: false,
  note: '',
  payroll_earning_code_id: null as number | null,
  accountId: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name || form.value.defaultAmount === null || form.value.defaultAmount === undefined || !form.value.accountId || !props.allowance) {
    return;
  }

  try {
    const updatedAllowance = await allowanceStore.updateAllowance(
      props.allowance.id,
      form.value.name,
      form.value.defaultAmount,
      form.value.isTaxable,
      form.value.isSocialSecurityDeductable,
      form.value.note || null,
      form.value.payroll_earning_code_id,
      form.value.accountId,
    );

    if (updatedAllowance) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Other Payment updated successfully!',
      });
      emit('updated', updatedAllowance.id);
      onClose();
    } else if (allowanceStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: allowanceStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update other payment';
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

// Load allowance data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.allowance) {
    // Populate form with existing data
    form.value = {
      name: props.allowance.name || '',
      defaultAmount: props.allowance.defaultAmount !== null && props.allowance.defaultAmount !== undefined ? props.allowance.defaultAmount : null,
      isTaxable: props.allowance.isTaxable || false,
      isSocialSecurityDeductable: props.allowance.isSocialSecurityDeductable || false,
      note: props.allowance.note || '',
      payroll_earning_code_id: props.allowance.payroll_earning_code_id ?? null,
      accountId: props.allowance.accountId ?? props.allowance.account?.id ?? null,
    };
  }
});

onMounted(() => {
  void earningCodeStore.fetchEarningCodes();
});
</script>

<style scoped>
.edit-allowance-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-allowance-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

