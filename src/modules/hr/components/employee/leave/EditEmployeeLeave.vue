<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-employee-leave-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Employee Leave</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <LeaveTypeSelect
            v-model="form.leaveTypeId"
            :rules="[(val: number | null | undefined) => !!val || 'Leave type is required']"
            :disable="employeeLeaveStore.isLoading"
            :showAddNew="true"
            :showEdit="true"
            @change="onLeaveTypeChange"
          />

          <DateField
            v-model="form.startDate"
            label="Start Date *"
            required
            :disable="employeeLeaveStore.isLoading"
            @update:model-value="onDateChange"
          />

          <DateField
            v-model="form.endDate"
            label="End Date *"
            required
            :rules="[
              (val: string | null) => !form.startDate || (val !== null && val >= form.startDate) || 'End date must be after start date'
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

          <TimeField
            v-if="form.duration === 'Custom'"
            v-model="form.fromTime"
            label="From Time *"
            required
            :disable="employeeLeaveStore.isLoading"
          />

          <TimeField
            v-if="form.duration === 'Custom'"
            v-model="form.toTime"
            label="To Time *"
            required
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            :model-value="form.multiplier"
            label="Pay rate multiplier"
            type="number"
            step="0.1"
            min="0"
            outlined
            readonly
            :disable="employeeLeaveStore.isLoading"
            hint="Derived from the selected leave type (paid = 1.0, unpaid = 0)"
          />

          <q-input
            v-model="form.notes"
            label="Notes"
            type="textarea"
            outlined
            rows="3"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-banner
            v-if="certification.requiresCertification"
            rounded
            :class="needsNewProof ? 'bg-orange-1 text-orange-10' : 'bg-grey-2 text-grey-8'"
          >
            <template #avatar>
              <q-icon :name="needsNewProof ? 'warning' : 'info'" />
            </template>
            <div v-if="needsNewProof && certification.allowed <= 0">
              Medical documentation is required for this leave type.
            </div>
            <div v-else-if="needsNewProof">
              Medical documentation is required. This leave exceeds the
              {{ formatLeaveDays(certification.allowed) }} uncertified day(s) allowed this period.
            </div>
            <div v-else>
              {{ formatLeaveDays(certification.remaining) }} uncertified day(s) remaining this period
              without medical documentation.
            </div>
          </q-banner>

          <div v-if="existingAttachments.length" class="text-caption text-grey-7">
            On file: {{ existingAttachments.map((file) => file.fileName).join(', ') }}
          </div>

          <q-file
            v-model="form.attachments"
            :label="needsNewProof ? 'Medical documentation *' : 'Attachments'"
            outlined
            multiple
            clearable
            use-chips
            counter
            max-files="10"
            :accept="EMPLOYEE_DOCUMENT_ACCEPT"
            :disable="employeeLeaveStore.isLoading"
            :rules="attachmentRules"
            :hint="
              needsNewProof
                ? 'Required. PDF, Word, Excel, images, or text — up to 10 files, 20 MB each.'
                : 'Optional. PDF, Word, Excel, images, or text — up to 10 files, 20 MB each.'
            "
          >
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

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
              label="Update"
              color="primary"
              :loading="employeeLeaveStore.isLoading"
              :disable="needsNewProof && !hasNewAttachments"
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
import { useEmployeeLeaveStore } from '@/stores/employee-leave-store';
import { useEmployeeStore } from '@/stores/employee-store';
import DateField from '@core/components/common/DateField.vue';
import TimeField from '@core/components/common/TimeField.vue';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import LeaveDurationSelect from '../common/LeaveDurationSelect.vue';
import { EMPLOYEE_DOCUMENT_ACCEPT } from '@hr/components/employee/document/employee-document-form';
import { formatLeaveDays, leaveProofRequired } from '@hr/components/settings/leave/leave-type-form';
import { leavePayMultiplierFromType } from '@hr/utils/leave-pay-utils';
import { useLeaveBalanceStore } from '@hr/stores/leave-balance-store';
import type { EmployeeLeave } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  employeeLeave: EmployeeLeave | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  employeeLeave: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [employeeLeaveId: string];
}>();

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();
const leaveBalanceStore = useLeaveBalanceStore();

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
  attachments: [] as File[],
});

const existingAttachments = computed(() => props.employeeLeave?.attachments ?? []);
const hasExistingProof = computed(() => existingAttachments.value.length > 0);
const hasNewAttachments = computed(
  () => Array.isArray(form.value.attachments) && form.value.attachments.length > 0,
);

const selectedLeaveBalance = computed(() => {
  const leaveTypeId = form.value.leaveTypeId;
  if (leaveTypeId == null) {
    return null;
  }
  return leaveBalanceStore.balances.find((balance) => balance.leaveTypeId === leaveTypeId) ?? null;
});

const selectedLeaveType = computed(() => {
  const leaveTypeId = form.value.leaveTypeId;
  if (leaveTypeId == null) {
    return null;
  }
  return (employeeStore.leaveTypes ?? []).find((leaveType) => Number(leaveType.id) === leaveTypeId) ?? null;
});

const certification = computed(() => {
  const balance = selectedLeaveBalance.value;
  const leaveType = selectedLeaveType.value;
  const requiresCertification = Boolean(
    balance?.requiresCertification ?? leaveType?.requiresCertification,
  );
  const allowed = Number(balance?.uncertifiedDaysAllowed ?? leaveType?.uncertifiedDaysAllowed ?? 0);
  const used = Number(balance?.uncertifiedDaysUsed ?? 0);
  const currentUncertified = hasExistingProof.value
    ? 0
    : Number(props.employeeLeave?.totalDays ?? 0);
  const usedOthers = Math.max(0, used - currentUncertified);
  const remaining = Math.max(0, allowed - usedOthers);

  return {
    requiresCertification,
    allowed,
    used: usedOthers,
    remaining,
  };
});

const proofRequired = computed(() =>
  leaveProofRequired({
    requiresCertification: certification.value.requiresCertification,
    uncertifiedDaysAllowed: certification.value.allowed,
    uncertifiedDaysUsed: certification.value.used,
    requestedDays: form.value.totalDays,
  }),
);

const needsNewProof = computed(() => proofRequired.value && !hasExistingProof.value);

const attachmentRules = computed(() => {
  if (!needsNewProof.value) {
    return [];
  }
  return [
    (val: File[] | File | null | undefined) => {
      if (Array.isArray(val) && val.length > 0) {
        return true;
      }
      if (val instanceof File) {
        return true;
      }
      return 'Medical documentation is required for this leave.';
    },
  ];
});

const syncMultiplierFromLeaveType = (leaveTypeId: number | null) => {
  const leaveType = leaveTypeId
    ? (employeeStore.leaveTypes ?? []).find((item) => item.id === leaveTypeId) ?? null
    : null;
  form.value.multiplier = leavePayMultiplierFromType(leaveType);
};

const onLeaveTypeChange = (value: number | null) => {
  form.value.leaveTypeId = value;
  syncMultiplierFromLeaveType(value);
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
      !form.value.duration || form.value.totalDays === null || form.value.totalDays === undefined || 
      !props.employeeLeave) {
    return;
  }

  // For Custom duration, ensure times are provided
  if (form.value.duration === 'Custom' && (!form.value.fromTime || !form.value.toTime)) {
    return;
  }

  if (needsNewProof.value && !hasNewAttachments.value) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: 'Medical documentation is required for this leave.',
    });
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
    const updatedEmployeeLeave = await employeeLeaveStore.updateEmployeeLeave(
      props.employeeLeave.id,
      undefined, // employeeId - not updating
      form.value.leaveTypeId || undefined,
      form.value.startDate,
      form.value.endDate,
      formatTimeForAPI(form.value.fromTime),
      formatTimeForAPI(form.value.toTime),
      form.value.duration,
      form.value.totalDays,
      form.value.notes || null,
      form.value.multiplier,
      undefined,
      form.value.attachments ?? [],
    );

    if (updatedEmployeeLeave) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Employee leave updated successfully!',
      });
      emit('updated', updatedEmployeeLeave.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update employee leave';
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

// Load employee leave data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.employeeLeave) {
    // Populate form with existing data
    form.value = {
      leaveTypeId: props.employeeLeave.leaveTypeId ? (typeof props.employeeLeave.leaveTypeId === 'string' ? Number(props.employeeLeave.leaveTypeId) : props.employeeLeave.leaveTypeId) : null,
      startDate: props.employeeLeave.startDate || '',
      endDate: props.employeeLeave.endDate || '',
      duration: props.employeeLeave.duration || null,
      fromTime: props.employeeLeave.fromTime ? formatTimeForInput(props.employeeLeave.fromTime) : null,
      toTime: props.employeeLeave.toTime ? formatTimeForInput(props.employeeLeave.toTime) : null,
      totalDays: props.employeeLeave.totalDays !== null && props.employeeLeave.totalDays !== undefined ? props.employeeLeave.totalDays : null,
      notes: props.employeeLeave.notes || '',
      multiplier: 1.0,
      attachments: [],
    };
    // Fetch leave types if not already loaded
    if (employeeStore.leaveTypes.length === 0) {
      await employeeStore.fetchLeaveTypes();
    }
    syncMultiplierFromLeaveType(form.value.leaveTypeId);
    const employeeId = props.employeeLeave.employeeId;
    if (employeeId) {
      await leaveBalanceStore.fetchByEmployee(String(employeeId));
    }
  }
});

// Watch for time changes in Custom mode to recalculate totalDays
watch([() => form.value.fromTime, () => form.value.toTime], () => {
  if (form.value.duration === 'Custom') {
    calculateTotalDays();
  }
});

// Helper function to format time from API (HH:mm:ss) to input format (HH:mm)
const formatTimeForInput = (time: string): string => {
  if (!time) return '';
  // If time is in HH:mm:ss format, convert to HH:mm
  if (time.includes(':')) {
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};
</script>

<style scoped>
.edit-employee-leave-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-employee-leave-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

