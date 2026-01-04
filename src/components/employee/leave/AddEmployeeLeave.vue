<template>
  <q-dialog
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
        <q-form @submit="onSubmit" class="q-gutter-md">
          <LeaveTypeSelect
            v-model="form.leaveTypeId"
            :rules="[(val: number | null | undefined) => !!val || 'Leave type is required']"
            :disable="employeeLeaveStore.isLoading"
            @change="onLeaveTypeChange"
          />

          <q-input
            v-model="form.startDate"
            label="Start Date *"
            type="date"
            outlined
            :rules="[val => !!val || 'Start date is required']"
            :disable="employeeLeaveStore.isLoading"
            @update:model-value="onDateChange"
          />

          <q-input
            v-model="form.endDate"
            label="End Date *"
            type="date"
            outlined
            :rules="[
              val => !!val || 'End date is required',
              val => !form.startDate || val >= form.startDate || 'End date must be after start date'
            ]"
            :disable="employeeLeaveStore.isLoading"
            @update:model-value="onDateChange"
          />

          <LeaveDurationSelect
            v-if="areDatesValid"
            v-model="form.duration"
            :start-date="form.startDate"
            :end-date="form.endDate"
            :disable="employeeLeaveStore.isLoading"
            @change="onDurationChange"
          />

          <q-input
            v-if="form.duration === 'Custom'"
            v-model="form.fromTime"
            label="From Time *"
            type="time"
            outlined
            :rules="[val => !!val || 'From time is required']"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            v-if="form.duration === 'Custom'"
            v-model="form.toTime"
            label="To Time *"
            type="time"
            outlined
            :rules="[val => !!val || 'To time is required']"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            v-model.number="form.multiplier"
            label="Multiplier"
            type="number"
            step="0.1"
            min="0"
            outlined
            :disable="employeeLeaveStore.isLoading"
            hint="Leave multiplier (default: 1.0)"
          />

          <q-input
            v-model="form.notes"
            label="Notes"
            type="textarea"
            outlined
            rows="3"
            :disable="employeeLeaveStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="employeeLeaveStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="employeeLeaveStore.isLoading"
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
import { useEmployeeLeaveStore } from '../../../stores/employee-leave-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import LeaveDurationSelect from '../common/LeaveDurationSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [employeeLeaveId: string];
}>();

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const areDatesValid = computed(() => {
  if (!form.value.startDate || !form.value.endDate) {
    return false;
  }
  // Check if endDate is after or equal to startDate
  return form.value.endDate >= form.value.startDate;
});

const form = ref({
  leaveTypeId: null as number | null,
  startDate: '',
  endDate: '',
  duration: null as string | null,
  fromTime: null as string | null,
  toTime: null as string | null,
  totalDays: null as number | null,
  notes: '',
  multiplier: 1.0 as number,
});

const onLeaveTypeChange = (value: number | null) => {
  // Ensure form is updated when leave type changes (including when new one is added)
  form.value.leaveTypeId = value;
};

const onDurationChange = (value: string | null) => {
  form.value.duration = value;
  
  // Set default times based on duration
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
    // Keep existing times or leave null for user to set
    if (!form.value.fromTime) form.value.fromTime = null;
    if (!form.value.toTime) form.value.toTime = null;
  } else {
    // For 'All Days', set default times but they won't be shown
    form.value.fromTime = '08:00';
    form.value.toTime = '17:00';
  }
  
  calculateTotalDays();
};

const onDateChange = () => {
  calculateTotalDays();
  // Reset duration if dates change to ensure correct options are shown
  if (form.value.duration) {
    const start = new Date(form.value.startDate);
    const end = new Date(form.value.endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    // If duration becomes invalid for new date range, reset it
    if ((isSingleDay && form.value.duration === 'All Days') ||
        (!isSingleDay && form.value.duration === 'Full Day')) {
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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  
  // Adjust based on duration for single day
  if (diffDays === 1) {
    if (form.value.duration === 'Full Day') {
      form.value.totalDays = 1.0;
    } else if (form.value.duration === 'Morning' || form.value.duration === 'Afternoon') {
      form.value.totalDays = 0.5;
    } else if (form.value.duration === 'Custom' && form.value.fromTime && form.value.toTime) {
      // Calculate hours for custom duration
      const from = new Date(`2000-01-01T${form.value.fromTime}`);
      const to = new Date(`2000-01-01T${form.value.toTime}`);
      const hours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
      form.value.totalDays = hours / 8; // Assuming 8 hours = 1 day
    } else {
      form.value.totalDays = diffDays;
    }
  } else {
    // For multiple days, use the duration setting
    if (form.value.duration === 'All Days') {
      form.value.totalDays = diffDays;
    } else if (form.value.duration === 'Morning' || form.value.duration === 'Afternoon') {
      form.value.totalDays = diffDays * 0.5;
    } else if (form.value.duration === 'Custom' && form.value.fromTime && form.value.toTime) {
      // Calculate hours for custom duration per day
      const from = new Date(`2000-01-01T${form.value.fromTime}`);
      const to = new Date(`2000-01-01T${form.value.toTime}`);
      const hours = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
      form.value.totalDays = diffDays * (hours / 8); // Assuming 8 hours = 1 day
    } else {
      form.value.totalDays = diffDays;
    }
  }
};

const onSubmit = async () => {
  if (!form.value.leaveTypeId || !form.value.startDate || !form.value.endDate || 
      !form.value.duration || form.value.totalDays === null || form.value.totalDays === undefined) {
    return;
  }

  if (!employeeStore.selectedEmployee?.id) {
    console.error('No employee selected');
    return;
  }

  // For Custom duration, ensure times are provided
  if (form.value.duration === 'Custom' && (!form.value.fromTime || !form.value.toTime)) {
    return;
  }

  // Format time from HH:mm to HH:mm:00 for API
  const formatTimeForAPI = (time: string | null): string | null => {
    if (!time) return null;
    // If time is in HH:mm format, convert to HH:mm:00
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
      form.value.multiplier
    );

    if (newEmployeeLeave) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee leave created successfully!',
      });
      emit('saved', newEmployeeLeave.id);
      onClose();
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

const onClose = () => {
  form.value = {
    leaveTypeId: null,
    startDate: '',
    endDate: '',
    duration: null,
    fromTime: null,
    toTime: null,
    totalDays: null,
    notes: '',
    multiplier: 1.0,
  };
  isOpen.value = false;
};

// Fetch leave types when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    // Reset form to ensure clean state
    form.value = {
      leaveTypeId: null,
      startDate: '',
      endDate: '',
      duration: null,
      fromTime: null,
      toTime: null,
      totalDays: null,
      notes: '',
      multiplier: 1.0,
    };
    await employeeStore.fetchLeaveTypes();
  }
});

// Watch for time changes in Custom mode to recalculate totalDays
watch([() => form.value.fromTime, () => form.value.toTime], () => {
  if (form.value.duration === 'Custom') {
    calculateTotalDays();
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
</style>

