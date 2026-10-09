<template>
  <q-dialog
    v-if="!embedded"
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ dialogTitle }}</div>
      </AppDialogHeader>
      <AppDialogBody>
        <LeaveFormFields
          v-model="form"
          :loading="employeeLeaveStore.isLoading"
          :are-dates-valid="areDatesValid"
          :accrued-hours="accruedHours"
          :submit-label="props.submitLabel ?? 'Save'"
          :lock-leave-type="Boolean(props.lockLeaveType)"
          :show-leave-type-actions="props.showLeaveTypeActions !== false"
          @leave-type-change="onLeaveTypeChange"
          @duration-change="onDurationChange"
          @date-change="onDateChange"
          @submit="onSubmit"
          @cancel="onClose"
        />
      </AppDialogBody>
    </AppDialogCard>
  </q-dialog>

  <div v-else class="add-employee-leave-embedded">
    <LeaveFormFields
      v-model="form"
      :loading="employeeLeaveStore.isLoading"
      :disabled="Boolean(disabled)"
      :are-dates-valid="areDatesValid"
      :accrued-hours="accruedHours"
      :submit-label="props.submitLabel ?? 'Assign leave'"
      :cancel-label="props.cancelLabel ?? 'Reset'"
      :lock-leave-type="Boolean(props.lockLeaveType)"
      :show-leave-type-actions="props.showLeaveTypeActions !== false"
      @leave-type-change="onLeaveTypeChange"
      @duration-change="onDurationChange"
      @date-change="onDateChange"
      @submit="onSubmit"
      @cancel="onEmbeddedCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeLeaveStore } from '@/stores/employee-leave-store';
import { useEmployeeStore } from '@/stores/employee-store';
import LeaveFormFields from './LeaveFormFields.vue';
import { leavePayMultiplierFromType } from '@hr/utils/leave-pay-utils';
import { useEmployeePoolStore } from '@payroll/stores/employee-pool-store';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';

const $q = useQuasar();

interface Props {
  modelValue?: boolean;
  embedded?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  title?: string;
  initialLeaveTypeId?: number | null;
  lockLeaveType?: boolean;
  showLeaveTypeActions?: boolean;
  /** When true, leave goes to accounts payment confirmation (skip supervisor/HR). */
  assigned?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  embedded: false,
  disabled: false,
  assigned: false,
  initialLeaveTypeId: null,
  lockLeaveType: false,
  showLeaveTypeActions: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [employeeLeaveId: string];
  cancel: [];
}>();

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();
const poolStore = useEmployeePoolStore();
const accruedHours = ref<number | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const dialogTitle = computed(() => props.title || 'Add Employee Leave');

type LeaveFormState = {
  leaveTypeId: number | null;
  startDate: string;
  endDate: string;
  duration: string | null;
  fromTime: string | null;
  toTime: string | null;
  totalDays: number | null;
  notes: string;
  multiplier: number;
  attachments: File[];
  applyHoursBank: boolean;
  leaveHours: number | null;
};

function emptyForm(): LeaveFormState {
  return {
    leaveTypeId: null,
    startDate: '',
    endDate: '',
    duration: null,
    fromTime: null,
    toTime: null,
    totalDays: null,
    notes: '',
    multiplier: 1.0,
    attachments: [],
    applyHoursBank: false,
    leaveHours: null,
  };
}

const form = ref<LeaveFormState>(emptyForm());

const areDatesValid = computed(() => {
  if (!form.value.startDate || !form.value.endDate) {
    return false;
  }
  return form.value.endDate >= form.value.startDate;
});

const onLeaveTypeChange = (value: number | null) => {
  form.value.leaveTypeId = value;
  const leaveType = value
    ? employeeStore.leaveTypes.find((item) => item.id === value) ?? null
    : null;
  form.value.multiplier = leavePayMultiplierFromType(leaveType);
};

const onDurationChange = (value: string | null) => {
  form.value.duration = value;

  if (value === 'Full Day') {
    form.value.fromTime = '08:00';
    form.value.toTime = '17:00';
  } else if (value === 'Morning') {
    form.value.fromTime = '08:00';
    form.value.toTime = '12:00';
  } else if (value === 'Afternoon') {
    form.value.fromTime = '13:00';
    form.value.toTime = '17:00';
  } else if (value === 'Custom') {
    if (!form.value.fromTime) form.value.fromTime = null;
    if (!form.value.toTime) form.value.toTime = null;
  } else {
    form.value.fromTime = '08:00';
    form.value.toTime = '17:00';
  }

  calculateTotalDays();
};

const onDateChange = () => {
  calculateTotalDays();
  if (form.value.duration) {
    const start = new Date(form.value.startDate);
    const end = new Date(form.value.endDate);
    const isSingleDay = start.toDateString() === end.toDateString();

    if (
      (isSingleDay && form.value.duration === 'All Days') ||
      (!isSingleDay && form.value.duration === 'Full Day')
    ) {
      form.value.duration = null;
      form.value.fromTime = null;
      form.value.toTime = null;
    }
  }
};

const calculateTotalDays = () => {
  if (!form.value.startDate || !form.value.endDate) {
    form.value.totalDays = null;
    return;
  }

  const start = new Date(form.value.startDate);
  const end = new Date(form.value.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays === 1) {
    if (form.value.duration === 'Full Day') {
      form.value.totalDays = 1.0;
    } else if (form.value.duration === 'Morning' || form.value.duration === 'Afternoon') {
      form.value.totalDays = 0.5;
    } else if (form.value.duration === 'Custom' && form.value.fromTime && form.value.toTime) {
      const from = new Date(`2000-01-01T${form.value.fromTime}`);
      const to = new Date(`2000-01-01T${form.value.toTime}`);
      const hours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
      form.value.totalDays = hours / 8;
    } else {
      form.value.totalDays = diffDays;
    }
  } else if (form.value.duration === 'All Days') {
    form.value.totalDays = diffDays;
  } else if (form.value.duration === 'Morning' || form.value.duration === 'Afternoon') {
    form.value.totalDays = diffDays * 0.5;
  } else if (form.value.duration === 'Custom' && form.value.fromTime && form.value.toTime) {
    const from = new Date(`2000-01-01T${form.value.fromTime}`);
    const to = new Date(`2000-01-01T${form.value.toTime}`);
    const hours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    form.value.totalDays = diffDays * (hours / 8);
  } else {
    form.value.totalDays = diffDays;
  }
};

const onSubmit = async () => {
  if (
    !form.value.leaveTypeId ||
    !form.value.startDate ||
    !form.value.endDate ||
    !form.value.duration ||
    form.value.totalDays === null ||
    form.value.totalDays === undefined
  ) {
    return;
  }

  if (!employeeStore.selectedEmployee?.id) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: 'Select an employee before assigning leave.',
    });
    return;
  }

  if (form.value.duration === 'Custom' && (!form.value.fromTime || !form.value.toTime)) {
    return;
  }

  const formatTimeForAPI = (time: string | null): string | null => {
    if (!time) return null;
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }
    return time;
  };

  try {
    const newEmployeeLeave = await employeeLeaveStore.createEmployeeLeave(
      employeeStore.selectedEmployee.id,
      form.value.leaveTypeId,
      form.value.startDate,
      form.value.endDate,
      formatTimeForAPI(form.value.fromTime),
      formatTimeForAPI(form.value.toTime),
      form.value.duration,
      form.value.totalDays,
      form.value.notes || null,
      form.value.multiplier,
      form.value.attachments ?? [],
      {
        applyHoursBank: form.value.applyHoursBank,
        leaveHours: form.value.leaveHours,
        assigned: props.assigned,
      },
    );

    if (newEmployeeLeave) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee leave created successfully!',
      });
      emit('saved', newEmployeeLeave.id);
      if (props.embedded) {
        resetForm();
      } else {
        onClose();
      }
    } else if (employeeLeaveStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: employeeLeaveStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create employee leave';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

function resetForm() {
  form.value = emptyForm();
}

function onEmbeddedCancel() {
  resetForm();
  emit('cancel');
}

const onClose = () => {
  resetForm();
  isOpen.value = false;
};

async function loadAccruedHours() {
  const employeeId = employeeStore.selectedEmployee?.id;
  if (!employeeId) {
    accruedHours.value = null;
    return;
  }
  try {
    const summary = await poolStore.fetchHoursBank(employeeId);
    accruedHours.value = Number(summary?.balanceHours ?? 0);
  } catch {
    accruedHours.value = null;
  }
}

watch(isOpen, async (newValue) => {
  if (!props.embedded && newValue) {
    resetForm();
    await Promise.all([employeeStore.fetchLeaveTypes(), loadAccruedHours()]);
    if (props.initialLeaveTypeId) {
      onLeaveTypeChange(props.initialLeaveTypeId);
    }
  }
});

watch(
  () => employeeStore.selectedEmployee?.id,
  () => {
    void loadAccruedHours();
  },
);

watch([() => form.value.fromTime, () => form.value.toTime], () => {
  if (form.value.duration === 'Custom') {
    calculateTotalDays();
  }
});

watch(
  () => props.initialLeaveTypeId,
  (id) => {
    if (!id) {
      return;
    }
    if (props.embedded || isOpen.value) {
      onLeaveTypeChange(id);
    }
  },
);

onMounted(async () => {
  if (props.embedded) {
    await Promise.all([employeeStore.fetchLeaveTypes(), loadAccruedHours()]);
    if (props.initialLeaveTypeId) {
      onLeaveTypeChange(props.initialLeaveTypeId);
    }
  }
});
</script>

<style scoped>
.add-employee-leave-embedded {
  width: 100%;
}
</style>
