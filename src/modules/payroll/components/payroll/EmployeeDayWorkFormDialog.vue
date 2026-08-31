<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit day / trip work' : 'Record day / trip work' }}</div>
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
                @update:model-value="onEmployeeChanged"
              />
            </div>
            <div class="col-12">
              <SsBenefitDateField
                v-model="form.date"
                label="Work date *"
                required
                :disable="saving === true"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model.number="form.units"
                type="number"
                step="0.01"
                min="0.01"
                outlined
                dense
                label="Units / trips *"
                hint="Example: 1 day, 2 trips, or 2.5 at supervisor discretion"
                :disable="saving"
                :rules="[(val) => (val !== null && val !== undefined && Number(val) > 0) || 'Units are required']"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model.number="form.dailyRate"
                type="number"
                step="0.01"
                min="0"
                outlined
                dense
                label="Daily rate *"
                hint="Defaults from employee compensation; admin/accountant can override"
                :disable="saving"
                :rules="[(val) => (val !== null && val !== undefined && Number(val) >= 0) || 'Daily rate is required']"
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
                hint="Calculated as units × daily rate"
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
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import type {
  DayWorkEmployeeOption,
  EmployeeDayWork,
} from '@payroll/stores/employee-day-work-store';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';

const props = defineProps<{
  modelValue: boolean;
  record?: EmployeeDayWork | null;
  employees: DayWorkEmployeeOption[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [payload: {
    employeeId: string;
    date: string;
    units: number;
    dailyRate: number;
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
  date: new Date().toISOString().slice(0, 10),
  units: 1 as number | null,
  dailyRate: null as number | null,
  note: '',
});

const employeeOptions = ref<DayWorkEmployeeOption[]>([]);

const computedAmount = computed(() => {
  const units = Number(form.value.units ?? 0);
  const dailyRate = Number(form.value.dailyRate ?? 0);
  return Math.round(units * dailyRate * 100) / 100;
});

const matchEmployees = (val: string): DayWorkEmployeeOption[] => {
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

const filterEmployees = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    employeeOptions.value = matchEmployees(val);
  });
};

const syncSelectOptions = () => {
  employeeOptions.value = [...props.employees];
};

const onEmployeeChanged = (employeeId: string | null) => {
  if (!employeeId) return;
  const employee = props.employees.find((item) => item.id === employeeId);
  if (employee && (form.value.dailyRate == null || form.value.dailyRate === 0)) {
    form.value.dailyRate = Number(employee.dailyRate ?? 0);
  }
};

const resetForm = () => {
  form.value = {
    employeeId: null,
    date: new Date().toISOString().slice(0, 10),
    units: 1,
    dailyRate: null,
    note: '',
  };
  syncSelectOptions();
};

const onClose = () => {
  isOpen.value = false;
};

const onSubmit = () => {
  if (
    !form.value.employeeId
    || !form.value.date
    || form.value.units == null
    || form.value.dailyRate == null
  ) {
    return;
  }

  const payload: {
    employeeId: string;
    date: string;
    units: number;
    dailyRate: number;
    note?: string;
  } = {
    employeeId: form.value.employeeId,
    date: form.value.date,
    units: Number(form.value.units),
    dailyRate: Number(form.value.dailyRate),
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
        employeeId: record.employeeId || null,
        date: String(record.date).slice(0, 10),
        units: Number(record.units ?? 1),
        dailyRate: Number(record.dailyRate ?? 0),
        note: record.note ?? '',
      };
      return;
    }

    resetForm();
  },
);

watch(
  () => props.employees,
  () => {
    if (props.modelValue) {
      syncSelectOptions();
    }
  },
);
</script>
