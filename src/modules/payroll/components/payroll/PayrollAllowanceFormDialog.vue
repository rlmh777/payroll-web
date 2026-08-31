<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit other payment' : 'Add other payment' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="onSubmit">
          <AppDialogForm>
            <div class="col-12">
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
            </div>
            <div class="col-12">
              <DateField
                v-model="form.allowanceDate"
                label="Date"
                required
                :disable="Boolean(saving)"
                :rules="dateRules"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.allowanceId"
                :options="allowanceOptions"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                outlined
                dense
                label="Other Payment *"
                :disable="saving"
                :rules="[(val) => !!val || 'Other Payment is required']"
                @update:model-value="onAllowanceChanged"
              />
            </div>
            <div class="col-12">
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
            </div>
            <div class="col-12 col-sm-6">
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
            </div>
            <div class="col-12 col-sm-6">
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
            </div>
            <div class="col-12">
              <q-input
                :model-value="computedAmount"
                type="number"
                outlined
                dense
                readonly
                label="Amount (total)"
                hint="Calculated as quantity × unit amount"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.note"
                type="textarea"
                outlined
                dense
                label="Note"
                :disable="saving"
                rows="3"
              />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="onClose" />
        <q-btn
          unelevated
          color="primary"
          :label="isEdit ? 'Update' : 'Save'"
          :loading="saving"
          @click="onSubmit"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import type {
  HistoricalEmployeeAllowance,
  PayrollAllowanceEmployeeOption,
} from '@payroll/stores/payroll-allowance-store';
import type { Allowance, Account } from '@core/types/models';

const props = defineProps<{
  modelValue: boolean;
  record?: HistoricalEmployeeAllowance | null;
  payrollRunId: string | null;
  payPeriodStart?: string | null;
  payPeriodEnd?: string | null;
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
    allowanceDate: string;
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
  allowanceDate: localDateString(),
  quantity: 1 as number | null,
  unitAmount: null as number | null,
  note: '',
});

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampDateToPayPeriod(date: string, start?: string | null, end?: string | null): string {
  if (!start && !end) {
    return date;
  }

  if (start && date < start) {
    return start;
  }

  if (end && date > end) {
    return end;
  }

  return date;
}

const defaultAllowanceDate = computed(() => {
  const today = localDateString();
  return clampDateToPayPeriod(today, props.payPeriodStart, props.payPeriodEnd);
});

const dateRules = computed(() => [
  (val: string | null) => {
    if (!val) {
      return true;
    }

    if (props.payPeriodStart && val < props.payPeriodStart) {
      return `Date must be on or after ${props.payPeriodStart}`;
    }

    if (props.payPeriodEnd && val > props.payPeriodEnd) {
      return `Date must be on or before ${props.payPeriodEnd}`;
    }

    return true;
  },
]);

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
    const firstName = (employee.firstName ?? '').toLowerCase();
    const lastName = (employee.lastName ?? '').toLowerCase();
    const displayName = (employee.displayName ?? '').toLowerCase();
    const code = (employee.code ?? '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const reverseName = `${lastName} ${firstName}`.trim();

    return (
      displayName.includes(needle)
      || fullName.includes(needle)
      || reverseName.includes(needle)
      || firstName.includes(needle)
      || lastName.includes(needle)
      || code.includes(needle)
    );
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
    allowanceDate: defaultAllowanceDate.value,
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
    || !form.value.allowanceDate
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
    allowanceDate: string;
    note?: string;
  } = {
    employeeId: form.value.employeeId,
    allowanceId: form.value.allowanceId,
    accountId: form.value.accountId,
    payrollRunId: props.payrollRunId,
    allowanceDate: form.value.allowanceDate,
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
      const recordDate = record.allowanceDate ?? record.allowance_date ?? null;
      form.value = {
        employeeId: record.employeeId || record.employee_id || null,
        allowanceId: record.allowanceId || record.allowance_id || null,
        accountId: record.accountId || record.account_id || null,
        allowanceDate: recordDate
          ? clampDateToPayPeriod(recordDate.slice(0, 10), props.payPeriodStart, props.payPeriodEnd)
          : defaultAllowanceDate.value,
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

watch(
  () => [props.payPeriodStart, props.payPeriodEnd, props.modelValue] as const,
  ([start, end, open]) => {
    if (!open) {
      return;
    }

    form.value.allowanceDate = clampDateToPayPeriod(
      form.value.allowanceDate || defaultAllowanceDate.value,
      start,
      end,
    );
  },
);
</script>
