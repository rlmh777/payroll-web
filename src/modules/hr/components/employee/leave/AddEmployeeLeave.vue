<template>
  <q-dialog
    v-if="!embedded"
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-employee-leave-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Employee Leave</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <LeaveFormFields
          v-model="form"
          :loading="employeeLeaveStore.isLoading"
          :are-dates-valid="areDatesValid"
          submit-label="Save"
          @leave-type-change="onLeaveTypeChange"
          @duration-change="onDurationChange"
          @date-change="onDateChange"
          @submit="onSubmit"
          @cancel="onClose"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <div v-else class="add-employee-leave-embedded">
    <LeaveFormFields
      v-model="form"
      :loading="employeeLeaveStore.isLoading"
      :disabled="Boolean(disabled)"
      :are-dates-valid="areDatesValid"
      :submit-label="props.submitLabel ?? 'Assign leave'"
      :cancel-label="props.cancelLabel ?? 'Reset'"
      @leave-type-change="onLeaveTypeChange"
      @duration-change="onDurationChange"
      @date-change="onDateChange"
      @submit="onSubmit"
      @cancel="resetForm"
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

const $q = useQuasar();

interface Props {
  modelValue?: boolean;
  embedded?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  embedded: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [employeeLeaveId: string];
}>();

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

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

const onClose = () => {
  resetForm();
  isOpen.value = false;
};

watch(isOpen, async (newValue) => {
  if (!props.embedded && newValue) {
    resetForm();
    await employeeStore.fetchLeaveTypes();
  }
});

watch([() => form.value.fromTime, () => form.value.toTime], () => {
  if (form.value.duration === 'Custom') {
    calculateTotalDays();
  }
});

onMounted(async () => {
  if (props.embedded) {
    await employeeStore.fetchLeaveTypes();
  }
});
</script>

<style scoped>
.add-employee-leave-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-employee-leave-card :deep(.q-card__section) {
  overflow-y: auto;
}

.add-employee-leave-embedded {
  width: 100%;
}
</style>
