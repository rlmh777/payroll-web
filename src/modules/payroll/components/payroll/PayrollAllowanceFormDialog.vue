<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="payroll-allowance-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit allowance' : 'Add allowance' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="saving" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-select
            v-model="form.employeeId"
            :options="employeeOptions"
            option-value="id"
            option-label="displayName"
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            outlined
            dense
            label="Employee *"
            :disable="saving || isEdit"
            :rules="[(val) => !!val || 'Employee is required']"
            @filter="filterEmployees"
          />

          <q-select
            v-model="form.allowanceId"
            :options="allowanceOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            outlined
            dense
            label="Allowance *"
            :disable="saving"
            :rules="[(val) => !!val || 'Allowance is required']"
            @update:model-value="onAllowanceChanged"
          />

          <q-select
            v-model="form.accountId"
            :options="accountOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            outlined
            dense
            label="Account *"
            :disable="saving"
            :rules="[(val) => !!val || 'Account is required']"
            @filter="filterAccounts"
          />

          <q-input
            v-model.number="form.quantity"
            type="number"
            step="0.0001"
            min="0.0001"
            outlined
            dense
            label="Quantity *"
            :disable="saving"
            :rules="[(val) => (val !== null && val !== undefined && Number(val) > 0) || 'Quantity is required']"
          />

          <q-input
            v-model.number="form.unitAmount"
            type="number"
            step="0.01"
            min="0"
            outlined
            dense
            label="Unit amount *"
            :disable="saving"
            :rules="[(val) => (val !== null && val !== undefined && Number(val) >= 0) || 'Unit amount is required']"
          />

          <q-input
            :model-value="computedAmount"
            type="number"
            outlined
            dense
            readonly
            label="Amount (total)"
            hint="Calculated as quantity × unit amount"
          />

          <q-input
            v-model="form.note"
            type="textarea"
            outlined
            dense
            label="Note"
            :disable="saving"
            rows="3"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="onClose" />
            <q-btn
              unelevated
              color="primary"
              type="submit"
              :label="isEdit ? 'Update' : 'Save'"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  HistoricalEmployeeAllowance,
  PayrollAllowanceEmployeeOption,
} from '@payroll/stores/payroll-allowance-store';
import type { Allowance, Account } from '@core/types/models';

const props = defineProps<{
  modelValue: boolean;
  record?: HistoricalEmployeeAllowance | null;
  payrollRunId: string | null;
  employees: PayrollAllowanceEmployeeOption[];
  allowances: Allowance[];
  accounts: Account[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [payload: {
    employeeId: string;
    allowanceId: string;
    accountId: string;
    payrollRunId: string;
    quantity: number;
    unitAmount: number;
    note?: string;
  }];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEdit = computed(() => !!props.record?.id);

const form = ref({
  employeeId: null as string | null,
  allowanceId: null as string | null,
  accountId: null as string | null,
  quantity: 1 as number | null,
  unitAmount: null as number | null,
  note: '',
});

/** Quasar @filter requires options to be assigned inside update() via a ref. */
const employeeOptions = ref<PayrollAllowanceEmployeeOption[]>([]);
const accountOptions = ref<Account[]>([]);
const allowanceOptions = computed(() => props.allowances);

const computedAmount = computed(() => {
  const quantity = Number(form.value.quantity ?? 0);
  const unitAmount = Number(form.value.unitAmount ?? 0);
  return Math.round(quantity * unitAmount * 100) / 100;
});

const matchEmployees = (val: string): PayrollAllowanceEmployeeOption[] => {
  const needle = val.trim().toLowerCase();
  if (!needle) return [...props.employees];
  return props.employees.filter((employee) => {
    return `${employee.displayName} ${employee.code ?? ''} ${employee.firstName ?? ''} ${employee.lastName ?? ''}`
      .toLowerCase()
      .includes(needle);
  });
};

const matchAccounts = (val: string): Account[] => {
  const needle = val.trim().toLowerCase();
  if (!needle) return [...props.accounts];
  return props.accounts.filter((account) => {
    return `${account.name} ${account.code1 ?? ''}`.toLowerCase().includes(needle);
  });
};

const filterEmployees = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    employeeOptions.value = matchEmployees(val);
  });
};

const filterAccounts = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    accountOptions.value = matchAccounts(val);
  });
};

const syncSelectOptions = () => {
  employeeOptions.value = [...props.employees];
  accountOptions.value = [...props.accounts];
};

const onAllowanceChanged = (allowanceId: string | null) => {
  if (!allowanceId) return;
  const allowance = props.allowances.find((item) => item.id === allowanceId);
  if (allowance?.defaultAmount != null) {
    form.value.unitAmount = Number(allowance.defaultAmount);
  }
};

const resetForm = () => {
  form.value = {
    employeeId: null,
    allowanceId: null,
    accountId: null,
    quantity: 1,
    unitAmount: null,
    note: '',
  };
  syncSelectOptions();
};

const onClose = () => {
  isOpen.value = false;
};

const onSubmit = () => {
  if (
    !props.payrollRunId
    || !form.value.employeeId
    || !form.value.allowanceId
    || !form.value.accountId
    || form.value.quantity == null
    || form.value.unitAmount == null
  ) {
    return;
  }

  const payload: {
    employeeId: string;
    allowanceId: string;
    accountId: string;
    payrollRunId: string;
    quantity: number;
    unitAmount: number;
    note?: string;
  } = {
    employeeId: form.value.employeeId,
    allowanceId: form.value.allowanceId,
    accountId: form.value.accountId,
    payrollRunId: props.payrollRunId,
    quantity: Number(form.value.quantity),
    unitAmount: Number(form.value.unitAmount),
  };

  const note = form.value.note.trim();
  if (note !== '') {
    payload.note = note;
  }

  emit('save', payload);
};

watch(
  () => [props.modelValue, props.record] as const,
  ([open, record]) => {
    if (!open) {
      resetForm();
      return;
    }

    syncSelectOptions();

    if (record) {
      form.value = {
        employeeId: record.employeeId || record.employee_id || null,
        allowanceId: record.allowanceId || record.allowance_id || null,
        accountId: record.accountId || record.account_id || null,
        quantity: Number(record.quantity ?? 1),
        unitAmount: Number(record.unitAmount ?? record.amount ?? 0),
        note: record.note ?? '',
      };
      return;
    }

    resetForm();
  },
);

watch(
  () => [props.employees, props.accounts] as const,
  () => {
    if (props.modelValue) {
      syncSelectOptions();
    }
  },
);
</script>

<style scoped>
.payroll-allowance-dialog {
  width: min(420px, 100vw);
  max-height: 100vh;
}
</style>
